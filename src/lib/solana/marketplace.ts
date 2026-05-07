import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getConnection, solToLamports } from './connection';
import type { WalletContextState } from '@solana/wallet-adapter-react';

interface ListNFTParams {
  wallet: WalletContextState;
  mintAddress: string;
  price: number;
}

interface BuyNFTParams {
  wallet: WalletContextState;
  mintAddress: string;
  sellerAddress: string;
  price: number;
}

interface TransferResult {
  txSignature: string;
}

/**
 * List an NFT for sale.
 * In a production app this would escrow the NFT on-chain.
 * For this project, we just sign a "proof of intent" message
 * and track the listing in the local marketplace store.
 */
export async function listNFT({
  wallet,
  mintAddress,
  price,
}: ListNFTParams): Promise<TransferResult> {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected');
  }

  // Sign a message as proof-of-intent for listing
  const message = new TextEncoder().encode(
    `NEXUS Marketplace: List NFT ${mintAddress} for ${price} SOL`
  );
  await wallet.signMessage(message);

  // Return a simulated signature (the message signing acts as verification)
  return {
    txSignature: `list_${mintAddress}_${Date.now()}`,
  };
}

/**
 * Buy an NFT from a listing.
 * Transfers SOL from buyer to seller on-chain.
 * In a real marketplace, the NFT transfer would also happen atomically.
 */
export async function buyNFT({
  wallet,
  mintAddress,
  sellerAddress,
  price,
}: BuyNFTParams): Promise<TransferResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const connection = getConnection();
  const buyer = wallet.publicKey;
  const seller = new PublicKey(sellerAddress);

  // Create SOL transfer instruction
  const transferIx = SystemProgram.transfer({
    fromPubkey: buyer,
    toPubkey: seller,
    lamports: solToLamports(price),
  });

  const transaction = new Transaction().add(transferIx);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = buyer;

  const signed = await wallet.signTransaction(transaction);
  const txSignature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(txSignature, 'confirmed');

  return { txSignature };
}

/**
 * Cancel a listing. Signs a message as proof that the seller wants to delist.
 */
export async function cancelListing({
  wallet,
  mintAddress,
}: {
  wallet: WalletContextState;
  mintAddress: string;
}): Promise<TransferResult> {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected');
  }

  const message = new TextEncoder().encode(
    `NEXUS Marketplace: Cancel listing for NFT ${mintAddress}`
  );
  await wallet.signMessage(message);

  return {
    txSignature: `cancel_${mintAddress}_${Date.now()}`,
  };
}

/**
 * Transfer an NFT (SPL token) from one wallet to another.
 */
export async function transferNFT({
  wallet,
  mintAddress,
  recipientAddress,
}: {
  wallet: WalletContextState;
  mintAddress: string;
  recipientAddress: string;
}): Promise<TransferResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const connection = getConnection();
  const sender = wallet.publicKey;
  const mint = new PublicKey(mintAddress);
  const recipient = new PublicKey(recipientAddress);

  const senderAta = getAssociatedTokenAddressSync(mint, sender);
  const recipientAta = getAssociatedTokenAddressSync(mint, recipient);

  const transaction = new Transaction();

  // Create recipient's ATA if it doesn't exist
  const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
  if (!recipientAtaInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        sender,
        recipientAta,
        recipient,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Transfer 1 token (NFT)
  transaction.add(
    createTransferInstruction(
      senderAta,
      recipientAta,
      sender,
      1,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = sender;

  const signed = await wallet.signTransaction(transaction);
  const txSignature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(txSignature, 'confirmed');

  return { txSignature };
}
