'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Upload, Palette, Save } from 'lucide-react';
import type { Collection, CollectionCategory } from '@/types/collection';
import { COLLECTION_CATEGORIES } from '@/types/collection';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface CollectionFormData {
  name: string;
  description: string;
  category: string;
  theme_color: string;
  social_links: { twitter?: string; discord?: string; website?: string };
}

interface CollectionManageFormProps {
  collection: Collection;
  onSave: (updates: Partial<CollectionFormData>) => Promise<void>;
  saving: boolean;
}

export default function CollectionManageForm({
  collection,
  onSave,
  saving,
}: CollectionManageFormProps) {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description);
  const [category, setCategory] = useState<string>(collection.category);
  const [themeColor, setThemeColor] = useState(
    collection.theme_color || collection.themeColor || '#00e5ff'
  );
  const [twitter, setTwitter] = useState(
    collection.social_links?.twitter || collection.socialLinks?.twitter || ''
  );
  const [discord, setDiscord] = useState(
    collection.social_links?.discord || collection.socialLinks?.discord || ''
  );
  const [website, setWebsite] = useState(
    collection.social_links?.website || collection.socialLinks?.website || ''
  );

  const [logoPreview, setLogoPreview] = useState<string | null>(collection.logo || collection.image || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(collection.banner || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url || data.image || null;
      }
    } catch {
      // Upload failed
    }
    return null;
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setLogoPreview(URL.createObjectURL(file));
    const url = await uploadImage(file);
    if (url) setLogoPreview(url);
    setUploadingLogo(false);
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setBannerPreview(URL.createObjectURL(file));
    const url = await uploadImage(file);
    if (url) setBannerPreview(url);
    setUploadingBanner(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name,
      description,
      category,
      theme_color: themeColor,
      social_links: {
        twitter: twitter || undefined,
        discord: discord || undefined,
        website: website || undefined,
      },
    });
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="space-y-8"
    >
      {/* Images section */}
      <div className="space-y-4">
        <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
          Images
        </h3>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Logo upload */}
          <div className="shrink-0">
            <p className="text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Logo
            </p>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="relative w-24 h-24 rounded-full border-2 border-dashed border-[var(--border-color)] overflow-hidden bg-[var(--bg-primary)] hover:border-[var(--accent)] transition-colors group cursor-pointer"
            >
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
                  <Upload size={18} />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingLogo ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload size={18} className="text-white" />
                )}
              </div>
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>

          {/* Banner upload */}
          <div className="flex-1">
            <p className="text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Banner
            </p>
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="relative w-full h-32 border-2 border-dashed border-[var(--border-color)] overflow-hidden bg-[var(--bg-primary)] hover:border-[var(--accent)] transition-colors group cursor-pointer"
            >
              {bannerPreview ? (
                <Image
                  src={bannerPreview}
                  alt="Banner"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 text-[var(--text-secondary)]">
                  <Upload size={20} />
                  <span className="text-[10px] font-[family-name:var(--font-display)] uppercase tracking-wider">
                    Upload Banner
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingBanner ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload size={20} className="text-white" />
                )}
              </div>
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="space-y-4">
        <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
          Details
        </h3>

        <Input
          label="Collection Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Collection"
          required
        />

        {/* Description textarea */}
        <div className="w-full">
          <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your collection..."
            rows={4}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 px-4 py-3 text-sm font-[family-name:var(--font-body)] transition-all duration-300 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_10px_var(--accent-glow)] resize-none"
          />
        </div>

        {/* Category select */}
        <div className="w-full">
          <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CollectionCategory)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 text-sm font-[family-name:var(--font-body)] transition-all duration-300 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_10px_var(--accent-glow)] cursor-pointer appearance-none"
          >
            {COLLECTION_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme color */}
        <div className="w-full">
          <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Theme Color
          </label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-10 h-10 border border-[var(--border-color)] bg-transparent cursor-pointer rounded-sm"
              />
            </div>
            <div className="flex-1 relative">
              <Palette size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] pl-9 pr-4 py-2.5 text-sm font-[family-name:var(--font-mono)] transition-all duration-300 focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            {/* Color preview swatch */}
            <div
              className="w-10 h-10 border border-[var(--border-color)]"
              style={{ backgroundColor: themeColor }}
            />
          </div>
        </div>
      </div>

      {/* Social links section */}
      <div className="space-y-4">
        <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
          Social Links
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Twitter / X"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="@username or URL"
          />
          <Input
            label="Discord"
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            placeholder="https://discord.gg/..."
          />
          <Input
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={saving}
          disabled={saving || !name.trim()}
        >
          <Save size={16} />
          Save Changes
        </Button>
      </div>
    </motion.form>
  );
}
