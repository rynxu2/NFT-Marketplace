import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { type Address, parseEther, parseGwei } from 'viem';
import { wagmiConfig, NEXUS_NFT_CONTRACT, polygonAmoy, ensurePolygonChain } from './config';
import { NEXUS_NFT_ABI } from './abi';

const COLLECTION_SALE_CONTRACT = process.env.NEXT_PUBLIC_COLLECTION_SALE_CONTRACT as `0x${string}` | undefined;

const COLLECTION_SALE_ABI = [
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'seller', type: 'address' },
      { name: 'tokenIds', type: 'uint256[]' },
    ],
    name: 'buyCollectionBatch',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: false, name: 'nftContract', type: 'address' },
      { indexed: false, name: 'tokenIds', type: 'uint256[]' },
      { indexed: false, name: 'totalPrice', type: 'uint256' },
    ],
    name: 'CollectionPurchased',
    type: 'event',
  },
] as const;

const GAS_OVERRIDES = {
  chainId: polygonAmoy.id,
  maxFeePerGas: parseGwei('30'),
  maxPriorityFeePerGas: parseGwei('26'),
} as const;

export async function buyCollectionPolygon({
  sellerAddress,
  tokenIds,
  totalPrice,
}: {
  sellerAddress: string;
  tokenIds: string[];
  totalPrice: number;
}): Promise<{ txHash: string }> {
  if (!COLLECTION_SALE_CONTRACT || !NEXUS_NFT_CONTRACT) {
    throw new Error('Collection sale contract not configured');
  }

  await ensurePolygonChain();

  const hash = await writeContract(wagmiConfig, {
    address: COLLECTION_SALE_CONTRACT,
    abi: COLLECTION_SALE_ABI,
    functionName: 'buyCollectionBatch',
    args: [
      NEXUS_NFT_CONTRACT as Address,
      sellerAddress as Address,
      tokenIds.map((id) => BigInt(id)),
    ],
    value: parseEther(totalPrice.toString()),
    ...GAS_OVERRIDES,
    gas: BigInt(100_000 + tokenIds.length * 70_000),
  });

  await waitForTransactionReceipt(wagmiConfig, { hash });

  return { txHash: hash };
}

export async function approveCollectionForSale(): Promise<{ txHash: string }> {
  if (!COLLECTION_SALE_CONTRACT || !NEXUS_NFT_CONTRACT) {
    throw new Error('Contract not configured');
  }

  await ensurePolygonChain();

  const hash = await writeContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'setApprovalForAll',
    args: [COLLECTION_SALE_CONTRACT as Address, true],
    ...GAS_OVERRIDES,
    gas: BigInt(100_000),
  });

  await waitForTransactionReceipt(wagmiConfig, { hash });

  return { txHash: hash };
}
