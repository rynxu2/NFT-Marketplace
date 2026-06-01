'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useFetchCollection } from '@/hooks/useCollections';
import { useChainStore } from '@/store/useChainStore';
import { useChainWallet } from '@/hooks/useChainWallet';
import CollectionBanner from '@/components/collections/CollectionBanner';
import NFTGrid from '@/components/nft/NFTGrid';
import EmptyState from '@/components/ui/EmptyState';
import type { NFT } from '@/types/nft';
import { useBuyCollection } from '@/hooks/useBuyCollection';
import { useSellCollection } from '@/hooks/useSellCollection';
import SellCollectionModal from '@/components/collections/SellCollectionModal';
import BuyCollectionModal from '@/components/collections/BuyCollectionModal';

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
    collectionId: row.collection_id as string | undefined,
    attributes: (row.attributes as NFT['attributes']) || [],
    createdAt: (row.created_at as string) || new Date().toISOString(),
    chain: (row.chain as NFT['chain']) || 'solana',
    tokenId: row.token_id as string | undefined,
    contractAddress: row.contract_address as string | undefined,
  };
}

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { address } = useChainWallet();
  const { collection, loading: loadingCollection } = useFetchCollection(slug);
  const { activeChain } = useChainStore();

  // Fetch NFTs by collection_id, filtered by current chain
  const { data: collectionNFTs = [], isLoading: loadingNFTs } = useQuery({
    queryKey: ['collection-nfts', collection?.id, activeChain],
    queryFn: async () => {
      if (!collection?.id) return [];
      const res = await fetch(`/api/nfts?collection_id=${collection.id}&chain=${activeChain}`);
      if (!res.ok) return [];
      const json = await res.json();
      return ((json.data || []) as Record<string, unknown>[]).map(mapNFT);
    },
    enabled: !!collection?.id,
  });

  const isOwner = !!(address && collection?.owner === address);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const { buyCollection, step: buyStep } = useBuyCollection();
  const { sellCollection, cancelSale, loading: sellLoading } = useSellCollection();
  const loading = loadingCollection || loadingNFTs;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-[80rem] mx-auto px-4 py-20 text-center">
        <Link href="/collections" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-4">
          <ArrowLeft size={14} /> Collections
        </Link>
        <EmptyState variant="collection" />
      </div>
    );
  }

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-6">
      {/* Back link */}
      <Link
        href="/collections"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Collections
      </Link>

      {/* Banner with full metadata */}
      <CollectionBanner
        collection={collection}
        isOwner={isOwner}
        onSellClick={() => setShowSellModal(true)}
        onBuyClick={() => setShowBuyModal(true)}
        onCancelSaleClick={() => cancelSale(collection)}
      />

      {/* NFT Grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
            Items ({collectionNFTs.length})
          </h2>
        </div>

        {collectionNFTs.length === 0 ? (
          <div className="py-16 text-center border border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <p className="text-sm text-[var(--text-secondary)]">No items in this collection yet.</p>
            {isOwner && (
              <Link
                href={`/collection/${slug}/manage`}
                className="inline-block mt-3 text-xs text-[var(--accent)] hover:underline"
              >
                Add NFTs →
              </Link>
            )}
          </div>
        ) : (
          <NFTGrid nfts={collectionNFTs} />
        )}
      </div>

      {/* Sale modals */}
      {collection && (
        <>
          <SellCollectionModal
            isOpen={showSellModal}
            onClose={() => setShowSellModal(false)}
            collection={collection}
            onSell={(price) => sellCollection(collection, price)}
            loading={sellLoading}
          />
          <BuyCollectionModal
            isOpen={showBuyModal}
            onClose={() => setShowBuyModal(false)}
            collection={collection}
            onBuy={() => buyCollection(collection)}
            step={buyStep}
          />
        </>
      )}
    </div>
  );
}

