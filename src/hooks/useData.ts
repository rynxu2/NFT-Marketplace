'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NFT } from '@/types/nft';
import type { Auction, Bid } from '@/types/auction';
import type { Activity, ActivityType } from '@/types/activity';
import type { Listing } from '@/store/useMarketplaceStore';

// ─── Query Keys ─────────────────────────────────────────────

export const queryKeys = {
  nfts: (params?: Record<string, string | undefined>) => ['nfts', params] as const,
  listings: () => ['listings'] as const,
  auctions: () => ['auctions'] as const,
  activities: (params?: Record<string, string | undefined>) => ['activities', params] as const,
};

// ─── Supabase → Client Type Mappers ────────────────────────

function mapSupabaseNFT(row: Record<string, unknown>): NFT {
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
    tokenId: row.token_id as string | undefined,
    contractAddress: row.contract_address as string | undefined,
    bridgeOrigin: row.bridge_origin as NFT['bridgeOrigin'],
  };
}

function mapSupabaseActivity(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    type: row.type as ActivityType,
    nftMint: (row.nft_mint as string) || '',
    nftName: (row.nft_name as string) || '',
    nftImage: (row.nft_image as string) || '',
    from: (row.from_address as string) || '',
    to: (row.to_address as string) || '',
    price: row.price as number | undefined,
    timestamp: (row.created_at as string) || new Date().toISOString(),
    txSignature: row.tx_signature as string | undefined,
    collection: row.collection as string | undefined,
  };
}

function mapSupabaseListing(row: Record<string, unknown>): Listing {
  const nftRow = row.nft as Record<string, unknown> | null;
  const nft: NFT = nftRow
    ? mapSupabaseNFT(nftRow)
    : {
        mint: row.mint as string,
        name: '',
        symbol: 'CYBER',
        description: '',
        image: '',
        owner: row.seller as string,
        creator: '',
        listed: true,
        price: row.price as number,
        attributes: [],
        createdAt: (row.listed_at as string) || new Date().toISOString(),
        chain: 'solana' as const,
      };

  return {
    id: row.id as string,
    mint: row.mint as string,
    seller: row.seller as string,
    price: row.price as number,
    nft: { ...nft, listed: true, price: row.price as number },
    listedAt: (row.listed_at as string) || new Date().toISOString(),
    txSignature: row.tx_signature as string | undefined,
  };
}

function mapSupabaseAuction(row: Record<string, unknown>): Auction {
  const nftRow = row.nft as Record<string, unknown> | null;
  const bidsRaw = (row.bids as Record<string, unknown>[]) || [];

  const nft: NFT = nftRow
    ? mapSupabaseNFT(nftRow)
    : {
        mint: row.nft_mint as string,
        name: '',
        symbol: 'CYBER',
        description: '',
        image: '',
        owner: row.seller as string,
        creator: '',
        listed: false,
        attributes: [],
        createdAt: (row.start_time as string) || new Date().toISOString(),
        chain: 'solana' as const,
      };

  const bids: Bid[] = bidsRaw.map((b) => ({
    id: b.id as string,
    auctionId: (b.auction_id as string) || (row.id as string),
    bidder: b.bidder as string,
    amount: b.amount as number,
    timestamp: (b.created_at as string) || new Date().toISOString(),
  }));

  return {
    id: row.id as string,
    nft,
    seller: row.seller as string,
    startingPrice: row.starting_price as number,
    currentBid: (row.current_bid as number) || (row.starting_price as number),
    highestBidder: (row.highest_bidder as string) || null,
    startTime: (row.start_time as string) || new Date().toISOString(),
    endTime: row.end_time as string,
    status: (row.status as Auction['status']) || 'active',
    bids,
    minBidIncrement: (row.min_bid_increment as number) || 0.5,
  };
}

// ─── Fetcher ────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// ─── Hooks (React Query) ────────────────────────────────────

export function useFetchNFTs(params?: { owner?: string; creator?: string; collection?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.owner) query.set('owner', params.owner);
  if (params?.creator) query.set('creator', params.creator);
  if (params?.collection) query.set('collection', params.collection);
  if (params?.search) query.set('search', params.search);

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.nfts(params as Record<string, string | undefined>),
    queryFn: () => fetchJSON<Record<string, unknown>>(`/api/nfts?${query.toString()}`).then(rows => rows.map(mapSupabaseNFT)),
  });

  return { nfts: data || [], loading: isLoading, refresh: refetch };
}

export function useFetchListings() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.listings(),
    queryFn: () => fetchJSON<Record<string, unknown>>('/api/listings').then(rows => rows.map(mapSupabaseListing)),
  });

  return { listings: data || [], loading: isLoading, refresh: refetch };
}

export function useFetchAuctions(options?: { pollingInterval?: number }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.auctions(),
    queryFn: () => fetchJSON<Record<string, unknown>>('/api/auctions').then(rows => rows.map(mapSupabaseAuction)),
    refetchInterval: options?.pollingInterval,
  });

  return { auctions: data || [], loading: isLoading, refresh: refetch };
}

export function useFetchActivities(params?: { type?: string; nftMint?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.nftMint) query.set('nft_mint', params.nftMint);
  if (params?.limit) query.set('limit', String(params.limit));

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.activities(params as Record<string, string | undefined>),
    queryFn: () => fetchJSON<Record<string, unknown>>(`/api/activities?${query.toString()}`).then(rows => rows.map(mapSupabaseActivity)),
  });

  return { activities: data || [], loading: isLoading, refresh: refetch };
}

// ─── Invalidation Helper ────────────────────────────────────

/**
 * Hook to invalidate all marketplace data queries.
 * Call after any mutation (mint, list, buy, bid, settle).
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    invalidateNFTs: () => queryClient.invalidateQueries({ queryKey: ['nfts'] }),
    invalidateListings: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
    invalidateAuctions: () => queryClient.invalidateQueries({ queryKey: ['auctions'] }),
    invalidateActivities: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  };
}
