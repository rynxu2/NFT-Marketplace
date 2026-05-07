'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Zap, ImagePlus, X, Plus, Trash2, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useMintNFT, type MintStep } from '@/hooks/useMint';
import { getExplorerUrl, getNetwork } from '@/lib/solana/connection';

const STEP_LABELS: Record<MintStep, string> = {
  idle: '',
  'uploading-image': 'Uploading image to IPFS...',
  'uploading-metadata': 'Uploading metadata to IPFS...',
  minting: 'Minting on Solana blockchain...',
  success: 'NFT Minted Successfully!',
  error: 'Minting failed',
};

export default function CreatePage() {
  const { connected } = useWallet();
  const { mint, step, error, result, reset } = useMintNFT();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol: 'CYBER',
    royalty: '5',
    collection: '',
  });
  const [attributes, setAttributes] = useState<{ trait_type: string; value: string }[]>([
    { trait_type: 'Rarity', value: 'Common' },
  ]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', val: string) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: val };
    setAttributes(updated);
  };

  const handleMint = async () => {
    if (!connected || !selectedFile || !formData.name) return;

    await mint({
      file: selectedFile,
      name: formData.name,
      symbol: formData.symbol,
      description: formData.description,
      royalty: parseInt(formData.royalty) || 5,
      collection: formData.collection || undefined,
      attributes: attributes.filter((a) => a.trait_type && a.value),
    });
  };

  const handleReset = () => {
    reset();
    setPreview(null);
    setSelectedFile(null);
    setFormData({ name: '', description: '', symbol: 'CYBER', royalty: '5', collection: '' });
    setAttributes([{ trait_type: 'Rarity', value: 'Common' }]);
  };

  const isMinting = step !== 'idle' && step !== 'success' && step !== 'error';
  const network = getNetwork();

  return (
    <div className="min-h-screen">
      <div className="max-w-[56rem] mx-auto px-4 sm:px-6 py-10 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold uppercase tracking-wider mb-2">
            Create NFT
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Mint your digital artwork on Solana blockchain
          </p>
          <p className="text-xs text-[var(--accent)] font-[family-name:var(--font-mono)] mb-8">
            Network: {network === 'devnet' ? 'Solana Devnet' : 'Solana Mainnet'}
          </p>
        </motion.div>

        {/* Success State */}
        <AnimatePresence>
          {step === 'success' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-6 bg-[var(--color-electric-lime)]/10 border border-[var(--color-electric-lime)]/30"
            >
              <div className="flex items-start gap-4">
                <CheckCircle size={24} className="text-[var(--color-electric-lime)] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-electric-lime)] mb-2">
                    NFT Minted Successfully!
                  </h3>
                  <div className="space-y-1 text-xs font-[family-name:var(--font-mono)]">
                    <p className="text-[var(--text-secondary)]">
                      Mint: <span className="text-[var(--text-primary)]">{result.mintAddress}</span>
                    </p>
                    <p className="text-[var(--text-secondary)]">
                      Tx:{' '}
                      <a
                        href={getExplorerUrl(result.txSignature)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                      >
                        {result.txSignature.slice(0, 20)}...
                        <ExternalLink size={10} />
                      </a>
                    </p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button size="sm" onClick={handleReset}>
                      Mint Another
                    </Button>
                    <Link href={`/nft/${result.mintAddress}`}>
                      <Button variant="secondary" size="sm">
                        View NFT
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        <AnimatePresence>
          {isMinting && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/30"
            >
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="text-[var(--accent)] animate-spin" />
                <div>
                  <p className="text-sm text-[var(--accent)] font-semibold">{STEP_LABELS[step]}</p>
                  <div className="flex gap-2 mt-2">
                    {(['uploading-image', 'uploading-metadata', 'minting'] as MintStep[]).map((s, i) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          step === s
                            ? 'bg-[var(--accent)] animate-pulse'
                            : ['uploading-image', 'uploading-metadata', 'minting'].indexOf(step) > i
                              ? 'bg-[var(--color-electric-lime)]'
                              : 'bg-[var(--border-color)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {step === 'error' && error && (
          <div className="mb-6 p-4 bg-[var(--color-crimson)]/10 border border-[var(--color-crimson)]/30">
            <p className="text-sm text-[var(--color-crimson)]">{error}</p>
            <Button size="sm" variant="secondary" onClick={reset} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

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
                  {!isMinting && (
                    <button
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-black/60 text-white hover:text-[var(--color-crimson)] transition-colors cursor-pointer"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square w-full bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent)] transition-colors cursor-pointer group">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <ImagePlus
                    size={40}
                    className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors mb-3"
                  />
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
              disabled={isMinting}
            />

            <div>
              <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Description
              </label>
              <textarea
                placeholder="Describe your NFT..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={isMinting}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 px-4 py-3 text-sm font-[family-name:var(--font-body)] transition-all duration-300 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_10px_var(--accent-glow)] resize-none disabled:opacity-50"
              />
            </div>

            <div className="flex gap-4 w-full">
              <div className="flex-1">
                <Input
                  label="Symbol"
                  placeholder="e.g., CYBER"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  disabled={isMinting}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Royalty %"
                  type="number"
                  placeholder="5"
                  value={formData.royalty}
                  onChange={(e) => setFormData({ ...formData, royalty: e.target.value })}
                  disabled={isMinting}
                />
              </div>
            </div>

            <Input
              label="Collection (Optional)"
              placeholder="e.g., Cyber Sentinels"
              value={formData.collection}
              onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
              disabled={isMinting}
            />

            {/* Attributes Builder */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                  Attributes
                </label>
                <button
                  onClick={addAttribute}
                  disabled={isMinting}
                  className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {attributes.map((attr, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="Trait"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(i, 'trait_type', e.target.value)}
                      disabled={isMinting}
                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 px-3 py-2 text-xs font-[family-name:var(--font-body)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
                    />
                    <input
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) => updateAttribute(i, 'value', e.target.value)}
                      disabled={isMinting}
                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 px-3 py-2 text-xs font-[family-name:var(--font-body)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
                    />
                    <button
                      onClick={() => removeAttribute(i)}
                      disabled={isMinting || attributes.length <= 1}
                      className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--color-crimson)] transition-colors cursor-pointer disabled:opacity-30"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 w-full">
              <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] mb-3">
                Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Network</span>
                  <span className="font-[family-name:var(--font-mono)]">
                    {network === 'devnet' ? 'Solana Devnet' : 'Solana Mainnet'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Mint Fee</span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--accent)]">◎ ~0.01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Royalty</span>
                  <span className="font-[family-name:var(--font-mono)]">{formData.royalty || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Attributes</span>
                  <span className="font-[family-name:var(--font-mono)]">
                    {attributes.filter((a) => a.trait_type).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Storage</span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--accent)]">IPFS (Pinata)</span>
                </div>
              </div>
            </div>

            {connected ? (
              <Button
                size="lg"
                className="w-full"
                onClick={handleMint}
                loading={isMinting}
                disabled={!preview || !formData.name || isMinting}
              >
                <Zap size={16} />
                {isMinting ? STEP_LABELS[step] : 'MINT NFT'}
              </Button>
            ) : (
              <div className="text-center py-6 border border-[var(--border-color)] bg-[var(--bg-secondary)] w-full">
                <Upload size={24} className="mx-auto text-[var(--text-secondary)] mb-2" />
                <p className="text-sm text-[var(--text-secondary)]">Connect your wallet to mint</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
