'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChainStore } from '@/store/useChainStore';
import type { Collection, CollectionCategory } from '@/types/collection';

// ─── Query Keys ─────────────────────────────────────────────

export const collectionKeys = {
  all: (chain: string) => ['collections', chain] as const,
  detail: (idOrSlug: string) => ['collection', idOrSlug] as const,
};

// ─── Mapper ─────────────────────────────────────────────────

function mapCollection(row: Record<string, unknown>): Collection {
  const socialLinks = (row.social_links as Record<string, string>) || {};
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string) || '',
    image: (row.logo as string) || (row.image as string) || '',
    logo: (row.logo as string) || null,
    banner: (row.banner as string) || null,
    logoIpfs: (row.logo_ipfs as string) || null,
    bannerIpfs: (row.banner_ipfs as string) || null,
    creator: (row.owner as string) || '',
    owner: row.owner as string,
    verified: (row.is_verified as boolean) || false,
    isVerified: (row.is_verified as boolean) || false,
    category: (row.category as CollectionCategory) || 'art',
    themeColor: (row.theme_color as string) || '#00f0ff',
    socialLinks,
    featuredNfts: (row.featured_nfts as string[]) || [],
    chain: (row.chain as Collection['chain']) || 'solana',
    settings: (row.settings as Record<string, unknown>) || {},
    stats: (() => {
      const s = (row.stats as Record<string, number | null>) || {};
      return {
        items: (s.item_count as number) || (row.nft_count as number) || 0,
        owners: (s.owner_count as number) || (row.owner_count as number) || 0,
        floorPrice: (s.floor_price as number) || (row.floor_price as number) || 0,
        totalVolume: (s.volume as number) || (row.total_volume as number) || 0,
        listed: (s.listed_count as number) || (row.listed_count as number) || 0,
      };
    })(),
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
    forSale: (row.for_sale as boolean) || false,
    salePrice: (row.sale_price as number) || null,
    saleCurrency: (row.sale_currency as string) || 'SOL',
    saleTx: (row.sale_tx as string) || null,
    saleListedAt: (row.sale_listed_at as string) || null,
  };
}

// ─── Fetchers ───────────────────────────────────────────────

async function fetchCollections(chain: string, params?: {
  owner?: string;
  search?: string;
  category?: string;
}): Promise<Collection[]> {
  const query = new URLSearchParams();
  query.set('chain', chain);
  if (params?.owner) query.set('owner', params.owner);
  if (params?.search) query.set('search', params.search);
  if (params?.category) query.set('category', params.category);

  const res = await fetch(`/api/collections?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch collections');
  const json = await res.json();
  return (json.data || []).map(mapCollection);
}

async function fetchCollection(idOrSlug: string, chain?: string): Promise<Collection | null> {
  const query = chain ? `?chain=${chain}` : '';
  const res = await fetch(`/api/collections/${idOrSlug}${query}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch collection');
  }
  const json = await res.json();
  return json.data ? mapCollection(json.data) : null;
}

// ─── Hooks ──────────────────────────────────────────────────

export function useFetchCollections(params?: {
  owner?: string;
  search?: string;
  category?: string;
}) {
  const { activeChain } = useChainStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: [...collectionKeys.all(activeChain), params],
    queryFn: () => fetchCollections(activeChain, params),
  });

  return { collections: data || [], loading: isLoading, refresh: refetch };
}

export function useFetchCollection(idOrSlug: string | undefined) {
  const { activeChain } = useChainStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: [...collectionKeys.detail(idOrSlug || ''), activeChain],
    queryFn: () => fetchCollection(idOrSlug!, activeChain),
    enabled: !!idOrSlug,
  });

  return { collection: data || null, loading: isLoading, refresh: refetch };
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      logo?: string;
      banner?: string;
      logo_ipfs?: string;
      banner_ipfs?: string;
      owner: string;
      category?: string;
      theme_color?: string;
      social_links?: Record<string, string>;
      chain: string;
    }) => {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}

export function useCollectionNFTs() {
  const queryClient = useQueryClient();

  const addNFTs = useMutation({
    mutationFn: async ({ collectionId, mints }: { collectionId: string; mints: string[] }) => {
      const res = await fetch(`/api/collections/${collectionId}/nfts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mints }),
      });
      if (!res.ok) throw new Error('Failed to add NFTs');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  const removeNFTs = useMutation({
    mutationFn: async ({ collectionId, mints }: { collectionId: string; mints: string[] }) => {
      const res = await fetch(`/api/collections/${collectionId}/nfts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mints }),
      });
      if (!res.ok) throw new Error('Failed to remove NFTs');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  return { addNFTs, removeNFTs };
}

export function useTransferCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, newOwner }: { collectionId: string; newOwner: string }) => {
      const res = await fetch(`/api/collections/${collectionId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_owner: newOwner }),
      });
      if (!res.ok) throw new Error('Failed to transfer collection');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}
