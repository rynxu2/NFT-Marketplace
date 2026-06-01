import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { getConnection, solToLamports } from './connection';
import type { WalletContextState } from '@solana/wallet-adapter-react';

interface BuyCollectionSolanaParams {
  wallet: WalletContextState;
  sellerAddress: string;
  totalPrice: number;
}

export async function buyCollectionSolana({
  wallet,
  sellerAddress,
  totalPrice,
}: BuyCollectionSolanaParams): Promise<{ txSignature: string }> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const connection = getConnection();
  const buyer = wallet.publicKey;
  const seller = new PublicKey(sellerAddress);

  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: buyer,
      toPubkey: seller,
      lamports: solToLamports(totalPrice),
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = buyer;

  const signed = await wallet.signTransaction(transaction);
  const txSignature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(txSignature, 'confirmed');

  return { txSignature };
}

export async function signCollectionSale({
  wallet,
  collectionName,
  price,
}: {
  wallet: WalletContextState;
  collectionName: string;
  price: number;
}): Promise<string> {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected');
  }

  const message = new TextEncoder().encode(
    `NEXUS: List collection "${collectionName}" for ${price} SOL`
  );
  await wallet.signMessage(message);

  return `collection_list_${Date.now()}`;
}
