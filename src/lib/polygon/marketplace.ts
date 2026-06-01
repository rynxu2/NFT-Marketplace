import { writeContract, waitForTransactionReceipt, sendTransaction, readContract } from '@wagmi/core';
import { type Address, parseEther, parseGwei } from 'viem';
import { wagmiConfig, NEXUS_NFT_CONTRACT, polygonAmoy, ensurePolygonChain } from './config';
import { NEXUS_NFT_ABI } from './abi';

const GAS_OVERRIDES = {
  chainId: polygonAmoy.id,
  maxFeePerGas: parseGwei('30'),
  maxPriorityFeePerGas: parseGwei('26'),
  gas: BigInt(200_000),
} as const;

interface ListNFTPolygonParams {
  ownerAddress: string;
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
 * Verify that an address owns a specific token on-chain before attempting transfer.
 */
async function verifyTokenOwnership(tokenId: string, expectedOwner: string): Promise<void> {
  if (!NEXUS_NFT_CONTRACT) throw new Error('Contract not configured');

  try {
    const owner = await readContract(wagmiConfig, {
      address: NEXUS_NFT_CONTRACT as Address,
      abi: NEXUS_NFT_ABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });

    const onChainOwner = (owner as string).toLowerCase();
    const expected = expectedOwner.toLowerCase();

    if (onChainOwner !== expected) {
      throw new Error(
        `On-chain ownership mismatch: token ${tokenId} is owned by ${onChainOwner}, not ${expected}. ` +
        `The NFT may not have been minted on-chain or was already transferred.`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('ownership mismatch')) throw err;
    // ownerOf reverts for non-existent tokens
    throw new Error(
      `Token ${tokenId} does not exist on-chain. It may not have been minted on the Polygon contract.`
    );
  }
}

/**
 * Get on-chain owner of a token. Returns null if token doesn't exist.
 */
async function getOnChainOwner(tokenId: string): Promise<string | null> {
  if (!NEXUS_NFT_CONTRACT) return null;
  try {
    const owner = await readContract(wagmiConfig, {
      address: NEXUS_NFT_CONTRACT as Address,
      abi: NEXUS_NFT_ABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });
    return (owner as string).toLowerCase();
  } catch {
    return null;
  }
}

/**
 * List an ERC-721 NFT for sale on Polygon.
 */
export async function listNFTPolygon({
  ownerAddress,
  tokenId,
}: ListNFTPolygonParams): Promise<TransferResult> {
  if (!NEXUS_NFT_CONTRACT) {
    throw new Error('Polygon NFT contract address not configured');
  }

  await ensurePolygonChain();
  await verifyTokenOwnership(tokenId, ownerAddress);

  const hash = await writeContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'setApprovalForAll',
    args: [NEXUS_NFT_CONTRACT as Address, true],
    ...GAS_OVERRIDES,
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
  buyerAddress,
  sellerAddress,
  tokenId,
  price,
}: BuyNFTPolygonParams): Promise<TransferResult> {
  if (!NEXUS_NFT_CONTRACT) {
    throw new Error('Polygon NFT contract address not configured');
  }

  await ensurePolygonChain();
  await verifyTokenOwnership(tokenId, sellerAddress);

  // Step 1: Send POL payment to seller
  const paymentHash = await sendTransaction(wagmiConfig, {
    chainId: polygonAmoy.id,
    to: sellerAddress as Address,
    value: parseEther(price.toString()),
    maxFeePerGas: parseGwei('30'),
    maxPriorityFeePerGas: parseGwei('26'),
  });

  await waitForTransactionReceipt(wagmiConfig, { hash: paymentHash });

  // Step 2: Transfer NFT from seller to buyer
  // Note: Just like the Solana implementation, in this simplified hybrid-custodial demo marketplace,
  // the on-chain payment (POL) acts as the proof of purchase, and ownership updates are handled
  // atomically in the database (Supabase).
  // A direct on-chain 'transferFrom' call initiated by the buyer's wallet would revert because
  // the buyer does not have on-chain operator permissions on the seller's standard ERC-721 token.
  /*
  const transferHash = await writeContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'transferFrom',
    args: [sellerAddress as Address, buyerAddress as Address, BigInt(tokenId)],
    ...GAS_OVERRIDES,
  });

  await waitForTransactionReceipt(wagmiConfig, { hash: transferHash });
  */

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

  await ensurePolygonChain();

  // Check on-chain owner first
  const onChainOwner = await getOnChainOwner(tokenId);

  if (!onChainOwner) {
    throw new Error(`Token ${tokenId} does not exist on-chain.`);
  }

  // If already owned by recipient, skip transfer (idempotent)
  if (onChainOwner === to.toLowerCase()) {
    console.log(`Token ${tokenId} already owned by ${to}, skipping on-chain transfer`);
    return { txHash: 'already_transferred' };
  }

  // Verify sender is the actual owner
  if (onChainOwner !== from.toLowerCase()) {
    throw new Error(
      `Cannot transfer: token ${tokenId} is owned by ${onChainOwner} on-chain, not ${from.toLowerCase()}.`
    );
  }

  const hash = await writeContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'transferFrom',
    args: [from as Address, to as Address, BigInt(tokenId)],
    ...GAS_OVERRIDES,
  });

  await waitForTransactionReceipt(wagmiConfig, { hash });

  return { txHash: hash };
}
