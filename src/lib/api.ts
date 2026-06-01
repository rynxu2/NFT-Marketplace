const BASE = '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API Error: ${res.status}`);
  }

  return res.json();
}

/**
 * Create auth headers by signing a message with the connected wallet.
 * Used for write operations (POST, PATCH, DELETE).
 */
export async function createAuthHeaders(
  wallet: { publicKey: { toBase58(): string } | null; signMessage?(msg: Uint8Array): Promise<Uint8Array> },
  action: string
): Promise<Record<string, string>> {
  if (!wallet.publicKey || !wallet.signMessage) {
    return {};
  }

  try {
    const message = `NEXUS Auth: ${action} at ${Date.now()}`;
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await wallet.signMessage(messageBytes);

    // Import bs58 dynamically to avoid SSR issues
    const { default: bs58 } = await import('bs58');

    return {
      'x-wallet-address': wallet.publicKey.toBase58(),
      'x-wallet-signature': bs58.encode(signatureBytes),
      'x-wallet-message': message,
    };
  } catch {
    // If signing fails, proceed without auth (backward compatible)
    return {};
  }
}

// --- Upload ---

export async function apiUploadImage(file: File): Promise<{ hash: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Image upload failed');
  }

  return res.json();
}

export async function apiUploadMetadata(metadata: Record<string, unknown>): Promise<{ hash: string; url: string }> {
  return request('/api/upload/metadata', {
    method: 'POST',
    body: JSON.stringify(metadata),
  });
}

// --- NFTs ---

export interface APICreateNFT {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  owner: string;
  creator: string;
  collection?: string;
  collection_id?: string;
  attributes: { trait_type: string; value: string | number }[];
  metadata_uri?: string;
  tx_signature?: string;
  chain?: string;
  token_id?: string;
  contract_address?: string;
}

export async function apiCreateNFT(data: APICreateNFT) {
  return request('/api/nfts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGetNFTs(params?: {
  owner?: string;
  creator?: string;
  collection?: string;
  search?: string;
  limit?: number;
  chain?: string;
}) {
  const query = new URLSearchParams();
  if (params?.owner) query.set('owner', params.owner);
  if (params?.creator) query.set('creator', params.creator);
  if (params?.collection) query.set('collection', params.collection);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.chain) query.set('chain', params.chain);

  return request<{ data: unknown[] }>(`/api/nfts?${query.toString()}`);
}

export async function apiUpdateNFT(data: { mint: string; owner?: string; listed?: boolean; price?: number | null }) {
  return request('/api/nfts', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// --- Listings ---

export interface APICreateListing {
  mint: string;
  seller: string;
  price: number;
  tx_signature?: string;
  nft_name: string;
  nft_image: string;
  chain?: string;
}

export async function apiCreateListing(data: APICreateListing) {
  return request('/api/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGetListings() {
  return request<{ data: unknown[] }>('/api/listings');
}

export async function apiCancelListing(mint: string) {
  return request('/api/listings', {
    method: 'DELETE',
    body: JSON.stringify({ mint }),
  });
}

// --- Auctions ---

export interface APICreateAuction {
  nft_mint: string;
  seller: string;
  starting_price: number;
  duration_minutes: number;
  min_bid_increment: number;
  nft_name: string;
  nft_image: string;
  tx_signature?: string;
  chain?: string;
}

export async function apiCreateAuction(data: APICreateAuction) {
  return request('/api/auctions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGetAuctions() {
  return request<{ data: unknown[] }>('/api/auctions');
}

export async function apiPlaceBid(auctionId: string, data: { bidder: string; amount: number; tx_signature?: string }) {
  return request(`/api/auctions/${auctionId}/bid`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiSettleAuction(auctionId: string, data: { seller?: string; caller?: string }) {
  return request(`/api/auctions/${auctionId}/settle`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- Activities ---

export interface APICreateActivity {
  type: string;
  nft_mint?: string;
  nft_name?: string;
  nft_image?: string;
  from_address?: string;
  to_address?: string;
  price?: number;
  tx_signature?: string;
  collection?: string;
  chain?: string;
}

export async function apiCreateActivity(data: APICreateActivity) {
  return request('/api/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGetActivities(params?: { limit?: number; type?: string; nft_mint?: string }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.type) query.set('type', params.type);
  if (params?.nft_mint) query.set('nft_mint', params.nft_mint);

  return request<{ data: unknown[] }>(`/api/activities?${query.toString()}`);
}

// --- Collections ---

export interface APICreateCollection {
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  logo_ipfs?: string;
  banner_ipfs?: string;
  owner: string;
  category?: string;
  theme_color?: string;
  social_links?: Record<string, string>;
  chain?: string;
}

export async function apiCreateCollection(data: APICreateCollection) {
  return request<{ data: unknown }>('/api/collections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGetCollections(params?: {
  chain?: string;
  owner?: string;
  search?: string;
  category?: string;
}) {
  const query = new URLSearchParams();
  if (params?.chain) query.set('chain', params.chain);
  if (params?.owner) query.set('owner', params.owner);
  if (params?.search) query.set('search', params.search);
  if (params?.category) query.set('category', params.category);

  return request<{ data: unknown[] }>(`/api/collections?${query.toString()}`);
}

export async function apiGetCollection(idOrSlug: string) {
  return request<{ data: unknown }>(`/api/collections/${idOrSlug}`);
}

export async function apiUpdateCollection(id: string, updates: Record<string, unknown>) {
  return request<{ data: unknown }>(`/api/collections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteCollection(id: string) {
  return request<{ success: boolean }>(`/api/collections/${id}`, {
    method: 'DELETE',
  });
}

export async function apiAddNFTsToCollection(collectionId: string, mints: string[]) {
  return request<{ data: { added: number } }>(`/api/collections/${collectionId}/nfts`, {
    method: 'POST',
    body: JSON.stringify({ mints }),
  });
}

export async function apiRemoveNFTsFromCollection(collectionId: string, mints: string[]) {
  return request<{ data: { removed: number } }>(`/api/collections/${collectionId}/nfts`, {
    method: 'DELETE',
    body: JSON.stringify({ mints }),
  });
}

export async function apiTransferCollection(collectionId: string, newOwner: string) {
  return request<{ data: unknown }>(`/api/collections/${collectionId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ new_owner: newOwner }),
  });
}

// --- Collection Sale ---

export async function apiBuyCollection(collectionId: string, data: {
  buyer: string;
  tx_signature: string;
  chain: string;
  price: number;
}) {
  return request<{ data: unknown; transferred_nfts: number; deactivated_listings: number }>(
    `/api/collections/${collectionId}/buy`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function apiListCollectionForSale(collectionId: string, data: {
  for_sale: boolean;
  sale_price?: number;
  sale_currency?: string;
  sale_tx?: string;
  sale_listed_at?: string;
}) {
  return request<{ data: unknown }>(`/api/collections/${collectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
