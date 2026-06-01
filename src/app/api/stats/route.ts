import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');

    // Fetch activities for aggregation
    let activitiesQuery = supabase
      .from('activities')
      .select('type, price, from_address, to_address, nft_mint, created_at, chain');
    if (chain) {
      activitiesQuery = activitiesQuery.eq('chain', chain);
    }
    const { data: activities } = await activitiesQuery.order('created_at', { ascending: false });

    let nftsQuery = supabase.from('nfts').select('mint, collection, owner, creator, listed, price, chain');
    if (chain) {
      nftsQuery = nftsQuery.eq('chain', chain);
    }
    const { data: nfts } = await nftsQuery;

    let auctionsQuery = supabase.from('auctions').select('nft_mint, current_bid, status, chain');
    if (chain) {
      auctionsQuery = auctionsQuery.eq('chain', chain);
    }
    const { data: auctions } = await auctionsQuery;

    const allActivities = activities || [];
    const allNFTs = nfts || [];

    // --- Collection Stats ---
    const collectionMap: Record<string, {
      name: string;
      items: number;
      owners: Set<string>;
      volume: number;
      floorPrice: number;
      listed: number;
    }> = {};

    for (const nft of allNFTs) {
      const col = (nft.collection as string) || 'Independent';
      if (!collectionMap[col]) {
        collectionMap[col] = { name: col, items: 0, owners: new Set(), volume: 0, floorPrice: Infinity, listed: 0 };
      }
      collectionMap[col].items++;
      collectionMap[col].owners.add(nft.owner as string);
      if (nft.listed && nft.price) {
        collectionMap[col].listed++;
        collectionMap[col].floorPrice = Math.min(collectionMap[col].floorPrice, nft.price as number);
      }
    }

    // Aggregate sale volume per collection
    const nftCollectionMap = Object.fromEntries(allNFTs.map((n) => [n.mint, (n.collection as string) || 'Independent']));
    for (const act of allActivities) {
      if (act.type === 'sale' && act.price) {
        const col = nftCollectionMap[act.nft_mint as string] || 'Independent';
        if (collectionMap[col]) {
          collectionMap[col].volume += act.price as number;
        }
      }
    }

    const collectionStats = Object.values(collectionMap)
      .map((c) => ({
        name: c.name,
        items: c.items,
        owners: c.owners.size,
        volume: Math.round(c.volume * 1000) / 1000,
        floorPrice: c.floorPrice === Infinity ? 0 : c.floorPrice,
        listed: c.listed,
      }))
      .sort((a, b) => b.volume - a.volume);

    // --- Top Traders Leaderboard ---
    const traderMap: Record<string, { address: string; buyVolume: number; sellVolume: number; trades: number }> = {};

    for (const act of allActivities) {
      if (act.type === 'sale' && act.price) {
        const buyer = act.to_address as string;
        const seller = act.from_address as string;

        if (buyer) {
          if (!traderMap[buyer]) traderMap[buyer] = { address: buyer, buyVolume: 0, sellVolume: 0, trades: 0 };
          traderMap[buyer].buyVolume += act.price as number;
          traderMap[buyer].trades++;
        }
        if (seller) {
          if (!traderMap[seller]) traderMap[seller] = { address: seller, buyVolume: 0, sellVolume: 0, trades: 0 };
          traderMap[seller].sellVolume += act.price as number;
          traderMap[seller].trades++;
        }
      }
    }

    const topTraders = Object.values(traderMap)
      .map((t) => ({ ...t, totalVolume: Math.round((t.buyVolume + t.sellVolume) * 1000) / 1000 }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 20);

    // --- Top Creators ---
    const creatorMap: Record<string, { address: string; created: number; totalVolume: number }> = {};

    for (const nft of allNFTs) {
      const creator = nft.creator as string;
      if (!creatorMap[creator]) creatorMap[creator] = { address: creator, created: 0, totalVolume: 0 };
      creatorMap[creator].created++;
    }

    for (const act of allActivities) {
      if (act.type === 'sale' && act.price && act.from_address) {
        if (creatorMap[act.from_address as string]) {
          creatorMap[act.from_address as string].totalVolume += act.price as number;
        }
      }
    }

    const topCreators = Object.values(creatorMap)
      .map((c) => ({ ...c, totalVolume: Math.round(c.totalVolume * 1000) / 1000 }))
      .sort((a, b) => b.created - a.created)
      .slice(0, 20);

    // --- Global Stats ---
    const totalVolume = allActivities
      .filter((a) => a.type === 'sale')
      .reduce((sum, a) => sum + ((a.price as number) || 0), 0);

    const totalNFTs = allNFTs.length;
    const totalCreators = new Set(allNFTs.map((n) => n.creator)).size;
    const activeAuctions = (auctions || []).filter((a) => a.status === 'active').length;
    const totalListings = allNFTs.filter((n) => n.listed).length;

    return NextResponse.json({
      global: {
        totalVolume: Math.round(totalVolume * 1000) / 1000,
        totalNFTs,
        totalCreators,
        activeAuctions,
        totalListings,
        totalTransactions: allActivities.length,
      },
      collections: collectionStats,
      topTraders,
      topCreators,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
