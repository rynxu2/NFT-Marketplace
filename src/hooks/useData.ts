'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NFT } from '@/types/nft';
import type { Auction, Bid } from '@/types/auction';
import type { Activity, ActivityType } from '@/types/activity';
import { useMarketplaceStore, type Listing } from '@/store/useMarketplaceStore';

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

// ─── Fetcher Helpers ────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

// ─── Hooks ──────────────────────────────────────────────────

export function useFetchNFTs(params?: { owner?: string; creator?: string; collection?: string; search?: string }) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const { mintedNFTs } = useMarketplaceStore();

  const refresh = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (params?.owner) query.set('owner', params.owner);
    if (params?.creator) query.set('creator', params.creator);
    if (params?.collection) query.set('collection', params.collection);
    if (params?.search) query.set('search', params.search);

    const rows = await fetchJSON<Record<string, unknown>>(`/api/nfts?${query.toString()}`);
    const mapped = rows.map(mapSupabaseNFT);

    // Merge with local store (dedup by mint)
    const remoteMints = new Set(mapped.map((n) => n.mint));
    const localOnly = mintedNFTs.filter((n) => !remoteMints.has(n.mint));
    let merged = [...mapped, ...localOnly];

    // Apply client-side filters for local NFTs
    if (params?.owner) merged = merged.filter((n) => n.owner === params.owner);
    if (params?.creator) merged = merged.filter((n) => n.creator === params.creator);

    setNfts(merged);
    setLoading(false);
  }, [params?.owner, params?.creator, params?.collection, params?.search, mintedNFTs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { nfts, loading, refresh };
}

export function useFetchListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { listings: storeListings } = useMarketplaceStore();

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await fetchJSON<Record<string, unknown>>('/api/listings');
    const mapped = rows.map(mapSupabaseListing);

    // Merge with local store
    const remoteMints = new Set(mapped.map((l) => l.mint));
    const localOnly = storeListings.filter((l) => !remoteMints.has(l.mint));

    setListings([...mapped, ...localOnly]);
    setLoading(false);
  }, [storeListings]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { listings, loading, refresh };
}

export function useFetchAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const { auctions: storeAuctions } = useMarketplaceStore();

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await fetchJSON<Record<string, unknown>>('/api/auctions');
    const mapped = rows.map(mapSupabaseAuction);

    // Merge with local store
    const remoteIds = new Set(mapped.map((a) => a.id));
    const localOnly = storeAuctions.filter((a) => !remoteIds.has(a.id));

    setAuctions([...mapped, ...localOnly]);
    setLoading(false);
  }, [storeAuctions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { auctions, loading, refresh };
}

export function useFetchActivities(params?: { type?: string; nftMint?: string; limit?: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { activities: storeActivities } = useMarketplaceStore();

  const refresh = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.nftMint) query.set('nft_mint', params.nftMint);
    if (params?.limit) query.set('limit', String(params.limit));

    const rows = await fetchJSON<Record<string, unknown>>(`/api/activities?${query.toString()}`);
    const mapped = rows.map(mapSupabaseActivity);

    // Merge with local store
    const remoteIds = new Set(mapped.map((a) => a.id));
    let localOnly = storeActivities.filter((a) => !remoteIds.has(a.id));

    if (params?.type) localOnly = localOnly.filter((a) => a.type === params.type);
    if (params?.nftMint) localOnly = localOnly.filter((a) => a.nftMint === params.nftMint);

    setActivities([...mapped, ...localOnly]);
    setLoading(false);
  }, [params?.type, params?.nftMint, params?.limit, storeActivities]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { activities, loading, refresh };
}
