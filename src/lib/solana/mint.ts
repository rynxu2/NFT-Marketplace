import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getConnection } from './connection';
import type { WalletContextState } from '@solana/wallet-adapter-react';

/** Metaplex Token Metadata Program ID */
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

interface MintNFTParams {
  wallet: WalletContextState;
  name: string;
  symbol: string;
  metadataUri: string;
  royaltyBps: number;
}

interface MintNFTResult {
  mintAddress: string;
  txSignature: string;
  tokenAccount: string;
}

function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

function createMetadataInstruction(
  metadataAccount: PublicKey,
  mint: PublicKey,
  mintAuthority: PublicKey,
  payer: PublicKey,
  updateAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string,
  royaltyBps: number
) {
  const data = Buffer.alloc(1000);
  let offset = 0;

  // Instruction discriminator: CreateMetadataAccountV3 = 33
  data.writeUInt8(33, offset);
  offset += 1;

  // Name (borsh string: 4 bytes length + content)
  const nameBytes = Buffer.from(name.slice(0, 32));
  data.writeUInt32LE(nameBytes.length, offset);
  offset += 4;
  nameBytes.copy(data, offset);
  offset += nameBytes.length;

  // Symbol (borsh string)
  const symbolBytes = Buffer.from(symbol.slice(0, 10));
  data.writeUInt32LE(symbolBytes.length, offset);
  offset += 4;
  symbolBytes.copy(data, offset);
  offset += symbolBytes.length;

  // URI (borsh string)
  const uriBytes = Buffer.from(uri);
  data.writeUInt32LE(uriBytes.length, offset);
  offset += 4;
  uriBytes.copy(data, offset);
  offset += uriBytes.length;

  // Seller fee basis points
  data.writeUInt16LE(royaltyBps, offset);
  offset += 2;

  // Creators: Option<Vec<Creator>> = Some([{address, verified, share}])
  data.writeUInt8(1, offset); // Some
  offset += 1;
  data.writeUInt32LE(1, offset); // vec length = 1
  offset += 4;
  // Creator: address (32 bytes) + verified (1 byte) + share (1 byte)
  mintAuthority.toBuffer().copy(data, offset);
  offset += 32;
  data.writeUInt8(1, offset); // verified = true (signer)
  offset += 1;
  data.writeUInt8(100, offset); // share = 100%
  offset += 1;

  // Collection: Option = None
  data.writeUInt8(0, offset);
  offset += 1;

  // Uses: Option = None
  data.writeUInt8(0, offset);
  offset += 1;

  // IsMutable
  data.writeUInt8(1, offset); // true
  offset += 1;

  // CollectionDetails: Option = None
  data.writeUInt8(0, offset);
  offset += 1;

  const instructionData = data.subarray(0, offset);

  return {
    programId: TOKEN_METADATA_PROGRAM_ID,
    keys: [
      { pubkey: metadataAccount, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: mintAuthority, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: updateAuthority, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  };
}

export async function mintNFT({
  wallet,
  name,
  symbol,
  metadataUri,
  royaltyBps,
}: MintNFTParams): Promise<MintNFTResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const connection = getConnection();
  const payer = wallet.publicKey;

  // Generate a new mint keypair
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Create mint account
  const mintRent = await connection.getMinimumBalanceForRentExemption(82);

  const createMintAccountIx = SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: mint,
    space: 82,
    lamports: mintRent,
    programId: TOKEN_PROGRAM_ID,
  });

  // Initialize mint (0 decimals for NFT)
  const { createInitializeMintInstruction } = await import('@solana/spl-token');
  const initMintIx = createInitializeMintInstruction(
    mint,
    0,
    payer,
    payer,
    TOKEN_PROGRAM_ID
  );

  // Get associated token account for the wallet
  const { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } =
    await import('@solana/spl-token');

  const ata = getAssociatedTokenAddressSync(mint, payer);

  const createAtaIx = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    payer,
    mint,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Mint 1 token to the wallet
  const { createMintToInstruction } = await import('@solana/spl-token');
  const mintToIx = createMintToInstruction(
    mint,
    ata,
    payer,
    1,
    [],
    TOKEN_PROGRAM_ID
  );

  // Create metadata account
  const metadataAccount = getMetadataPDA(mint);
  const createMetadataIx = createMetadataInstruction(
    metadataAccount,
    mint,
    payer,
    payer,
    payer,
    name,
    symbol,
    metadataUri,
    royaltyBps
  );

  // Build and send transaction
  const transaction = new Transaction();
  transaction.add(createMintAccountIx);
  transaction.add(initMintIx);
  transaction.add(createAtaIx);
  transaction.add(mintToIx);
  transaction.add(createMetadataIx);

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer;

  // Partially sign with the mint keypair (it's a new account)
  transaction.partialSign(mintKeypair);

  // Wallet signs and sends
  const signed = await wallet.signTransaction(transaction);
  const txSignature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(txSignature, 'confirmed');

  return {
    mintAddress: mint.toBase58(),
    txSignature,
    tokenAccount: ata.toBase58(),
  };
}
