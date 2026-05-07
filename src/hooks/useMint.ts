'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { apiUploadImage, apiUploadMetadata, apiCreateNFT, apiCreateActivity } from '@/lib/api';
import { mintNFT } from '@/lib/solana/mint';
import { useToastStore } from '@/store/useToastStore';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';
import type { NFT } from '@/types/nft';

export type MintStep = 'idle' | 'uploading-image' | 'uploading-metadata' | 'minting' | 'success' | 'error';

interface MintParams {
  file: File;
  name: string;
  symbol: string;
  description: string;
  royalty: number;
  collection?: string;
  attributes: { trait_type: string; value: string | number }[];
}

interface MintResult {
  mintAddress: string;
  txSignature: string;
  metadataUri: string;
  imageUri: string;
}

export function useMintNFT() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { addMintedNFT } = useMarketplaceStore();
  const [step, setStep] = useState<MintStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MintResult | null>(null);

  const mint = useCallback(
    async (params: MintParams): Promise<MintResult | null> => {
      if (!wallet.publicKey) {
        addToast('Please connect your wallet first', 'error');
        return null;
      }

      setError(null);
      setResult(null);

      try {
        // Step 1: Upload image to IPFS via server API
        setStep('uploading-image');
        addToast('Uploading image to IPFS...', 'info', undefined, 3000);

        const imageResult = await apiUploadImage(params.file);
        const imageUri = imageResult.url;

        // Step 2: Upload metadata to IPFS via server API
        setStep('uploading-metadata');

        const metadata = {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          image: imageUri,
          attributes: params.attributes,
          properties: {
            files: [{ uri: imageUri, type: params.file.type }],
            creators: [{ address: wallet.publicKey.toBase58(), share: 100 }],
          },
          ...(params.collection ? { collection: { name: params.collection } } : {}),
        };

        const metaResult = await apiUploadMetadata(metadata);
        const metadataUri = metaResult.url;

        // Step 3: Mint NFT on Solana
        setStep('minting');
        addToast('Minting NFT on Solana...', 'info', undefined, 3000);

        const mintResult = await mintNFT({
          wallet,
          name: params.name,
          symbol: params.symbol,
          metadataUri,
          royaltyBps: params.royalty * 100,
        });

        const finalResult: MintResult = {
          mintAddress: mintResult.mintAddress,
          txSignature: mintResult.txSignature,
          metadataUri,
          imageUri,
        };

        // Save to database via API
        const nft: NFT = {
          mint: mintResult.mintAddress,
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          image: imageUri,
          owner: wallet.publicKey.toBase58(),
          creator: wallet.publicKey.toBase58(),
          listed: false,
          collection: params.collection,
          attributes: params.attributes,
          createdAt: new Date().toISOString(),
        };

        // Save to Supabase
        await apiCreateNFT({
          mint: mintResult.mintAddress,
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          image: imageUri,
          owner: wallet.publicKey.toBase58(),
          creator: wallet.publicKey.toBase58(),
          collection: params.collection,
          attributes: params.attributes,
          metadata_uri: metadataUri,
          tx_signature: mintResult.txSignature,
        }).catch(() => {
          // Silently fail DB save — NFT is still minted on-chain
        });

        // Log activity
        await apiCreateActivity({
          type: 'mint',
          nft_mint: mintResult.mintAddress,
          nft_name: params.name,
          nft_image: imageUri,
          from_address: wallet.publicKey.toBase58(),
          to_address: wallet.publicKey.toBase58(),
          tx_signature: mintResult.txSignature,
          collection: params.collection,
        }).catch(() => {});

        // Also keep in local store for instant UI
        addMintedNFT(nft);

        setStep('success');
        setResult(finalResult);
        addToast(`Successfully minted "${params.name}"!`, 'success', mintResult.txSignature);

        return finalResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error during minting';
        setStep('error');
        setError(message);
        addToast(`Mint failed: ${message}`, 'error');
        return null;
      }
    },
    [wallet, addToast, addMintedNFT]
  );

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setResult(null);
  }, []);

  return { mint, step, error, result, reset };
}
