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
  attributes: { trait_type: string; value: string | number }[];
  metadata_uri?: string;
  tx_signature?: string;
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
}) {
  const query = new URLSearchParams();
  if (params?.owner) query.set('owner', params.owner);
  if (params?.creator) query.set('creator', params.creator);
  if (params?.collection) query.set('collection', params.collection);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));

  return request<{ data: unknown[] }>(`/api/nfts?${query.toString()}`);
}

// --- Listings ---

export interface APICreateListing {
  mint: string;
  seller: string;
  price: number;
  tx_signature?: string;
  nft_name: string;
  nft_image: string;
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
  duration_hours: number;
  min_bid_increment: number;
  nft_name: string;
  nft_image: string;
  tx_signature?: string;
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

export async function apiSettleAuction(auctionId: string, data: { seller: string }) {
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
