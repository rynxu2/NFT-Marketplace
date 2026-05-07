import {
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import { getConnection, solToLamports } from './connection';
import type { WalletContextState } from '@solana/wallet-adapter-react';

interface CreateAuctionParams {
  wallet: WalletContextState;
  mintAddress: string;
  startingPrice: number;
  durationHours: number;
  minBidIncrement: number;
}

interface PlaceBidParams {
  wallet: WalletContextState;
  auctionId: string;
  amount: number;
  sellerAddress: string;
}

interface SettleAuctionParams {
  wallet: WalletContextState;
  auctionId: string;
  mintAddress: string;
  winnerAddress: string;
  finalAmount: number;
}

interface AuctionResult {
  txSignature: string;
}

/**
 * Create an auction. Signs a message as proof-of-intent.
 * The auction state is tracked in the marketplace store.
 */
export async function createAuction({
  wallet,
  mintAddress,
  startingPrice,
  durationHours,
}: CreateAuctionParams): Promise<AuctionResult> {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected');
  }

  const message = new TextEncoder().encode(
    `NEXUS: Create auction for ${mintAddress} starting at ${startingPrice} SOL, duration ${durationHours}h`
  );
  await wallet.signMessage(message);

  return {
    txSignature: `auction_create_${mintAddress}_${Date.now()}`,
  };
}

/**
 * Place a bid on an auction.
 * Sends SOL to an escrow (in this simplified version, to the seller).
 */
export async function placeBid({
  wallet,
  auctionId,
  amount,
  sellerAddress,
}: PlaceBidParams): Promise<AuctionResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const connection = getConnection();
  const bidder = wallet.publicKey;
  const seller = new PublicKey(sellerAddress);

  // Transfer bid amount to seller (simplified — a real auction would use escrow)
  const transferIx = SystemProgram.transfer({
    fromPubkey: bidder,
    toPubkey: seller,
    lamports: solToLamports(amount),
  });

  const transaction = new Transaction().add(transferIx);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = bidder;

  const signed = await wallet.signTransaction(transaction);
  const txSignature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(txSignature, 'confirmed');

  return { txSignature };
}

/**
 * Settle an auction after it ends.
 * The seller confirms the auction result via message signing.
 */
export async function settleAuction({
  wallet,
  auctionId,
  mintAddress,
  winnerAddress,
  finalAmount,
}: SettleAuctionParams): Promise<AuctionResult> {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected');
  }

  const message = new TextEncoder().encode(
    `NEXUS: Settle auction ${auctionId} - NFT ${mintAddress} to ${winnerAddress} for ${finalAmount} SOL`
  );
  await wallet.signMessage(message);

  return {
    txSignature: `auction_settle_${auctionId}_${Date.now()}`,
  };
}
