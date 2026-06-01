'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Gavel } from 'lucide-react';
import type { NFT } from '@/types/nft';
import { formatChainCurrency } from '@/types/chain';
import Badge from '@/components/ui/Badge';
import { useFetchAuctions } from '@/hooks/useData';
import { useFavorites } from '@/hooks/useFavorites';
import { CHAIN_CONFIGS } from '@/types/chain';

interface NFTCardProps {
  nft: NFT;
  index?: number;
}

export default function NFTCard({ nft, index = 0 }: NFTCardProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const liked = isFavorited(nft.mint);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const { auctions } = useFetchAuctions();
  const [currentTime] = useState(() => Date.now());
  const activeAuction = auctions.find(
    (a) =>
      a.nft?.mint === nft.mint &&
      a.status !== 'settled' &&
      (new Date(a.endTime).getTime() > currentTime || !!a.highestBidder)
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const rarity = nft.attributes.find(a => a.trait_type === 'Rarity')?.value as string;
  const rarityVariant = rarity === 'Legendary' ? 'warning' : rarity === 'Epic' ? 'danger' : rarity === 'Rare' ? 'info' : 'default';

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
      className="group"
    >
      <Link href={`/nft/${nft.mint}`} className="block">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden transition-all duration-300 group-hover:border-[var(--accent)]/40 group-hover:shadow-[0_0_20px_var(--accent-glow)]">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={nft.image}
              alt={nft.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Like button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(nft.mint);
              }}
              className="absolute top-3 right-3 p-2 bg-black/40 border border-white/10 text-white hover:text-[var(--color-crimson)] transition-colors z-10 cursor-pointer"
              aria-label="Like NFT"
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-[var(--color-crimson)]' : ''} />
            </button>

            {/* Rarity Badge */}
            {rarity && (
              <div className="absolute top-3 left-3">
                <Badge variant={rarityVariant} size="sm">{rarity}</Badge>
              </div>
            )}

            {/* Chain Badge */}
            {nft.chain && (
              <div
                className="absolute bottom-3 left-3 px-2 py-0.5 text-[9px] font-[family-name:var(--font-mono)] font-bold uppercase tracking-wider bg-black/60 border border-white/10 backdrop-blur-sm"
                style={{ color: CHAIN_CONFIGS[nft.chain]?.color || 'var(--accent)' }}
              >
                {CHAIN_CONFIGS[nft.chain]?.icon} {CHAIN_CONFIGS[nft.chain]?.name}
              </div>
            )}

            {/* Quick Action on hover */}
            {activeAuction ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{ y: 0 }}
              >
                <button
                  onClick={(e) => e.preventDefault()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-signal-orange)] text-[var(--bg-primary)] text-xs font-[family-name:var(--font-display)] uppercase tracking-wider clip-corner-sm hover:shadow-[0_0_15px_var(--color-signal-orange)] transition-all cursor-pointer"
                >
                  <Gavel size={12} />
                  PLACE BID
                </button>
              </motion.div>
            ) : nft.listed && nft.price ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{ y: 0 }}
              >
                <button
                  onClick={(e) => e.preventDefault()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--bg-primary)] text-xs font-[family-name:var(--font-display)] uppercase tracking-wider clip-corner-sm hover:shadow-[0_0_15px_var(--accent-glow)] transition-all cursor-pointer"
                >
                  <ShoppingCart size={12} />
                  BUY NOW
                </button>
              </motion.div>
            ) : null}
          </div>

          {/* Info */}
          <div className="p-4">
            {/* Collection */}
            <p className="text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-1 truncate">
              {nft.collection || 'Independent'}
            </p>

            {/* Name */}
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-3 group-hover:text-[var(--accent)] transition-colors">
              {nft.name}
            </h3>

            {/* Price / Status */}
            <div className="flex items-center justify-between">
              {activeAuction ? (
                <div>
                  <p className="text-[10px] text-[var(--color-signal-orange)] uppercase tracking-wider mb-0.5">Current Bid</p>
                  <p className="text-sm font-[family-name:var(--font-mono)] font-semibold text-[var(--color-signal-orange)]">
                    {formatChainCurrency(activeAuction.currentBid, nft.chain || 'solana')}
                  </p>
                </div>
              ) : nft.listed && nft.price ? (
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Price</p>
                  <p className="text-sm font-[family-name:var(--font-mono)] font-semibold text-[var(--accent)]">
                    {formatChainCurrency(nft.price, nft.chain || 'solana')}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Not Listed</p>
                </div>
              )}
              <div className="text-right">
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Creator</p>
                <p className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                  {nft.creator.slice(0, 4)}...
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
