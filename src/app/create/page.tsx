'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Upload, Zap, ImagePlus, X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CreatePage() {
  const { connected } = useWallet();
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol: 'CYBER',
    royalty: '5',
    collection: '',
  });
  const [minting, setMinting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleMint = async () => {
    if (!connected) return;
    setMinting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setMinting(false);
    alert('NFT Minted Successfully! (Demo Mode)');
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[56rem] mx-auto px-4 sm:px-6 py-10 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold uppercase tracking-wider mb-2">
            Create NFT
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Mint your digital artwork on Solana blockchain
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 w-full">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-1/2"
          >
            <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Upload Artwork
            </label>
            <div className="w-full">
              {preview ? (
                <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full">
                  <div className="relative aspect-square w-full">
                    <Image src={preview} alt="Preview" fill className="object-cover" />
                  </div>
                  <button
                    onClick={() => setPreview(null)}
                    className="absolute top-3 right-3 p-1.5 bg-black/60 text-white hover:text-[var(--color-crimson)] transition-colors cursor-pointer"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square w-full bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent)] transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <ImagePlus size={40} className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors mb-3" />
                  <p className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    Click to upload
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    PNG, JPG, GIF, SVG, WEBP (Max 50MB)
                  </p>
                </label>
              )}
            </div>
          </motion.div>

          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full lg:w-1/2 space-y-5"
          >
            <Input
              label="Name"
              placeholder="e.g., Cyber Sentinel #001"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div>
              <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Description
              </label>
              <textarea
                placeholder="Describe your NFT..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 px-4 py-3 text-sm font-[family-name:var(--font-body)] transition-all duration-300 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_10px_var(--accent-glow)] resize-none"
              />
            </div>

            <div className="flex gap-4 w-full">
              <div className="flex-1">
                <Input
                  label="Symbol"
                  placeholder="e.g., CYBER"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Royalty %"
                  type="number"
                  placeholder="5"
                  value={formData.royalty}
                  onChange={(e) => setFormData({ ...formData, royalty: e.target.value })}
                />
              </div>
            </div>

            <Input
              label="Collection (Optional)"
              placeholder="e.g., Cyber Sentinels"
              value={formData.collection}
              onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
            />

            {/* Preview Summary */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 w-full">
              <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] mb-3">
                Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Network</span>
                  <span className="font-[family-name:var(--font-mono)]">Solana Devnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Mint Fee</span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--accent)]">◎ ~0.01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Royalty</span>
                  <span className="font-[family-name:var(--font-mono)]">{formData.royalty || 0}%</span>
                </div>
              </div>
            </div>

            {connected ? (
              <Button
                size="lg"
                className="w-full"
                onClick={handleMint}
                loading={minting}
                disabled={!preview || !formData.name}
              >
                <Zap size={16} />
                {minting ? 'MINTING...' : 'MINT NFT'}
              </Button>
            ) : (
              <div className="text-center py-6 border border-[var(--border-color)] bg-[var(--bg-secondary)] w-full">
                <Upload size={24} className="mx-auto text-[var(--text-secondary)] mb-2" />
                <p className="text-sm text-[var(--text-secondary)]">
                  Connect your wallet to mint
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
