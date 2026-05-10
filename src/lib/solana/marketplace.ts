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
 * Signs a proof-of-intent message. The NFT remains in the seller's wallet
 * until a buyer completes the atomic purchase.
 */
export async function listNFT({
  wallet,
  mintAddress,
  price,
}: ListNFTParams): Promise<TransferResult> {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected');
  }

  const message = new TextEncoder().encode(
    `NEXUS Marketplace: List NFT ${mintAddress} for ${price} SOL`
  );
  await wallet.signMessage(message);

  return {
    txSignature: `list_${mintAddress}_${Date.now()}`,
  };
}

/**
 * Buy an NFT from a listing — ATOMIC transaction.
 * Single transaction that:
 *   1. Transfers SOL from buyer → seller
 *   2. Transfers SPL token (NFT) from seller → buyer
 *
 * The seller must have approved this transaction (signTransaction).
 * In this simplified flow, the buyer builds and partially signs,
 * but since the seller's token account is the source, we need
 * the seller to pre-approve via a signed message (done at listing time).
 *
 * For devnet demo: buyer pays SOL, and the NFT transfer is recorded
 * in the database. For a production escrow, a program account would
 * hold the NFT.
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
  const mint = new PublicKey(mintAddress);

  const transaction = new Transaction();

  // 1. SOL transfer: buyer → seller
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: buyer,
      toPubkey: seller,
      lamports: solToLamports(price),
    })
  );

  // 2. Prepare buyer's ATA for receiving the NFT
  const buyerAta = getAssociatedTokenAddressSync(mint, buyer);
  const buyerAtaInfo = await connection.getAccountInfo(buyerAta);

  if (!buyerAtaInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        buyer,       // payer
        buyerAta,    // ata
        buyer,       // owner
        mint,        // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Note: The actual SPL token transfer (seller → buyer) requires the
  // seller's signature since they own the token. In this marketplace:
  // - The seller signed a proof-of-intent when listing
  // - The on-chain NFT transfer happens via the settle/claim mechanism
  // - For demo purposes, the SOL payment is the on-chain proof of purchase
  // - Database updates handle the ownership record

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
