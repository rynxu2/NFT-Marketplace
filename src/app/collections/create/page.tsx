'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Upload, ImagePlus, X, Loader2, Palette, Globe, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreateCollection } from '@/hooks/useCollections';
import { useChainWallet } from '@/hooks/useChainWallet';
import { useChainStore } from '@/store/useChainStore';
import { useToastStore } from '@/store/useToastStore';
import { CHAIN_CONFIGS } from '@/types/chain';
import { COLLECTION_CATEGORIES } from '@/types/collection';

export default function CreateCollectionPage() {
  const router = useRouter();
  const { connected, address } = useChainWallet();
  const { activeChain } = useChainStore();
  const chainConfig = CHAIN_CONFIGS[activeChain];
  const { addToast } = useToastStore();
  const createMutation = useCreateCollection();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'art',
    theme_color: '#00f0ff',
    twitter: '',
    discord: '',
    website: '',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const json = await res.json();
    return json.url;
  };

  const handleSubmit = async () => {
    if (!address || !formData.name.trim()) return;

    setSaving(true);
    try {
      let logoUrl: string | undefined;
      let bannerUrl: string | undefined;

      if (logoFile) {
        addToast('Uploading logo...', 'info', undefined, 2000);
        logoUrl = await handleImageUpload(logoFile);
      }
      if (bannerFile) {
        addToast('Uploading banner...', 'info', undefined, 2000);
        bannerUrl = await handleImageUpload(bannerFile);
      }

      const socialLinks: Record<string, string> = {};
      if (formData.twitter) socialLinks.twitter = formData.twitter;
      if (formData.discord) socialLinks.discord = formData.discord;
      if (formData.website) socialLinks.website = formData.website;

      await createMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim(),
        logo: logoUrl,
        banner: bannerUrl,
        owner: address,
        category: formData.category,
        theme_color: formData.theme_color,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        chain: activeChain,
      });

      addToast(`Collection "${formData.name}" created!`, 'success');
      router.push('/collections');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create collection';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[48rem] mx-auto px-4 sm:px-6 py-10 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold uppercase tracking-wider mb-2">
            Create Collection
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Build your curated NFT collection on {chainConfig.name}
          </p>
          <p className="text-xs text-[var(--accent)] font-[family-name:var(--font-mono)] mb-8">
            Network: {chainConfig.name} {chainConfig.testnetName}
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* Banner Upload */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Banner Image
            </label>
            {bannerPreview ? (
              <div className="relative w-full h-40 sm:h-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden">
                <Image src={bannerPreview} alt="Banner" fill className="object-cover" />
                {!saving && (
                  <button
                    onClick={() => { setBannerPreview(null); setBannerFile(null); }}
                    className="absolute top-3 right-3 p-1.5 bg-black/60 text-white hover:text-[var(--color-crimson)] transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 sm:h-48 w-full bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent)] transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
                  }}
                  className="hidden"
                />
                <Upload size={28} className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors mb-2" />
                <p className="text-xs text-[var(--text-secondary)]">Upload banner (1400×400 recommended)</p>
              </label>
            )}
          </motion.div>

          {/* Logo Upload */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative w-20 h-20 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] overflow-hidden shrink-0">
                  <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                  {!saving && (
                    <button
                      onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <label className="flex items-center justify-center w-20 h-20 rounded-full bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent)] transition-colors cursor-pointer group shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
                    }}
                    className="hidden"
                  />
                  <ImagePlus size={20} className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
                </label>
              )}
              <p className="text-xs text-[var(--text-secondary)]">Square image, 400×400 recommended</p>
            </div>
          </motion.div>

          {/* Name & Description */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-5">
            <Input
              label="Collection Name"
              placeholder="e.g., Cyber Sentinels"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={saving}
            />

            <div>
              <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Description
              </label>
              <textarea
                placeholder="Tell the world about your collection..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={saving}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 px-4 py-3 text-sm font-[family-name:var(--font-body)] transition-all duration-300 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_10px_var(--accent-glow)] resize-none disabled:opacity-50"
              />
            </div>
          </motion.div>

          {/* Category & Theme */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={saving}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 text-sm font-[family-name:var(--font-body)] transition-all duration-300 focus:outline-none focus:border-[var(--accent)] cursor-pointer disabled:opacity-50"
              >
                {COLLECTION_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                <Palette size={10} className="inline mr-1" />Theme Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                  disabled={saving}
                  className="w-10 h-10 border border-[var(--border-color)] bg-transparent cursor-pointer disabled:opacity-50"
                />
                <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                  {formData.theme_color}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              <Globe size={10} className="inline mr-1" />Social Links (Optional)
            </label>
            <div className="space-y-3">
              <Input
                placeholder="Twitter URL"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                disabled={saving}
              />
              <Input
                placeholder="Discord URL"
                value={formData.discord}
                onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                disabled={saving}
              />
              <Input
                placeholder="Website URL"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={saving}
              />
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4">
              <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] mb-3">
                Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Network</span>
                  <span className="font-[family-name:var(--font-mono)]">{chainConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Category</span>
                  <span className="font-[family-name:var(--font-mono)] capitalize">{formData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Logo</span>
                  <span className="font-[family-name:var(--font-mono)]">{logoFile ? '✓ Uploaded' : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Banner</span>
                  <span className="font-[family-name:var(--font-mono)]">{bannerFile ? '✓ Uploaded' : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Storage</span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--accent)]">Cloudinary + IPFS</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          {connected ? (
            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              loading={saving}
              disabled={!formData.name.trim() || saving}
            >
              <Plus size={16} />
              {saving ? 'Creating...' : 'CREATE COLLECTION'}
            </Button>
          ) : (
            <div className="text-center py-6 border border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <Upload size={24} className="mx-auto text-[var(--text-secondary)] mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">Connect your wallet to create a collection</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
