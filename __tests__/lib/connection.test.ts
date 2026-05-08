import { describe, it, expect } from 'vitest';
import {
  shortenAddress,
  formatSOL,
  formatUSD,
  lamportsToSol,
  solToLamports,
  timeAgo,
  getNetwork,
  getExplorerUrl,
  isValidPublicKey,
  LAMPORTS_PER_SOL,
} from '@/lib/solana/connection';

describe('shortenAddress', () => {
  it('truncates a long address with default chars', () => {
    const addr = 'DRpbCBMxVnDK7maPyKgqjYqJdWtRJHMtU5Fpkga6HxqK';
    expect(shortenAddress(addr)).toBe('DRpb...HxqK');
  });

  it('returns empty string for empty input', () => {
    expect(shortenAddress('')).toBe('');
  });

  it('supports custom char count', () => {
    const addr = 'DRpbCBMxVnDK7maPyKgqjYqJdWtRJHMtU5Fpkga6HxqK';
    expect(shortenAddress(addr, 6)).toBe('DRpbCB...a6HxqK');
  });

  it('handles short addresses gracefully', () => {
    expect(shortenAddress('abcd')).toBe('abcd...abcd');
  });
});

describe('formatSOL', () => {
  it('formats with 2-4 decimal places', () => {
    const result = formatSOL(12.5);
    expect(result).toBe('12.50');
  });

  it('formats zero', () => {
    expect(formatSOL(0)).toBe('0.00');
  });

  it('preserves up to 4 decimals when needed', () => {
    const result = formatSOL(1.2345);
    expect(result).toBe('1.2345');
  });

  it('formats large numbers with commas', () => {
    const result = formatSOL(1234567.89);
    expect(result).toContain('1,234,567');
  });
});

describe('formatUSD', () => {
  it('formats with dollar sign', () => {
    const result = formatUSD(170);
    expect(result).toBe('$170.00');
  });

  it('formats negative amount', () => {
    const result = formatUSD(-10);
    expect(result).toBe('-$10.00');
  });
});

describe('lamportsToSol / solToLamports', () => {
  it('converts lamports to SOL correctly', () => {
    expect(lamportsToSol(1_000_000_000)).toBe(1);
    expect(lamportsToSol(500_000_000)).toBe(0.5);
  });

  it('converts SOL to lamports correctly', () => {
    expect(solToLamports(1)).toBe(1_000_000_000);
    expect(solToLamports(0.5)).toBe(500_000_000);
  });

  it('rounds lamports to avoid floating point issues', () => {
    const result = solToLamports(0.123456789);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('LAMPORTS_PER_SOL is 1 billion', () => {
    expect(LAMPORTS_PER_SOL).toBe(1_000_000_000);
  });
});

describe('timeAgo', () => {
  it('returns seconds ago for recent times', () => {
    const now = new Date(Date.now() - 30000).toISOString();
    expect(timeAgo(now)).toBe('30s ago');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(timeAgo(threeHrsAgo)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe('2d ago');
  });

  it('returns months ago', () => {
    const twoMonthsAgo = new Date(Date.now() - 61 * 86400 * 1000).toISOString();
    expect(timeAgo(twoMonthsAgo)).toBe('2mo ago');
  });
});

describe('getNetwork', () => {
  it('returns devnet as default', () => {
    expect(getNetwork()).toBe('devnet');
  });
});

describe('getExplorerUrl', () => {
  it('generates tx URL for devnet', () => {
    const url = getExplorerUrl('abc123');
    expect(url).toContain('explorer.solana.com/tx/abc123');
    expect(url).toContain('cluster=devnet');
  });

  it('generates address URL', () => {
    const url = getExplorerUrl('addr123', 'address');
    expect(url).toContain('explorer.solana.com/address/addr123');
  });
});

describe('isValidPublicKey', () => {
  it('returns true for valid Solana public key', () => {
    // A valid base58-encoded 32-byte public key
    expect(isValidPublicKey('11111111111111111111111111111111')).toBe(true);
  });

  it('returns false for invalid string', () => {
    expect(isValidPublicKey('not-a-valid-key')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidPublicKey('')).toBe(false);
  });
});
