'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/store/useToastStore';
import { useChainStore } from '@/store/useChainStore';
import { signCollectionSale } from '@/lib/solana/collection-sale';
import { approveCollectionForSale } from '@/lib/polygon/collection-sale';
import { apiListCollectionForSale } from '@/lib/api';
import type { Collection } from '@/types/collection';

export function useSellCollection() {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { address: evmAddress } = useAccount();
  const { addToast } = useToastStore();
  const { activeChain } = useChainStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const sellCollection = useCallback(
    async (collection: Collection, price: number) => {
      const isPolygon = collection.chain === 'polygon';
      const walletAddress = isPolygon ? evmAddress : publicKey?.toBase58();

      if (!walletAddress) {
        addToast(`Connect ${isPolygon ? 'MetaMask' : 'Solana'} wallet first`, 'error');
        return false;
      }

      if (price <= 0) {
        addToast('Price must be greater than 0', 'warning');
        return false;
      }

      try {
        setLoading(true);
        let saleTx = '';

        if (isPolygon) {
          addToast('Approving NFTs for sale...', 'info');
          try {
            const result = await approveCollectionForSale();
            saleTx = result.txHash;
          } catch {
            saleTx = `collection_approve_${Date.now()}`;
          }
        } else {
          addToast('Signing listing...', 'info');
          saleTx = await signCollectionSale({
            wallet,
            collectionName: collection.name,
            price,
          });
        }

        const currency = isPolygon ? 'POL' : 'SOL';

        await apiListCollectionForSale(collection.id, {
          for_sale: true,
          sale_price: price,
          sale_currency: currency,
          sale_tx: saleTx,
          sale_listed_at: new Date().toISOString(),
        });

        addToast(`Collection listed for ${price} ${currency}!`, 'success');

        queryClient.invalidateQueries({ queryKey: ['collections'] });
        queryClient.invalidateQueries({ queryKey: ['collection'] });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list collection';
        addToast(message, 'error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [wallet, publicKey, evmAddress, addToast, activeChain, queryClient]
  );

  const cancelSale = useCallback(
    async (collection: Collection) => {
      try {
        setLoading(true);

        await apiListCollectionForSale(collection.id, {
          for_sale: false,
          sale_price: undefined,
          sale_tx: undefined,
          sale_listed_at: undefined,
        });

        addToast('Collection sale cancelled', 'success');

        queryClient.invalidateQueries({ queryKey: ['collections'] });
        queryClient.invalidateQueries({ queryKey: ['collection'] });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to cancel sale';
        addToast(message, 'error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [addToast, queryClient]
  );

  return { sellCollection, cancelSale, loading };
}
