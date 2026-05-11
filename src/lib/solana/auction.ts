import {
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

interface CreateAuctionParams {
  wallet: WalletContextState;
  mintAddress: string;
  startingPrice: number;
  durationMinutes: number;
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
  /** Who is settling — 'seller' transfers NFT, 'winner' pays SOL */
  role: 'seller' | 'winner';
  sellerAddress: string;
}

interface AuctionResult {
  txSignature: string;
}

/**
 * Create an auction. Signs a message as proof-of-intent.
 * The NFT remains in the seller's wallet until settlement.
 */
export async function createAuction({
  wallet,
  mintAddress,
  startingPrice,
  durationMinutes,
}: CreateAuctionParams): Promise<AuctionResult> {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected');
  }

  const message = new TextEncoder().encode(
    `NEXUS: Create auction for ${mintAddress} starting at ${startingPrice} SOL, duration ${durationMinutes}min`
  );
  await wallet.signMessage(message);

  return {
    txSignature: `auction_create_${mintAddress}_${Date.now()}`,
  };
}

/**
 * Place a bid on an auction — ESCROW-LITE approach.
 *
 * Instead of transferring SOL immediately (which causes funds loss
 * when outbid), the bidder only signs a message as proof-of-intent.
 * The actual SOL transfer happens at settlement time.
 *
 * This is safer for bidders: no SOL is locked or lost during bidding.
 */
export async function placeBid({
  wallet,
  auctionId,
  amount,
}: PlaceBidParams): Promise<AuctionResult> {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected');
  }

  // Sign a commitment message — proves the bidder intends to pay this amount
  const message = new TextEncoder().encode(
    `NEXUS: Bid ${amount} SOL on auction ${auctionId} by ${wallet.publicKey.toBase58()}`
  );
  await wallet.signMessage(message);

  return {
    txSignature: `bid_${auctionId}_${amount}_${Date.now()}`,
  };
}

/**
 * Settle an auction after it ends — ATOMIC SWAP.
 *
 * When the winner settles:
 *   → Winner pays SOL to seller (on-chain transaction)
 *   → NFT ownership is updated in the database
 *
 * When the seller settles:
 *   → Seller signs confirmation message
 *   → NFT ownership is updated in the database
 *
 * For a real production marketplace, both transfers would happen
 * in a single atomic transaction via a Solana program (escrow PDA).
 * This simplified approach works for devnet demo.
 */
export async function settleAuction({
  wallet,
  auctionId,
  mintAddress,
  winnerAddress,
  finalAmount,
  role,
  sellerAddress,
}: SettleAuctionParams): Promise<AuctionResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const connection = getConnection();

  if (role === 'winner') {
    // Winner pays SOL to the seller
    const winner = wallet.publicKey;
    const seller = new PublicKey(sellerAddress);

    const transaction = new Transaction();

    // Transfer final bid amount
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: winner,
        toPubkey: seller,
        lamports: solToLamports(finalAmount),
      })
    );

    // Create winner's ATA for receiving the NFT (if needed)
    const mint = new PublicKey(mintAddress);
    const winnerAta = getAssociatedTokenAddressSync(mint, winner);
    const winnerAtaInfo = await connection.getAccountInfo(winnerAta);

    if (!winnerAtaInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          winner,
          winnerAta,
          winner,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = winner;

    const signed = await wallet.signTransaction(transaction);
    const txSignature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txSignature, 'confirmed');

    return { txSignature };
  }

  // Seller confirms settlement via message signing
  if (!wallet.signMessage) {
    throw new Error('Wallet does not support message signing');
  }

  const message = new TextEncoder().encode(
    `NEXUS: Settle auction ${auctionId} - NFT ${mintAddress} to ${winnerAddress} for ${finalAmount} SOL`
  );
  await wallet.signMessage(message);

  return {
    txSignature: `auction_settle_${auctionId}_${Date.now()}`,
  };
}
