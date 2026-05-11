'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import type { NFT } from '@/types/nft';

function mapNFT(row: Record<string, unknown>): NFT {
  return {
    mint: row.mint as string,
    name: row.name as string,
    symbol: (row.symbol as string) || 'CYBER',
    description: (row.description as string) || '',
    image: row.image as string,
    owner: row.owner as string,
    creator: row.creator as string,
    price: row.price as number | undefined,
    listed: (row.listed as boolean) || false,
    collection: row.collection as string | undefined,
    collectionSlug: row.collection_slug as string | undefined,
    attributes: (row.attributes as NFT['attributes']) || [],
    createdAt: (row.created_at as string) || new Date().toISOString(),
    chain: (row.chain as NFT['chain']) || 'solana',
  };
}

export function useFavorites() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const address = publicKey?.toBase58();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', address],
    queryFn: async () => {
      if (!address) return [];
      const res = await fetch(`/api/favorites?user=${address}`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data || []).map(mapNFT);
    },
    enabled: !!address,
  });

  const { data: favoriteMints = [] } = useQuery({
    queryKey: ['favorite-mints', address],
    queryFn: async () => {
      if (!address) return [];
      const res = await fetch(`/api/favorites?user=${address}`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data || []).map((n: Record<string, unknown>) => n.mint as string);
    },
    enabled: !!address,
  });

  const isFavorited = useCallback(
    (mint: string) => favoriteMints.includes(mint),
    [favoriteMints]
  );

  const toggleFavorite = useCallback(
    async (mint: string) => {
      if (!address) return;

      const isFav = favoriteMints.includes(mint);

      // Optimistic update
      queryClient.setQueryData(['favorite-mints', address], (prev: string[] | undefined) =>
        isFav ? (prev || []).filter((m) => m !== mint) : [...(prev || []), mint]
      );

      try {
        await fetch('/api/favorites', {
          method: isFav ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_address: address, nft_mint: mint }),
        });

        // Invalidate to sync
        queryClient.invalidateQueries({ queryKey: ['favorites', address] });
        queryClient.invalidateQueries({ queryKey: ['favorite-mints', address] });
      } catch {
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey: ['favorite-mints', address] });
      }
    },
    [address, favoriteMints, queryClient]
  );

  return { favorites, favoriteMints, isFavorited, toggleFavorite, loading: isLoading };
}
