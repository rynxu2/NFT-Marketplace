'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { lamportsToSol, requestAirdrop, getNetwork } from '@/lib/solana/connection';
import { useToastStore } from '@/store/useToastStore';

export function useBalance() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamportsToSol(lamports));
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    refresh();
    // Refresh balance every 15 seconds
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { balance, loading, refresh };
}

export function useRequestAirdrop() {
  const { publicKey } = useWallet();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);

  const airdrop = useCallback(
    async (amountSol = 1) => {
      if (!publicKey) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      const network = getNetwork();
      if (network !== 'devnet') {
        addToast('Airdrop only available on devnet', 'warning');
        return null;
      }

      setLoading(true);
      try {
        addToast(`Requesting ${amountSol} SOL airdrop...`, 'info', undefined, 3000);
        const signature = await requestAirdrop(publicKey.toBase58(), amountSol);
        addToast(`Received ${amountSol} SOL!`, 'success', signature);
        return signature;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Airdrop failed';
        addToast(msg, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, addToast]
  );

  return { airdrop, loading };
}
