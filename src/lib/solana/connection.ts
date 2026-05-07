import { Connection, clusterApiUrl, LAMPORTS_PER_SOL as SOL_LAMPORTS, PublicKey } from '@solana/web3.js';

export type SolanaNetwork = 'devnet' | 'mainnet-beta';

export function getNetwork(): SolanaNetwork {
  const env = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  if (env === 'mainnet' || env === 'mainnet-beta') return 'mainnet-beta';
  return 'devnet';
}

export function getRpcEndpoint(network?: SolanaNetwork): string {
  const net = network || getNetwork();
  if (net === 'mainnet-beta') {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET || clusterApiUrl('mainnet-beta');
  }
  return process.env.NEXT_PUBLIC_SOLANA_RPC_DEVNET || clusterApiUrl('devnet');
}

export function getConnection(network?: SolanaNetwork): Connection {
  return new Connection(getRpcEndpoint(network), 'confirmed');
}

export const connection = getConnection();
export const LAMPORTS_PER_SOL = SOL_LAMPORTS;

export function getExplorerUrl(signature: string, type: 'tx' | 'address' = 'tx'): string {
  const net = getNetwork();
  const cluster = net === 'devnet' ? '?cluster=devnet' : '';
  return `https://explorer.solana.com/${type}/${signature}${cluster}`;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export function formatSOL(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export async function getBalance(address: string, network?: SolanaNetwork): Promise<number> {
  const conn = getConnection(network);
  const pubkey = new PublicKey(address);
  const balance = await conn.getBalance(pubkey);
  return lamportsToSol(balance);
}

export async function requestAirdrop(
  address: string,
  amountSol = 1
): Promise<string> {
  const net = getNetwork();
  if (net !== 'devnet') {
    throw new Error('Airdrop is only available on devnet');
  }

  // Clamp to max 2 SOL per request (devnet limit)
  const clampedAmount = Math.min(amountSol, 2);
  const conn = getConnection('devnet');
  const pubkey = new PublicKey(address);

  // Strategy 1: Standard RPC requestAirdrop
  try {
    const signature = await conn.requestAirdrop(
      pubkey,
      clampedAmount * LAMPORTS_PER_SOL
    );
    await conn.confirmTransaction(signature, 'confirmed');
    return signature;
  } catch {
    // RPC airdrop failed (rate-limited), try web faucet
  }

  // Strategy 2: Solana Web Faucet API
  try {
    const res = await fetch('https://faucet.solana.com/api/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: address,
        network: 'devnet',
        amount: clampedAmount,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.signature) {
        await conn.confirmTransaction(data.signature, 'confirmed');
        return data.signature;
      }
    }
  } catch {
    // Web faucet also failed
  }

  // Strategy 3: Retry RPC with smaller amount (0.5 SOL)
  try {
    const smallAmount = Math.min(clampedAmount, 0.5);
    const signature = await conn.requestAirdrop(
      pubkey,
      smallAmount * LAMPORTS_PER_SOL
    );
    await conn.confirmTransaction(signature, 'confirmed');
    return signature;
  } catch {
    // All strategies failed
  }

  throw new Error(
    'Devnet airdrop rate-limited. Try again in a few minutes, or use https://faucet.solana.com manually.'
  );
}

export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
