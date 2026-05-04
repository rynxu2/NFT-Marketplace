import type { NFT } from '@/types/nft';
import type { Auction } from '@/types/auction';
import type { Collection } from '@/types/collection';
import type { Activity } from '@/types/activity';

const MOCK_IMAGES = [
  'https://picsum.photos/seed/nft1/600/600',
  'https://picsum.photos/seed/nft2/600/600',
  'https://picsum.photos/seed/nft3/600/600',
  'https://picsum.photos/seed/nft4/600/600',
  'https://picsum.photos/seed/nft5/600/600',
  'https://picsum.photos/seed/nft6/600/600',
  'https://picsum.photos/seed/nft7/600/600',
  'https://picsum.photos/seed/nft8/600/600',
  'https://picsum.photos/seed/nft9/600/600',
  'https://picsum.photos/seed/nft10/600/600',
  'https://picsum.photos/seed/nft11/600/600',
  'https://picsum.photos/seed/nft12/600/600',
];

const COLLECTION_IMAGES = [
  'https://picsum.photos/seed/col1/400/400',
  'https://picsum.photos/seed/col2/400/400',
  'https://picsum.photos/seed/col3/400/400',
  'https://picsum.photos/seed/col4/400/400',
];

const BANNER_IMAGES = [
  'https://picsum.photos/seed/banner1/1200/400',
  'https://picsum.photos/seed/banner2/1200/400',
  'https://picsum.photos/seed/banner3/1200/400',
  'https://picsum.photos/seed/banner4/1200/400',
];

const MOCK_ADDRESSES = [
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
  'DRpbCBMxVnDK7maPMoHxESSCFRn3LC6VKY9kZLSQqaGH',
  '3Katb1JRvEhGQSeeHA7UhFJqbCSmM44JVVwSS4vNnbUz',
  'HN7cABqLq46Es1jh92dQQisAi5YqBchW1mKWcLb1LxKp',
];

const NFT_NAMES = [
  'Cyber Sentinel #001', 'Neon Wraith #042', 'Digital Phantom #108',
  'Void Walker #337', 'Quantum Ghost #055', 'Neural Spike #221',
  'Chrome Specter #089', 'Data Demon #164', 'Pixel Ronin #073',
  'Binary Storm #019', 'Circuit Breaker #406', 'Synth Oracle #512',
];

const CATEGORIES = ['Art', 'Photography', 'Gaming', 'Music', 'Collectibles', 'Utility'];

