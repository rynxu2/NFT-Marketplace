import { writeContract, waitForTransactionReceipt, sendTransaction } from '@wagmi/core';
import { parseEther } from 'viem';
import { wagmiConfig, NEXUS_NFT_CONTRACT } from './config';
import { NEXUS_NFT_ABI } from './abi';
import type { Address } from 'viem';

interface ListNFTPolygonParams {
  address: string;
  tokenId: string;
  price: number;
}

interface BuyNFTPolygonParams {
  buyerAddress: string;
  sellerAddress: string;
  tokenId: string;
  price: number;
}

interface TransferResult {
  txHash: string;
}

/**
 * List an ERC-721 NFT for sale on Polygon.
 * Approves the marketplace (simulated — approves to a designated address or uses setApprovalForAll).
 * The actual listing is tracked in Supabase, not on-chain.
 */
export async function listNFTPolygon({
  address,
  tokenId,
}: ListNFTPolygonParams): Promise<TransferResult> {
  if (!NEXUS_NFT_CONTRACT) {
    throw new Error('Polygon NFT contract address not configured');
  }

  // For demo: sign a message as proof-of-intent (same pattern as Solana)
  // In production, you'd call approve() for a marketplace contract
  const hash = await writeContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'approve',
    args: [address as Address, BigInt(tokenId)],
  });

  await waitForTransactionReceipt(wagmiConfig, { hash });

  return { txHash: hash };
}

/**
 * Buy an ERC-721 NFT on Polygon.
 * 1. Transfer POL from buyer to seller
 * 2. Transfer NFT from seller to buyer via transferFrom
 */
export async function buyNFTPolygon({
  sellerAddress,
  tokenId,
  price,
}: BuyNFTPolygonParams): Promise<TransferResult> {
  if (!NEXUS_NFT_CONTRACT) {
    throw new Error('Polygon NFT contract address not configured');
  }

  // Step 1: Send POL payment to seller
  const paymentHash = await sendTransaction(wagmiConfig, {
    to: sellerAddress as Address,
    value: parseEther(price.toString()),
  });

  await waitForTransactionReceipt(wagmiConfig, { hash: paymentHash });

  // Step 2: Transfer NFT (requires prior approval)
  const transferHash = await writeContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'transferFrom',
    args: [sellerAddress as Address, sellerAddress as Address, BigInt(tokenId)],
  });

  await waitForTransactionReceipt(wagmiConfig, { hash: transferHash });

  return { txHash: paymentHash };
}

/**
 * Transfer an ERC-721 NFT to another address.
 */
export async function transferNFTPolygon(
  from: string,
  to: string,
  tokenId: string
): Promise<TransferResult> {
  if (!NEXUS_NFT_CONTRACT) {
    throw new Error('Polygon NFT contract address not configured');
  }

  const hash = await writeContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'transferFrom',
    args: [from as Address, to as Address, BigInt(tokenId)],
  });

  await waitForTransactionReceipt(wagmiConfig, { hash });

  return { txHash: hash };
}
