import { http, createConfig } from 'wagmi';
import { getAccount, switchChain } from '@wagmi/core';
import { type Chain } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const polygonAmoy: Chain = {
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://rpc-amoy.polygon.technology/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://amoy.polygonscan.com',
    },
  },
  testnet: true,
};

export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  connectors: [
    injected(),
  ],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://rpc-amoy.polygon.technology/'),
  },
  ssr: true,
});

export const NEXUS_NFT_CONTRACT = process.env.NEXT_PUBLIC_POLYGON_CONTRACT_ADDRESS || '';
export const NEXUS_ESCROW_CONTRACT = process.env.NEXT_PUBLIC_ESCROW_CONTRACT || '';
export const NEXUS_COLLECTION_SALE_CONTRACT = process.env.NEXT_PUBLIC_COLLECTION_SALE_CONTRACT || '';

/**
 * Ensure MetaMask is on Polygon Amoy before sending transactions.
 * Automatically prompts user to switch if on a different chain.
 */
export async function ensurePolygonChain(): Promise<void> {
  const account = getAccount(wagmiConfig);
  if (account.chainId !== polygonAmoy.id) {
    await switchChain(wagmiConfig, { chainId: polygonAmoy.id });
  }
}

