'use client';

import React, { useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Settings, Image as ImageIcon, BarChart3, Trash2,
  Plus, X, Search, Loader2, Send, Shield,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useFetchCollection, useUpdateCollection, useCollectionNFTs, useTransferCollection } from '@/hooks/useCollections';
import { useFetchNFTs } from '@/hooks/useData';
import { useChainWallet } from '@/hooks/useChainWallet';
import { useToastStore } from '@/store/useToastStore';
import { COLLECTION_CATEGORIES } from '@/types/collection';
import { shortenAddress } from '@/lib/solana/connection';

type Tab = 'overview' | 'nfts' | 'settings';

export default function ManageCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { address } = useChainWallet();
  const { addToast } = useToastStore();
  const { collection, loading } = useFetchCollection(slug);
  const { nfts: allNFTs } = useFetchNFTs();
  const updateMutation = useUpdateCollection();
  const { addNFTs, removeNFTs } = useCollectionNFTs();
  const transferMutation = useTransferCollection();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);
  const [nftSearch, setNftSearch] = useState('');
  const [newOwner, setNewOwner] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'art',
    theme_color: '#00f0ff',
    twitter: '',
    discord: '',
    website: '',
  });

  // Init form data from collection
  React.useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description,
        category: collection.category,
        theme_color: collection.themeColor,
        twitter: collection.socialLinks.twitter || '',
        discord: collection.socialLinks.discord || '',
        website: collection.socialLinks.website || '',
      });
    }
  }, [collection]);

  const isOwner = address && collection?.owner === address;

  // NFTs in this collection
  const collectionNFTs = useMemo(
    () => allNFTs.filter((n) => {
      if (collection?.id && n.collectionId === collection.id) return true;
      if (n.collectionSlug === slug) return true;
      return false;
    }),
    [allNFTs, slug, collection]
  );

  // NFTs NOT in this collection (for adding)
  const availableNFTs = useMemo(() => {
    const query = nftSearch.toLowerCase();
    return allNFTs
      .filter((n) => n.owner === address && !n.collectionId && !n.collectionSlug)
      .filter((n) => !query || n.name.toLowerCase().includes(query));
  }, [allNFTs, address, nftSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!collection || !isOwner) {
    return (
      <div className="max-w-[48rem] mx-auto px-4 py-20 text-center">
        <Shield size={40} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h2 className="text-lg font-[family-name:var(--font-display)] mb-2">Access Denied</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {!collection ? 'Collection not found.' : 'Only the collection owner can manage it.'}
        </p>
        <Link href="/collections">
          <Button variant="secondary" size="sm"><ArrowLeft size={14} /> Back to Collections</Button>
        </Link>
      </div>
    );
  }

  const handleSaveOverview = async () => {
    setSaving(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (formData.twitter) socialLinks.twitter = formData.twitter;
      if (formData.discord) socialLinks.discord = formData.discord;
      if (formData.website) socialLinks.website = formData.website;

      await updateMutation.mutateAsync({
        id: collection.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        theme_color: formData.theme_color,
        social_links: socialLinks,
      });
      addToast('Collection updated!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNFT = async (mint: string) => {
    try {
      await addNFTs.mutateAsync({ collectionId: collection.id, mints: [mint] });
      addToast('NFT added to collection', 'success');
    } catch {
      addToast('Failed to add NFT', 'error');
    }
  };

  const handleRemoveNFT = async (mint: string) => {
    try {
      await removeNFTs.mutateAsync({ collectionId: collection.id, mints: [mint] });
      addToast('NFT removed from collection', 'info');
    } catch {
      addToast('Failed to remove NFT', 'error');
    }
  };

  const handleTransfer = async () => {
    if (!newOwner.trim()) return;
    try {
      await transferMutation.mutateAsync({ collectionId: collection.id, newOwner: newOwner.trim() });
      addToast('Ownership transferred!', 'success');
      router.push('/collections');
    } catch {
      addToast('Transfer failed', 'error');
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Settings size={14} /> },
    { id: 'nfts', label: `NFTs (${collectionNFTs.length})`, icon: <ImageIcon size={14} /> },
    { id: 'settings', label: 'Settings', icon: <BarChart3 size={14} /> },
  ];

  return (
    <div className="max-w-[56rem] mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link
          href={`/collection/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Collection
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-wider">
          Manage: {collection.name}
        </h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-[family-name:var(--font-display)] uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <Input
            label="Collection Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={saving}
          />
          <div>
            <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={saving}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] resize-none disabled:opacity-50"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={saving}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] cursor-pointer disabled:opacity-50"
              >
                {COLLECTION_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">Theme</label>
              <input
                type="color"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                className="w-10 h-10 border border-[var(--border-color)] bg-transparent cursor-pointer"
              />
            </div>
          </div>
          <Input label="Twitter" value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} disabled={saving} />
          <Input label="Discord" value={formData.discord} onChange={(e) => setFormData({ ...formData, discord: e.target.value })} disabled={saving} />
          <Input label="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} disabled={saving} />
          <Button onClick={handleSaveOverview} loading={saving} className="w-full">Save Changes</Button>
        </motion.div>
      )}

      {activeTab === 'nfts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Current NFTs */}
          <div>
            <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] mb-3">
              In Collection ({collectionNFTs.length})
            </h3>
            {collectionNFTs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] py-8 text-center border border-[var(--border-color)] bg-[var(--bg-secondary)]">No NFTs yet. Add some below.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {collectionNFTs.map((nft) => (
                  <div key={nft.mint} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2 group relative">
                    <div className="relative aspect-square mb-2">
                      <Image src={nft.image} alt={nft.name} fill className="object-cover" />
                    </div>
                    <p className="text-xs truncate">{nft.name}</p>
                    <button
                      onClick={() => handleRemoveNFT(nft.mint)}
                      className="absolute top-3 right-3 p-1 bg-black/60 text-[var(--color-crimson)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add NFTs */}
          <div>
            <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Add Your NFTs
            </h3>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                placeholder="Search your NFTs..."
                value={nftSearch}
                onChange={(e) => setNftSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            {availableNFTs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] py-4 text-center">No available NFTs to add</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[24rem] overflow-y-auto">
                {availableNFTs.slice(0, 20).map((nft) => (
                  <button
                    key={nft.mint}
                    onClick={() => handleAddNFT(nft.mint)}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2 text-left hover:border-[var(--accent)] transition-colors cursor-pointer group"
                  >
                    <div className="relative aspect-square mb-2">
                      <Image src={nft.image} alt={nft.name} fill className="object-cover" />
                      <div className="absolute inset-0 bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/10 transition-colors flex items-center justify-center">
                        <Plus size={20} className="text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-xs truncate">{nft.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'settings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Transfer Ownership */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6">
            <h3 className="text-sm font-[family-name:var(--font-display)] uppercase tracking-wider mb-1">Transfer Ownership</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Transfer this collection to another wallet address.</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="New owner wallet address"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                />
              </div>
              <Button onClick={handleTransfer} disabled={!newOwner.trim()} variant="secondary">
                <Send size={14} /> Transfer
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-[var(--color-crimson)]/5 border border-[var(--color-crimson)]/20 p-6">
            <h3 className="text-sm font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--color-crimson)] mb-1">Danger Zone</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Permanently delete this collection. NFTs will be detached but not deleted.</p>
            <Button
              variant="secondary"
              onClick={async () => {
                if (!confirm('Are you sure? This cannot be undone.')) return;
                try {
                  await fetch(`/api/collections/${collection.id}`, { method: 'DELETE' });
                  addToast('Collection deleted', 'info');
                  router.push('/collections');
                } catch {
                  addToast('Delete failed', 'error');
                }
              }}
              className="border-[var(--color-crimson)]/30 text-[var(--color-crimson)] hover:bg-[var(--color-crimson)]/10"
            >
              <Trash2 size={14} /> Delete Collection
            </Button>
          </div>

          {/* Stats */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6">
            <h3 className="text-sm font-[family-name:var(--font-display)] uppercase tracking-wider mb-3">Collection Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Items', value: collection.stats.items },
                { label: 'Owners', value: collection.stats.owners },
                { label: 'Floor', value: collection.stats.floorPrice || '—' },
                { label: 'Volume', value: collection.stats.totalVolume || '—' },
                { label: 'Listed', value: collection.stats.listed },
              ].map((stat) => (
                <div key={stat.label} className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 text-center">
                  <p className="font-[family-name:var(--font-mono)] text-sm font-bold">{stat.value}</p>
                  <p className="text-[8px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
