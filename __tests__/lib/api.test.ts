import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  apiGetNFTs,
  apiCreateNFT,
  apiGetListings,
  apiCreateListing,
  apiCancelListing,
  apiPlaceBid,
  apiSettleAuction,
  apiGetActivities,
  apiUploadMetadata,
} from '@/lib/api';

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => data });
}
function mockFail(err: unknown, status = 400) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, statusText: 'Err', json: async () => err });
}

describe('API Client', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('throws on non-ok response', async () => {
    mockFail({ error: 'Not found' }, 404);
    await expect(apiGetNFTs()).rejects.toThrow('Not found');
  });

  it('apiGetNFTs builds query params', async () => {
    mockOk({ data: [] });
    await apiGetNFTs({ owner: 'a', limit: 10 });
    expect(mockFetch.mock.calls[0][0]).toContain('owner=a');
  });

  it('apiCreateNFT sends POST', async () => {
    mockOk({ data: {} });
    await apiCreateNFT({ mint: 'm', name: 'N', symbol: 'S', description: '', image: '', owner: 'o', creator: 'c', attributes: [] });
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('apiGetListings returns data', async () => {
    mockOk({ data: [{ id: 1 }] });
    const r = await apiGetListings();
    expect(r.data).toHaveLength(1);
  });

  it('apiCreateListing sends price', async () => {
    mockOk({ data: {} });
    await apiCreateListing({ mint: 'm', seller: 's', price: 2.5, nft_name: 'n', nft_image: 'i' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.price).toBe(2.5);
  });

  it('apiCancelListing sends DELETE', async () => {
    mockOk({ success: true });
    await apiCancelListing('mint-1');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('apiPlaceBid sends to correct URL', async () => {
    mockOk({ data: {} });
    await apiPlaceBid('auc-1', { bidder: 'b', amount: 5 });
    expect(mockFetch.mock.calls[0][0]).toContain('/api/auctions/auc-1/bid');
  });

  it('apiSettleAuction sends POST', async () => {
    mockOk({ success: true });
    await apiSettleAuction('auc-1', { seller: 's' });
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('apiGetActivities with filters', async () => {
    mockOk({ data: [] });
    await apiGetActivities({ limit: 20, type: 'sale' });
    expect(mockFetch.mock.calls[0][0]).toContain('type=sale');
  });

  it('apiUploadMetadata sends JSON', async () => {
    mockOk({ hash: 'abc', url: 'http://x' });
    const r = await apiUploadMetadata({ name: 'T' });
    expect(r.hash).toBe('abc');
  });
});
