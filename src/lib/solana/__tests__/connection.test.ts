import { describe, it, expect } from 'vitest';
import {
  shortenAddress,
  lamportsToSol,
  solToLamports,
  formatSOL,
  formatUSD,
  timeAgo,
  isValidPublicKey,
  getNetwork,
  getExplorerUrl,
} from '@/lib/solana/connection';

describe('shortenAddress', () => {
  it('shortens a typical Solana address', () => {
    const addr = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    expect(shortenAddress(addr)).toBe('9WzD...AWWM');
  });

  it('uses custom char count', () => {
    const addr = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    expect(shortenAddress(addr, 6)).toBe('9WzDXw...YtAWWM');
  });

  it('handles empty string', () => {
    expect(shortenAddress('')).toBe('');
  });
});

describe('lamportsToSol / solToLamports', () => {
  it('converts lamports to SOL', () => {
    expect(lamportsToSol(1000000000)).toBe(1);
    expect(lamportsToSol(500000000)).toBe(0.5);
    expect(lamportsToSol(0)).toBe(0);
  });

  it('converts SOL to lamports', () => {
    expect(solToLamports(1)).toBe(1000000000);
    expect(solToLamports(0.5)).toBe(500000000);
    expect(solToLamports(0)).toBe(0);
  });

  it('round-trips correctly', () => {
    expect(lamportsToSol(solToLamports(2.5))).toBe(2.5);
  });
});

describe('formatSOL', () => {
  it('formats SOL with 2-4 decimal places', () => {
    expect(formatSOL(1)).toBe('1.00');
    expect(formatSOL(1.5)).toBe('1.50');
    expect(formatSOL(0.1234)).toBe('0.1234');
  });

  it('handles large numbers', () => {
    const result = formatSOL(1000.5);
    expect(result).toContain('1,000.50');
  });
});

describe('formatUSD', () => {
  it('formats as USD currency', () => {
    expect(formatUSD(100)).toBe('$100.00');
    expect(formatUSD(1234.56)).toBe('$1,234.56');
  });
});

describe('timeAgo', () => {
  it('handles seconds ago', () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - 30);
    expect(timeAgo(now.toISOString())).toBe('30s ago');
  });

  it('handles minutes ago', () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5);
    expect(timeAgo(now.toISOString())).toBe('5m ago');
  });

  it('handles hours ago', () => {
    const now = new Date();
    now.setHours(now.getHours() - 3);
    expect(timeAgo(now.toISOString())).toBe('3h ago');
  });

  it('handles days ago', () => {
    const now = new Date();
    now.setDate(now.getDate() - 7);
    expect(timeAgo(now.toISOString())).toBe('7d ago');
  });
});

describe('isValidPublicKey', () => {
  it('validates a correct Solana address', () => {
    expect(isValidPublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(true);
    expect(isValidPublicKey('11111111111111111111111111111111')).toBe(true);
  });

  it('rejects invalid addresses', () => {
    expect(isValidPublicKey('')).toBe(false);
    expect(isValidPublicKey('not-a-valid-key')).toBe(false);
    expect(isValidPublicKey('too-short')).toBe(false);
  });
});

describe('getNetwork', () => {
  it('defaults to devnet', () => {
    expect(getNetwork()).toBe('devnet');
  });
});

describe('getExplorerUrl', () => {
  it('generates correct explorer URL for devnet', () => {
    const url = getExplorerUrl('abc123');
    expect(url).toContain('explorer.solana.com/tx/abc123');
    expect(url).toContain('cluster=devnet');
  });

  it('supports address type', () => {
    const url = getExplorerUrl('abc123', 'address');
    expect(url).toContain('explorer.solana.com/address/abc123');
  });
});
