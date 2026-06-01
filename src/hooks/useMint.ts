'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { apiUploadImage, apiUploadMetadata, apiCreateNFT, apiCreateActivity } from '@/lib/api';
import { mintNFT } from '@/lib/solana/mint';
import { mintNFTPolygon } from '@/lib/polygon/mint';
import { useToastStore } from '@/store/useToastStore';
import { useInvalidateQueries } from '@/hooks/useData';
import { useChainStore } from '@/store/useChainStore';
import { CHAIN_CONFIGS } from '@/types/chain';
import { getSolanaErrorDetails } from '@/lib/solana/connection';

export type MintStep = 'idle' | 'uploading-image' | 'uploading-metadata' | 'minting' | 'success' | 'error';

interface MintParams {
  file: File;
  name: string;
  symbol: string;
  description: string;
  royalty: number;
  collection?: string;
  collection_id?: string;
  attributes: { trait_type: string; value: string | number }[];
}

interface MintResult {
  mintAddress: string;
  txSignature: string;
  metadataUri: string;
  imageUri: string;
}

export function useMintNFT() {
  const solanaWallet = useWallet();
  const { address: evmAddress } = useAccount();
  const { activeChain } = useChainStore();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();
  const [step, setStep] = useState<MintStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MintResult | null>(null);

  const config = CHAIN_CONFIGS[activeChain];

  const mint = useCallback(
    async (params: MintParams): Promise<MintResult | null> => {
      // Chain-wallet compatibility validation
      if (activeChain === 'polygon') {
        if (!evmAddress) {
          addToast('Please connect an EVM wallet (MetaMask, Bitget) for Polygon', 'error');
          return null;
        }
      } else {
        if (!solanaWallet.publicKey || !solanaWallet.signTransaction) {
          addToast('Please connect a Solana wallet (Phantom, Bitget) for Solana', 'error');
          return null;
        }
      }

      const walletAddress = activeChain === 'polygon'
        ? evmAddress!
        : solanaWallet.publicKey!.toBase58();

      setError(null);
      setResult(null);

      try {
        // Step 1: Upload image
        setStep('uploading-image');
        addToast('Uploading image...', 'info', undefined, 3000);

        const imageResult = await apiUploadImage(params.file);
        const imageUri = imageResult.url;

        // Step 2: Upload metadata to IPFS
        setStep('uploading-metadata');

        const metadata = {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          image: imageUri,
          attributes: params.attributes,
          properties: {
            files: [{ uri: imageUri, type: params.file.type }],
            creators: [{ address: walletAddress, share: 100 }],
          },
          ...(params.collection ? { collection: { name: params.collection } } : {}),
        };

        const metaResult = await apiUploadMetadata(metadata);
        const metadataUri = metaResult.url;

        // Step 3: Mint on chain
        setStep('minting');
        addToast(`Minting NFT on ${config.name}...`, 'info', undefined, 3000);

        let mintAddress: string;
        let txSignature: string;
        let tokenId: string | undefined;
        let contractAddress: string | undefined;

        if (activeChain === 'polygon') {
          const polygonResult = await mintNFTPolygon({
            to: walletAddress,
            tokenURI: metadataUri,
          });
          mintAddress = `${polygonResult.contractAddress}_${polygonResult.tokenId}`;
          txSignature = polygonResult.txHash;
          tokenId = polygonResult.tokenId;
          contractAddress = polygonResult.contractAddress;
        } else {
          const solanaResult = await mintNFT({
            wallet: solanaWallet,
            name: params.name,
            symbol: params.symbol,
            metadataUri,
            royaltyBps: params.royalty * 100,
          });
          mintAddress = solanaResult.mintAddress;
          txSignature = solanaResult.txSignature;
        }

        const finalResult: MintResult = {
          mintAddress,
          txSignature,
          metadataUri,
          imageUri,
        };

        // Save to Supabase
        try {
          await apiCreateNFT({
            mint: mintAddress,
            name: params.name,
            symbol: params.symbol,
            description: params.description,
            image: imageUri,
            owner: walletAddress,
            creator: walletAddress,
            collection: params.collection,
            collection_id: params.collection_id,
            attributes: params.attributes,
            metadata_uri: metadataUri,
            tx_signature: txSignature,
            chain: activeChain,
            token_id: tokenId,
            contract_address: contractAddress,
          });
        } catch (dbErr) {
          console.error('Failed to save NFT to database:', dbErr);
          addToast('NFT minted on-chain but database sync failed', 'warning');
        }

        // Log activity
        try {
          await apiCreateActivity({
            type: 'mint',
            nft_mint: mintAddress,
            nft_name: params.name,
            nft_image: imageUri,
            from_address: walletAddress,
            to_address: walletAddress,
            tx_signature: txSignature,
            collection: params.collection,
            chain: activeChain,
          });
        } catch (dbErr) {
          console.error('Failed to log mint activity:', dbErr);
        }

        invalidateAll();

        setStep('success');
        setResult(finalResult);
        addToast(`Successfully minted "${params.name}" on ${config.name}!`, 'success', txSignature);

        return finalResult;
      } catch (err) {
        const message = getSolanaErrorDetails(err);
        setStep('error');
        setError(message);
        addToast(`Mint failed: ${message}`, 'error');
        return null;
      }
    },
    [solanaWallet, evmAddress, activeChain, config, addToast, invalidateAll]
  );

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setResult(null);
  }, []);

  return { mint, step, error, result, reset };
}