export const mockNFTs: NFT[] = NFT_NAMES.map((name, i) => ({
  mint: `${MOCK_ADDRESSES[i % MOCK_ADDRESSES.length].slice(0, 20)}${i}`,
  name,
  symbol: 'CYBER',
  description: `A rare digital collectible from the Cyber Nexus universe. ${name} is a unique piece of art generated from the depths of the blockchain.`,
  image: MOCK_IMAGES[i],
  owner: MOCK_ADDRESSES[(i + 1) % MOCK_ADDRESSES.length],
  creator: MOCK_ADDRESSES[i % MOCK_ADDRESSES.length],
  price: Math.round((Math.random() * 50 + 0.5) * 100) / 100,
  listed: i % 3 !== 0,
  collection: ['Cyber Sentinels', 'Neon Wraiths', 'Digital Phantoms', 'Void Walkers'][i % 4],
  collectionSlug: ['cyber-sentinels', 'neon-wraiths', 'digital-phantoms', 'void-walkers'][i % 4],
  attributes: [
    { trait_type: 'Rarity', value: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][i % 5] },
    { trait_type: 'Power Level', value: Math.floor(Math.random() * 100) + 1 },
    { trait_type: 'Element', value: ['Fire', 'Water', 'Lightning', 'Shadow', 'Plasma'][i % 5] },
    { trait_type: 'Generation', value: `Gen ${(i % 3) + 1}` },
  ],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

export const mockCollections: Collection[] = [
  {
    slug: 'cyber-sentinels',
    name: 'Cyber Sentinels',
    description: 'Elite guardians of the digital frontier. Each Sentinel is a unique AI-generated warrior with distinct abilities and traits.',
    image: COLLECTION_IMAGES[0],
    banner: BANNER_IMAGES[0],
    creator: MOCK_ADDRESSES[0],
    verified: true,
    category: 'Art',
    stats: { floorPrice: 2.5, totalVolume: 1250, owners: 340, items: 500, listed: 45 },
  },
  {
    slug: 'neon-wraiths',
    name: 'Neon Wraiths',
    description: 'Ethereal beings that exist between the physical and digital realms. Wraiths shimmer with neon energy.',
    image: COLLECTION_IMAGES[1],
    banner: BANNER_IMAGES[1],
    creator: MOCK_ADDRESSES[1],
    verified: true,
    category: 'Art',
    stats: { floorPrice: 5.8, totalVolume: 3400, owners: 210, items: 300, listed: 28 },
  },
  {
    slug: 'digital-phantoms',
    name: 'Digital Phantoms',
    description: 'Mysterious entities born from corrupted data streams. No two Phantoms are alike.',
    image: COLLECTION_IMAGES[2],
    banner: BANNER_IMAGES[2],
    creator: MOCK_ADDRESSES[2],
    verified: false,
    category: 'Collectibles',
    stats: { floorPrice: 1.2, totalVolume: 640, owners: 180, items: 1000, listed: 120 },
  },
  {
    slug: 'void-walkers',
    name: 'Void Walkers',
    description: 'Travelers of the empty space between blockchains. Void Walkers carry ancient digital knowledge.',
    image: COLLECTION_IMAGES[3],
    banner: BANNER_IMAGES[3],
    creator: MOCK_ADDRESSES[3],
    verified: true,
    category: 'Gaming',
    stats: { floorPrice: 8.3, totalVolume: 5600, owners: 420, items: 250, listed: 15 },
  },
];

const futureDate = (hoursFromNow: number) =>
  new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();

const pastDate = (hoursAgo: number) =>
  new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

export const mockAuctions: Auction[] = [
  {
    id: 'auction-1',
    nft: mockNFTs[0],
    seller: MOCK_ADDRESSES[0],
    startingPrice: 5,
    currentBid: 12.5,
    highestBidder: MOCK_ADDRESSES[2],
    startTime: pastDate(24),
    endTime: futureDate(6),
    status: 'active',
    minBidIncrement: 0.5,
    bids: [
      { id: 'bid-1', auctionId: 'auction-1', bidder: MOCK_ADDRESSES[1], amount: 6, timestamp: pastDate(20) },
      { id: 'bid-2', auctionId: 'auction-1', bidder: MOCK_ADDRESSES[3], amount: 8.5, timestamp: pastDate(12) },
      { id: 'bid-3', auctionId: 'auction-1', bidder: MOCK_ADDRESSES[2], amount: 12.5, timestamp: pastDate(3) },
    ],
  },
  {
    id: 'auction-2',
    nft: mockNFTs[3],
    seller: MOCK_ADDRESSES[1],
    startingPrice: 10,
    currentBid: 22,
    highestBidder: MOCK_ADDRESSES[4],
    startTime: pastDate(48),
    endTime: futureDate(2),
    status: 'active',
    minBidIncrement: 1,
    bids: [
      { id: 'bid-4', auctionId: 'auction-2', bidder: MOCK_ADDRESSES[0], amount: 12, timestamp: pastDate(36) },
      { id: 'bid-5', auctionId: 'auction-2', bidder: MOCK_ADDRESSES[4], amount: 22, timestamp: pastDate(6) },
    ],
  },
  {
    id: 'auction-3',
    nft: mockNFTs[6],
    seller: MOCK_ADDRESSES[2],
    startingPrice: 3,
    currentBid: 3,
    highestBidder: null,
    startTime: pastDate(2),
    endTime: futureDate(22),
    status: 'active',
    minBidIncrement: 0.25,
    bids: [],
  },
];

export const mockActivities: Activity[] = [
  { id: 'act-1', type: 'sale', nftMint: mockNFTs[0].mint, nftName: mockNFTs[0].name, nftImage: mockNFTs[0].image, from: MOCK_ADDRESSES[0], to: MOCK_ADDRESSES[1], price: 12.5, timestamp: pastDate(1), collection: 'Cyber Sentinels' },
  { id: 'act-2', type: 'listing', nftMint: mockNFTs[1].mint, nftName: mockNFTs[1].name, nftImage: mockNFTs[1].image, from: MOCK_ADDRESSES[1], to: '', price: 8.2, timestamp: pastDate(2), collection: 'Neon Wraiths' },
  { id: 'act-3', type: 'bid', nftMint: mockNFTs[3].mint, nftName: mockNFTs[3].name, nftImage: mockNFTs[3].image, from: MOCK_ADDRESSES[4], to: '', price: 22, timestamp: pastDate(3), collection: 'Void Walkers' },
  { id: 'act-4', type: 'mint', nftMint: mockNFTs[5].mint, nftName: mockNFTs[5].name, nftImage: mockNFTs[5].image, from: MOCK_ADDRESSES[2], to: MOCK_ADDRESSES[2], timestamp: pastDate(5), collection: 'Neon Wraiths' },
  { id: 'act-5', type: 'transfer', nftMint: mockNFTs[7].mint, nftName: mockNFTs[7].name, nftImage: mockNFTs[7].image, from: MOCK_ADDRESSES[3], to: MOCK_ADDRESSES[0], timestamp: pastDate(8), collection: 'Digital Phantoms' },
  { id: 'act-6', type: 'auction_created', nftMint: mockNFTs[6].mint, nftName: mockNFTs[6].name, nftImage: mockNFTs[6].image, from: MOCK_ADDRESSES[2], to: '', price: 3, timestamp: pastDate(10), collection: 'Cyber Sentinels' },
  { id: 'act-7', type: 'sale', nftMint: mockNFTs[9].mint, nftName: mockNFTs[9].name, nftImage: mockNFTs[9].image, from: MOCK_ADDRESSES[4], to: MOCK_ADDRESSES[1], price: 5.5, timestamp: pastDate(15), collection: 'Digital Phantoms' },
  { id: 'act-8', type: 'cancel', nftMint: mockNFTs[2].mint, nftName: mockNFTs[2].name, nftImage: mockNFTs[2].image, from: MOCK_ADDRESSES[0], to: '', timestamp: pastDate(18), collection: 'Digital Phantoms' },
];

export { CATEGORIES, MOCK_ADDRESSES };
