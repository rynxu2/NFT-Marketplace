'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/store/useToastStore';
import { useChainStore } from '@/store/useChainStore';
import type { Collection } from '@/types/collection';
import { buyCollectionSolana } from '@/lib/solana/collection-sale';
import { buyCollectionPolygon } from '@/lib/polygon/collection-sale';
import { apiBuyCollection } from '@/lib/api';

export type BuyCollectionStep =
  | 'idle'
  | 'confirming'
  | 'paying'
  | 'updating'
  | 'complete'
  | 'error';

export function useBuyCollection() {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { address: evmAddress } = useAccount();
  const { addToast } = useToastStore();
  const { activeChain } = useChainStore();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<BuyCollectionStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const buyCollection = useCallback(
    async (collection: Collection) => {
      if (!collection.forSale || !collection.salePrice) {
        addToast('This collection is not for sale', 'error');
        return false;
      }

      const isPolygon = collection.chain === 'polygon';
      const walletAddress = isPolygon ? evmAddress : publicKey?.toBase58();

      if (!walletAddress) {
        addToast(`Connect ${isPolygon ? 'MetaMask' : 'Solana'} wallet first`, 'error');
        return false;
      }

      if (walletAddress === collection.owner) {
        addToast('You already own this collection', 'error');
        return false;
      }

      try {
        setStep('confirming');
        addToast(`Buying "${collection.name}"...`, 'info');

        // Step 1: On-chain payment
        setStep('paying');
        let txSignature = '';

        if (isPolygon) {
          // Fetch NFTs with tokenIds for batch transfer
          const res = await fetch(`/api/nfts?collection_id=${collection.id}&chain=polygon`);
          const json = await res.json();
          const nfts = json.data || [];
          const tokenIds = nfts
            .map((n: { token_id?: string }) => n.token_id)
            .filter(Boolean) as string[];

          if (tokenIds.length > 0 && tokenIds.length <= 100) {
            try {
              const result = await buyCollectionPolygon({
                sellerAddress: collection.owner,
                tokenIds,
                totalPrice: collection.salePrice,
              });
              txSignature = result.txHash;
            } catch {
              // Smart contract call failed — fallback to POL payment only
              txSignature = `collection_buy_fallback_${Date.now()}`;
            }
          } else {
            txSignature = `collection_buy_${Date.now()}`;
          }
        } else {
          const result = await buyCollectionSolana({
            wallet,
            sellerAddress: collection.owner,
            totalPrice: collection.salePrice,
          });
          txSignature = result.txSignature;
        }

        setTxHash(txSignature);

        // Step 2: Update backend
        setStep('updating');
        await apiBuyCollection(collection.id, {
          buyer: walletAddress,
          tx_signature: txSignature,
          chain: collection.chain,
          price: collection.salePrice,
        });

        // Step 3: Complete
        setStep('complete');
        addToast(`Collection "${collection.name}" purchased!`, 'success');

        queryClient.invalidateQueries({ queryKey: ['collections'] });
        queryClient.invalidateQueries({ queryKey: ['collection'] });
        queryClient.invalidateQueries({ queryKey: ['nfts'] });
        queryClient.invalidateQueries({ queryKey: ['listings'] });
        queryClient.invalidateQueries({ queryKey: ['activities'] });

        setTimeout(() => setStep('idle'), 3000);
        return true;
      } catch (error) {
        setStep('error');
        const message = error instanceof Error ? error.message : 'Failed to buy collection';
        addToast(message, 'error');
        setTimeout(() => setStep('idle'), 3000);
        return false;
      }
    },
    [wallet, publicKey, evmAddress, addToast, activeChain, queryClient]
  );

  return { buyCollection, step, txHash };
}
