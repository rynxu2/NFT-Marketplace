import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import { wagmiConfig, NEXUS_NFT_CONTRACT } from './config';
import { NEXUS_NFT_ABI } from './abi';
import type { Address } from 'viem';

interface MintNFTPolygonParams {
  to: string;
  tokenURI: string;
}

interface MintNFTPolygonResult {
  tokenId: string;
  txHash: string;
  contractAddress: string;
}

/**
 * Mint an ERC-721 NFT on Polygon Amoy.
 * Calls the safeMint(address, string) function on the deployed contract.
 */
export async function mintNFTPolygon({
  to,
  tokenURI,
}: MintNFTPolygonParams): Promise<MintNFTPolygonResult> {
  if (!NEXUS_NFT_CONTRACT) {
    throw new Error('Polygon NFT contract address not configured');
  }

  const hash = await writeContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'safeMint',
    args: [to as Address, tokenURI],
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

  // Extract tokenId from Transfer event log
  const transferLog = receipt.logs.find(
    (log: { topics: readonly string[] }) => log.topics.length === 4 // Transfer(from, to, tokenId)
  );

  const tokenId = transferLog
    ? BigInt(transferLog.topics[3] || '0').toString()
    : '0';

  return {
    tokenId,
    txHash: hash,
    contractAddress: NEXUS_NFT_CONTRACT,
  };
}

/**
 * Get total supply of NFTs minted on the contract.
 */
export async function getTotalSupply(): Promise<number> {
  if (!NEXUS_NFT_CONTRACT) return 0;

  const result = await readContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'totalSupply',
  });

  return Number(result);
}

/**
 * Get the owner of a specific token ID.
 */
export async function getTokenOwner(tokenId: string): Promise<string> {
  if (!NEXUS_NFT_CONTRACT) throw new Error('Contract not configured');

  const result = await readContract(wagmiConfig, {
    address: NEXUS_NFT_CONTRACT as Address,
    abi: NEXUS_NFT_ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
  });

  return result as string;
}
