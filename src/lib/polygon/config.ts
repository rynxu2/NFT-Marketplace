import { http, createConfig } from 'wagmi';
import { type Chain } from 'wagmi/chains';
import { metaMask, injected } from 'wagmi/connectors';

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
    metaMask(),
    injected(),
  ],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://rpc-amoy.polygon.technology/'),
  },
  ssr: true,
});

export const NEXUS_NFT_CONTRACT = process.env.NEXT_PUBLIC_POLYGON_CONTRACT || '';
