'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/store/useToastStore';
import type { NFT } from '@/types/nft';
import type { ChainId } from '@/types/chain';

export type BridgeStep = 'idle' | 'confirming' | 'locking' | 'bridging' | 'minting' | 'complete' | 'error';

export function useBridge() {
  const { publicKey, signMessage } = useWallet();
  const { address: evmAddress } = useAccount();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<BridgeStep>('idle');

  const bridgeNFT = useCallback(
    async (nft: NFT, destChain: ChainId) => {
      const sourceChain = nft.chain;

      // Validate
      if (sourceChain === destChain) {
        addToast('NFT is already on this chain', 'error');
        return false;
      }

      // Get the right address based on source chain
      const initiator =
        sourceChain === 'solana'
          ? publicKey?.toBase58()
          : evmAddress;

      if (!initiator) {
        addToast('Connect wallet for the source chain first', 'error');
        return false;
      }

      try {
        setStep('confirming');
        addToast(`Bridging ${nft.name} from ${sourceChain} to ${destChain}...`, 'info');

        // Step 1: Sign a message proving ownership on source chain
        setStep('locking');

        if (sourceChain === 'solana' && signMessage) {
          const message = new TextEncoder().encode(
            `NEXUS Bridge: Lock ${nft.mint} on Solana for bridge to Polygon. Timestamp: ${Date.now()}`
          );
          await signMessage(message);
        }
        // For Polygon source, wagmi handles signing differently (not required for demo)

        // Step 2: Call bridge API
        setStep('bridging');

        const res = await fetch('/api/bridge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nft_mint: nft.mint,
            source_chain: sourceChain,
            dest_chain: destChain,
            source_tx: `lock_${sourceChain}_${Date.now()}`,
            initiated_by: initiator,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Bridge API failed');
        }

        // Step 3: Simulate minting on destination
        setStep('minting');

        // Small delay to show the minting step
        await new Promise((r) => setTimeout(r, 1500));

        setStep('complete');
        addToast(
          `${nft.name} bridged to ${destChain === 'polygon' ? 'Polygon' : 'Solana'}!`,
          'success'
        );

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['nfts'] });
        queryClient.invalidateQueries({ queryKey: ['activities'] });

        // Reset after showing complete status
        setTimeout(() => setStep('idle'), 3000);

        return true;
      } catch (error) {
        setStep('error');
        const message = error instanceof Error ? error.message : 'Bridge failed';
        addToast(message, 'error');
        setTimeout(() => setStep('idle'), 3000);
        return false;
      }
    },
    [publicKey, evmAddress, signMessage, addToast, queryClient]
  );

  return { bridgeNFT, step };
}
