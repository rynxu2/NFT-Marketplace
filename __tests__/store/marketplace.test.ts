import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';
import type { NFT } from '@/types/nft';
import type { Auction, Bid } from '@/types/auction';

const mockNFT: NFT = {
  mint: 'mint-001',
  name: 'Test NFT',
  symbol: 'TEST',
  description: 'A test NFT',
  image: 'https://example.com/image.png',
  owner: 'owner-address',
  creator: 'creator-address',
  listed: false,
  attributes: [{ trait_type: 'Rarity', value: 'Common' }],
  createdAt: new Date().toISOString(),
  chain: 'solana',
};

const mockListing = {
  id: 'listing-1',
  mint: 'mint-001',
  seller: 'seller-address',
  price: 2.5,
  nft: mockNFT,
  listedAt: new Date().toISOString(),
  txSignature: 'tx-123',
};

const mockAuction: Auction = {
  id: 'auction-1',
  nft: mockNFT,
  seller: 'seller-address',
  startingPrice: 1.0,
  currentBid: 1.0,
  highestBidder: null,
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 86400000).toISOString(),
  status: 'active',
  bids: [],
  minBidIncrement: 0.5,
};

describe('useMarketplaceStore', () => {
  beforeEach(() => {
    useMarketplaceStore.setState({
      listings: [],
      auctions: [],
      activities: [],
      mintedNFTs: [],
    });
  });

  // --- Listings ---

  describe('listings', () => {
    it('addListing adds to front of list', () => {
      useMarketplaceStore.getState().addListing(mockListing);
      const { listings } = useMarketplaceStore.getState();
      expect(listings).toHaveLength(1);
      expect(listings[0].mint).toBe('mint-001');
    });

    it('addListing prepends new listings', () => {
      useMarketplaceStore.getState().addListing({ ...mockListing, id: 'l1', mint: 'mint-a' });
      useMarketplaceStore.getState().addListing({ ...mockListing, id: 'l2', mint: 'mint-b' });

      const { listings } = useMarketplaceStore.getState();
      expect(listings[0].mint).toBe('mint-b');
      expect(listings[1].mint).toBe('mint-a');
    });

    it('removeListing removes by mint address', () => {
      useMarketplaceStore.getState().addListing(mockListing);
      useMarketplaceStore.getState().removeListing('mint-001');
      expect(useMarketplaceStore.getState().listings).toHaveLength(0);
    });

    it('removeListing does nothing for non-existent mint', () => {
      useMarketplaceStore.getState().addListing(mockListing);
      useMarketplaceStore.getState().removeListing('non-existent');
      expect(useMarketplaceStore.getState().listings).toHaveLength(1);
    });
  });

  // --- Auctions ---

  describe('auctions', () => {
    it('addAuction adds auction to front', () => {
      useMarketplaceStore.getState().addAuction(mockAuction);
      const { auctions } = useMarketplaceStore.getState();
      expect(auctions).toHaveLength(1);
      expect(auctions[0].id).toBe('auction-1');
    });

    it('addBid updates auction with new bid', () => {
      useMarketplaceStore.getState().addAuction(mockAuction);

      const bid: Bid = {
        id: 'bid-1',
        auctionId: 'auction-1',
        bidder: 'bidder-address',
        amount: 1.5,
        timestamp: new Date().toISOString(),
      };

      useMarketplaceStore.getState().addBid('auction-1', bid);
      const { auctions } = useMarketplaceStore.getState();

      expect(auctions[0].currentBid).toBe(1.5);
      expect(auctions[0].highestBidder).toBe('bidder-address');
      expect(auctions[0].bids).toHaveLength(1);
      expect(auctions[0].bids[0].id).toBe('bid-1');
    });

    it('addBid does not affect other auctions', () => {
      const auction2: Auction = { ...mockAuction, id: 'auction-2' };
      useMarketplaceStore.getState().addAuction(mockAuction);
      useMarketplaceStore.getState().addAuction(auction2);

      const bid: Bid = {
        id: 'bid-x',
        auctionId: 'auction-1',
        bidder: 'bidder',
        amount: 2.0,
        timestamp: new Date().toISOString(),
      };

      useMarketplaceStore.getState().addBid('auction-1', bid);
      const { auctions } = useMarketplaceStore.getState();

      const a2 = auctions.find((a) => a.id === 'auction-2')!;
      expect(a2.currentBid).toBe(1.0);
      expect(a2.bids).toHaveLength(0);
    });

    it('settleAuction changes status to settled', () => {
      useMarketplaceStore.getState().addAuction(mockAuction);
      useMarketplaceStore.getState().settleAuction('auction-1');

      const { auctions } = useMarketplaceStore.getState();
      expect(auctions[0].status).toBe('settled');
    });
  });

  // --- Activities ---

  describe('activities', () => {
    it('addActivity adds to front', () => {
      useMarketplaceStore.getState().addActivity({
        id: 'act-1',
        type: 'mint',
        nftMint: 'mint-001',
        nftName: 'Test NFT',
        nftImage: 'https://example.com/img.png',
        from: 'creator',
        to: 'creator',
        timestamp: new Date().toISOString(),
      });

      const { activities } = useMarketplaceStore.getState();
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('mint');
    });
  });

  // --- Minted NFTs ---

  describe('mintedNFTs', () => {
    it('addMintedNFT adds to front', () => {
      useMarketplaceStore.getState().addMintedNFT(mockNFT);
      const { mintedNFTs } = useMarketplaceStore.getState();
      expect(mintedNFTs).toHaveLength(1);
      expect(mintedNFTs[0].name).toBe('Test NFT');
    });

    it('updateNFTOwner changes owner and unlists', () => {
      useMarketplaceStore.getState().addMintedNFT({ ...mockNFT, listed: true, price: 5 });
      useMarketplaceStore.getState().updateNFTOwner('mint-001', 'new-owner');

      const { mintedNFTs } = useMarketplaceStore.getState();
      expect(mintedNFTs[0].owner).toBe('new-owner');
      expect(mintedNFTs[0].listed).toBe(false);
      expect(mintedNFTs[0].price).toBeUndefined();
    });

    it('updateNFTOwner does not affect other NFTs', () => {
      useMarketplaceStore.getState().addMintedNFT(mockNFT);
      useMarketplaceStore.getState().addMintedNFT({ ...mockNFT, mint: 'mint-002', name: 'Other' });

      useMarketplaceStore.getState().updateNFTOwner('mint-001', 'new-owner');

      const { mintedNFTs } = useMarketplaceStore.getState();
      const other = mintedNFTs.find((n) => n.mint === 'mint-002')!;
      expect(other.owner).toBe('owner-address');
    });
  });
});
