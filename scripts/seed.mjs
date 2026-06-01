/**
 * NEXUS NFT Marketplace — Seed Script
 * 
 * Deletes all existing data and seeds with a realistic demo dataset.
 * Run: node scripts/seed.mjs
 * 
 * Requires: NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
  const envPath = resolve(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
} catch {
  console.error('❌ Could not load .env.local');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Wallet Addresses ──────────────────────────────────────
const WALLETS = {
  alice:   '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  bob:     '5FHwkrdxDhPNKvMGxfCPK8TjLkN9JfEJPxBc3fVyBBAE',
  charlie: '3KbJKFrzGYhGnSKsFT5TjsRMHkFfAqtR3oCT7WVE9Ng8',
  diana:   '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  eve:     'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
};

// ─── Utility ───────────────────────────────────────────────
function randomId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function randomMint() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 44; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 30) + '-' + randomId().slice(0, 4);
}

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function hoursFromNow(n) {
  return new Date(Date.now() + n * 3600000).toISOString();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Image URLs (Picsum for demo) ──────────────────────────
function nftImage(id) {
  return `https://picsum.photos/seed/nft${id}/600/600`;
}
function bannerImage(id) {
  return `https://picsum.photos/seed/banner${id}/1200/400`;
}
function logoImage(id) {
  return `https://picsum.photos/seed/logo${id}/200/200`;
}

// ─── STEP 1: Clear All Data ────────────────────────────────
async function clearAll() {
  console.log('🗑️  Clearing all data...');

  // First nullify FK references from nfts → collections
  await supabase.from('nfts').update({ collection_id: null }).neq('mint', '');

  // Order matters due to FK constraints
  const tables = ['bids', 'auctions', 'offers', 'favorites', 'listings', 'activities', 'nfts', 'collections'];
  
  for (const table of tables) {
    // Try multiple delete strategies
    let cleared = false;
    
    // Strategy 1: delete by created_at range
    const { error: e1 } = await supabase.from(table).delete().gte('created_at', '1970-01-01');
    if (!e1) { cleared = true; }
    
    if (!cleared) {
      // Strategy 2: delete by id not matching impossible UUID
      const { error: e2 } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!e2) cleared = true;
    }

    if (!cleared) {
      // Strategy 3: for tables with text PK (nfts uses 'mint')
      const { error: e3 } = await supabase.from(table).delete().neq('mint', '');
      if (!e3) cleared = true;
    }

    console.log(cleared ? `  ✅ Cleared ${table}` : `  ⚠️  Could not clear ${table}`);
  }
}

// ─── STEP 2: Seed Collections ──────────────────────────────
async function seedCollections() {
  console.log('\n📁 Seeding collections...');

  const collections = [
    {
      name: 'Cyber Punks Genesis',
      slug: slugify('Cyber Punks Genesis'),
      description: 'The original cyberpunk-inspired generative art collection. 50 unique characters living in the neon-lit streets of Neo Tokyo.',
      logo: logoImage(1),
      banner: bannerImage(1),
      owner: WALLETS.alice,
      category: 'generative',
      theme_color: '#00f0ff',
      social_links: { twitter: 'cyberpunks_nft', discord: 'https://discord.gg/cyberpunks', website: 'https://cyberpunks.xyz' },
      is_verified: true,
      chain: 'solana',
    },
    {
      name: 'Pixel Kingdoms',
      slug: slugify('Pixel Kingdoms'),
      description: 'A pixel art collection featuring legendary kingdoms, warriors, and mythical creatures from a retro fantasy universe.',
      logo: logoImage(2),
      banner: bannerImage(2),
      owner: WALLETS.bob,
      category: 'gaming',
      theme_color: '#ff6b35',
      social_links: { twitter: 'pixelkingdoms', discord: 'https://discord.gg/pixelkingdoms' },
      is_verified: true,
      chain: 'solana',
    },
    {
      name: 'Abstract Dimensions',
      slug: slugify('Abstract Dimensions'),
      description: 'Exploring the boundaries of color, form, and space through algorithmic abstract art. Each piece is a unique mathematical journey.',
      logo: logoImage(3),
      banner: bannerImage(3),
      owner: WALLETS.charlie,
      category: 'art',
      theme_color: '#e040fb',
      social_links: { twitter: 'abstractdim', website: 'https://abstractdimensions.art' },
      is_verified: false,
      chain: 'solana',
    },
    {
      name: 'Polygon Beats',
      slug: slugify('Polygon Beats'),
      description: 'Music-inspired visual NFTs on Polygon. Each piece represents a unique sound frequency visualization.',
      logo: logoImage(4),
      banner: bannerImage(4),
      owner: WALLETS.diana,
      category: 'music',
      theme_color: '#a3ff12',
      social_links: { twitter: 'polygonbeats', discord: 'https://discord.gg/polybeats' },
      is_verified: true,
      chain: 'polygon',
    },
    {
      name: 'Nature Lens',
      slug: slugify('Nature Lens'),
      description: 'Breathtaking nature photography captured from around the world and preserved forever on-chain.',
      logo: logoImage(5),
      banner: bannerImage(5),
      owner: WALLETS.eve,
      category: 'photography',
      theme_color: '#4caf50',
      social_links: { website: 'https://naturelens.photo' },
      is_verified: false,
      chain: 'polygon',
    },
    {
      name: 'Mech Warriors',
      slug: slugify('Mech Warriors'),
      description: 'Battle-ready mech suits from the year 3025. Collect, trade, and prepare for the arena. Each mech has unique stats and abilities.',
      logo: logoImage(6),
      banner: bannerImage(6),
      owner: WALLETS.alice,
      category: 'gaming',
      theme_color: '#ff1744',
      social_links: { twitter: 'mechwarriors_nft', discord: 'https://discord.gg/mechwarriors' },
      is_verified: true,
      chain: 'solana',
      for_sale: true,
      sale_price: 25.5,
      sale_currency: 'SOL',
      sale_listed_at: daysAgo(2),
    },
  ];

  const { data, error } = await supabase.from('collections').insert(collections).select();
  if (error) {
    console.error('  ❌ Failed:', error.message);
    return [];
  }
  console.log(`  ✅ Created ${data.length} collections`);
  return data;
}

// ─── STEP 3: Seed NFTs ─────────────────────────────────────
async function seedNFTs(collections) {
  console.log('\n🖼️  Seeding NFTs...');

  const nftTemplates = [
    // Cyber Punks Genesis (collection[0]) — 8 NFTs
    { colIdx: 0, name: 'Neon Samurai #001', desc: 'A lone warrior patrolling the neon-lit alleyways of Neo Tokyo.', attrs: [{ trait_type: 'Background', value: 'Neon Alley' }, { trait_type: 'Weapon', value: 'Plasma Katana' }, { trait_type: 'Rarity', value: 'Legendary' }], owner: 'alice', listed: true, price: 2.5 },
    { colIdx: 0, name: 'Chrome Hacker #012', desc: 'Elite hacker with chrome implants and neural interface.', attrs: [{ trait_type: 'Background', value: 'Server Room' }, { trait_type: 'Class', value: 'Hacker' }, { trait_type: 'Rarity', value: 'Rare' }], owner: 'bob', listed: true, price: 1.8 },
    { colIdx: 0, name: 'Street Runner #007', desc: 'Fast courier navigating through the cybercity underground.', attrs: [{ trait_type: 'Background', value: 'Underground' }, { trait_type: 'Speed', value: '95' }, { trait_type: 'Rarity', value: 'Common' }], owner: 'charlie', listed: false, price: null },
    { colIdx: 0, name: 'Ghost Protocol #033', desc: 'Invisible operative specializing in stealth operations.', attrs: [{ trait_type: 'Background', value: 'Rooftop' }, { trait_type: 'Stealth', value: '100' }, { trait_type: 'Rarity', value: 'Epic' }], owner: 'alice', listed: true, price: 5.2 },
    { colIdx: 0, name: 'Data Witch #019', desc: 'Master of digital sorcery and data manipulation.', attrs: [{ trait_type: 'Background', value: 'Data Stream' }, { trait_type: 'Element', value: 'Digital' }, { trait_type: 'Rarity', value: 'Rare' }], owner: 'diana', listed: false, price: null },
    { colIdx: 0, name: 'Iron Monk #045', desc: 'Cybernetically enhanced monk from the Temple of Steel.', attrs: [{ trait_type: 'Background', value: 'Temple' }, { trait_type: 'Defense', value: '88' }, { trait_type: 'Rarity', value: 'Uncommon' }], owner: 'eve', listed: true, price: 1.2 },
    { colIdx: 0, name: 'Venom Dealer #028', desc: 'Shady dealer operating in the darkest corners of the city.', attrs: [{ trait_type: 'Background', value: 'Black Market' }, { trait_type: 'Trade', value: '92' }, { trait_type: 'Rarity', value: 'Common' }], owner: 'bob', listed: false, price: null },
    { colIdx: 0, name: 'Sky Racer #050', desc: 'Champion hover-bike racer with a death wish.', attrs: [{ trait_type: 'Background', value: 'Sky Highway' }, { trait_type: 'Speed', value: '99' }, { trait_type: 'Rarity', value: 'Legendary' }], owner: 'alice', listed: true, price: 8.0 },

    // Pixel Kingdoms (collection[1]) — 6 NFTs
    { colIdx: 1, name: 'Dragon Lord', desc: 'Supreme ruler of the Fire Realm, commands all dragons.', attrs: [{ trait_type: 'Kingdom', value: 'Fire Realm' }, { trait_type: 'Power', value: '100' }, { trait_type: 'Rarity', value: 'Legendary' }], owner: 'bob', listed: true, price: 4.0 },
    { colIdx: 1, name: 'Forest Guardian', desc: 'Ancient protector of the Emerald Woods.', attrs: [{ trait_type: 'Kingdom', value: 'Emerald Woods' }, { trait_type: 'Defense', value: '85' }, { trait_type: 'Rarity', value: 'Epic' }], owner: 'alice', listed: true, price: 2.2 },
    { colIdx: 1, name: 'Shadow Assassin', desc: 'Silent killer from the Void Kingdom.', attrs: [{ trait_type: 'Kingdom', value: 'Void Kingdom' }, { trait_type: 'Stealth', value: '97' }, { trait_type: 'Rarity', value: 'Rare' }], owner: 'charlie', listed: false, price: null },
    { colIdx: 1, name: 'Ice Queen', desc: 'Ruler of the frozen north, commands blizzards.', attrs: [{ trait_type: 'Kingdom', value: 'Frozen North' }, { trait_type: 'Magic', value: '90' }, { trait_type: 'Rarity', value: 'Epic' }], owner: 'diana', listed: true, price: 3.5 },
    { colIdx: 1, name: 'Thunder Knight', desc: 'Lightning-wielding warrior of the Storm Citadel.', attrs: [{ trait_type: 'Kingdom', value: 'Storm Citadel' }, { trait_type: 'Attack', value: '93' }, { trait_type: 'Rarity', value: 'Rare' }], owner: 'bob', listed: false, price: null },
    { colIdx: 1, name: 'Bone Archer', desc: 'Undead marksman from the Necro Wastes.', attrs: [{ trait_type: 'Kingdom', value: 'Necro Wastes' }, { trait_type: 'Range', value: '88' }, { trait_type: 'Rarity', value: 'Common' }], owner: 'eve', listed: true, price: 0.8 },

    // Abstract Dimensions (collection[2]) — 5 NFTs
    { colIdx: 2, name: 'Fractal Dream #01', desc: 'An infinite fractal spiral rendered in vivid cyan and magenta.', attrs: [{ trait_type: 'Style', value: 'Fractal' }, { trait_type: 'Palette', value: 'Cyan-Magenta' }, { trait_type: 'Complexity', value: 'High' }], owner: 'charlie', listed: true, price: 1.5 },
    { colIdx: 2, name: 'Waveform Alpha', desc: 'Sound waves frozen in geometric space.', attrs: [{ trait_type: 'Style', value: 'Geometric' }, { trait_type: 'Palette', value: 'Monochrome' }, { trait_type: 'Complexity', value: 'Medium' }], owner: 'alice', listed: false, price: null },
    { colIdx: 2, name: 'Nebula Core', desc: 'The heart of a dying star captured in algorithmic beauty.', attrs: [{ trait_type: 'Style', value: 'Cosmic' }, { trait_type: 'Palette', value: 'Warm' }, { trait_type: 'Complexity', value: 'Very High' }], owner: 'charlie', listed: true, price: 3.0 },
    { colIdx: 2, name: 'Grid Collapse', desc: 'A structured grid dissolving into chaos.', attrs: [{ trait_type: 'Style', value: 'Glitch' }, { trait_type: 'Palette', value: 'Neon' }, { trait_type: 'Complexity', value: 'Medium' }], owner: 'bob', listed: false, price: null },
    { colIdx: 2, name: 'Entropy Field', desc: 'Randomness visualized as a flowing color field.', attrs: [{ trait_type: 'Style', value: 'Flow' }, { trait_type: 'Palette', value: 'Rainbow' }, { trait_type: 'Complexity', value: 'Low' }], owner: 'diana', listed: true, price: 0.9 },

    // Polygon Beats (collection[3]) — 5 NFTs (polygon chain)
    { colIdx: 3, name: 'Bass Drop Visualizer', desc: '808 bass frequencies transformed into visual explosions.', attrs: [{ trait_type: 'Genre', value: 'EDM' }, { trait_type: 'BPM', value: '140' }, { trait_type: 'Rarity', value: 'Rare' }], owner: 'diana', listed: true, price: 0.5 },
    { colIdx: 3, name: 'Synthwave Sunset', desc: 'Retro synthwave aesthetics meets modern visualization.', attrs: [{ trait_type: 'Genre', value: 'Synthwave' }, { trait_type: 'BPM', value: '110' }, { trait_type: 'Rarity', value: 'Epic' }], owner: 'alice', listed: true, price: 1.2 },
    { colIdx: 3, name: 'Drum & Bass Spiral', desc: 'High-energy drum patterns spiraling into infinity.', attrs: [{ trait_type: 'Genre', value: 'DnB' }, { trait_type: 'BPM', value: '174' }, { trait_type: 'Rarity', value: 'Common' }], owner: 'bob', listed: false, price: null },
    { colIdx: 3, name: 'Lo-Fi Rain', desc: 'Chill lo-fi beats visualized as gentle rain patterns.', attrs: [{ trait_type: 'Genre', value: 'Lo-Fi' }, { trait_type: 'BPM', value: '85' }, { trait_type: 'Rarity', value: 'Uncommon' }], owner: 'charlie', listed: true, price: 0.3 },
    { colIdx: 3, name: 'Techno Grid', desc: 'Minimalist techno rhythms on a pulsating grid.', attrs: [{ trait_type: 'Genre', value: 'Techno' }, { trait_type: 'BPM', value: '130' }, { trait_type: 'Rarity', value: 'Rare' }], owner: 'diana', listed: false, price: null },

    // Nature Lens (collection[4]) — 4 NFTs (polygon chain)
    { colIdx: 4, name: 'Aurora Borealis', desc: 'Northern lights dancing over a frozen Icelandic landscape.', attrs: [{ trait_type: 'Location', value: 'Iceland' }, { trait_type: 'Season', value: 'Winter' }, { trait_type: 'Rarity', value: 'Legendary' }], owner: 'eve', listed: true, price: 2.0 },
    { colIdx: 4, name: 'Sakura Valley', desc: 'Cherry blossoms in full bloom in a hidden Japanese valley.', attrs: [{ trait_type: 'Location', value: 'Japan' }, { trait_type: 'Season', value: 'Spring' }, { trait_type: 'Rarity', value: 'Epic' }], owner: 'alice', listed: true, price: 1.5 },
    { colIdx: 4, name: 'Desert Storm', desc: 'A massive sandstorm approaching the Saharan dunes at golden hour.', attrs: [{ trait_type: 'Location', value: 'Sahara' }, { trait_type: 'Season', value: 'Summer' }, { trait_type: 'Rarity', value: 'Rare' }], owner: 'bob', listed: false, price: null },
    { colIdx: 4, name: 'Rainforest Canopy', desc: 'Looking up through layers of green in the Amazon rainforest.', attrs: [{ trait_type: 'Location', value: 'Amazon' }, { trait_type: 'Season', value: 'Rainy' }, { trait_type: 'Rarity', value: 'Common' }], owner: 'eve', listed: true, price: 0.6 },

    // Mech Warriors (collection[5]) — 5 NFTs
    { colIdx: 5, name: 'Titan MK-VII', desc: 'Heavy assault mech with dual plasma cannons. Arena champion x3.', attrs: [{ trait_type: 'Class', value: 'Heavy' }, { trait_type: 'Weapon', value: 'Plasma Cannon' }, { trait_type: 'Wins', value: '47' }], owner: 'alice', listed: true, price: 6.0 },
    { colIdx: 5, name: 'Phantom Scout', desc: 'Lightweight recon mech with cloaking tech.', attrs: [{ trait_type: 'Class', value: 'Scout' }, { trait_type: 'Weapon', value: 'Laser Rifle' }, { trait_type: 'Speed', value: '98' }], owner: 'alice', listed: false, price: null },
    { colIdx: 5, name: 'Iron Bastion', desc: 'Defensive fortress mech with impenetrable shields.', attrs: [{ trait_type: 'Class', value: 'Tank' }, { trait_type: 'Weapon', value: 'Shield Wall' }, { trait_type: 'Defense', value: '100' }], owner: 'alice', listed: true, price: 4.5 },
    { colIdx: 5, name: 'Viper Strike', desc: 'Fast attack mech specializing in hit-and-run tactics.', attrs: [{ trait_type: 'Class', value: 'Striker' }, { trait_type: 'Weapon', value: 'Missile Pod' }, { trait_type: 'Speed', value: '92' }], owner: 'alice', listed: false, price: null },
    { colIdx: 5, name: 'Storm Breaker', desc: 'EMP specialist mech that disables enemies from afar.', attrs: [{ trait_type: 'Class', value: 'Support' }, { trait_type: 'Weapon', value: 'EMP Cannon' }, { trait_type: 'Range', value: '95' }], owner: 'alice', listed: true, price: 3.8 },
  ];

  const nfts = nftTemplates.map((t, i) => {
    const col = collections[t.colIdx];
    const chain = col.chain;
    return {
      mint: randomMint(),
      name: t.name,
      symbol: 'NEXUS',
      description: t.desc,
      image: nftImage(i + 1),
      owner: WALLETS[t.owner],
      creator: col.owner,
      collection: col.name,
      collection_slug: col.slug,
      collection_id: col.id,
      attributes: t.attrs,
      listed: t.listed,
      price: t.price,
      chain,
      token_id: chain === 'polygon' ? String(i) : null,
      created_at: daysAgo(Math.floor(Math.random() * 30) + 1),
    };
  });

  const { data, error } = await supabase.from('nfts').insert(nfts).select();
  if (error) {
    console.error('  ❌ Failed:', error.message);
    return [];
  }
  console.log(`  ✅ Created ${data.length} NFTs`);
  return data;
}

// ─── STEP 4: Seed Listings ─────────────────────────────────
async function seedListings(nfts) {
  console.log('\n📋 Seeding listings...');

  const listedNfts = nfts.filter(n => n.listed && n.price);
  const listings = listedNfts.map(nft => ({
    mint: nft.mint,
    seller: nft.owner,
    price: nft.price,
    active: true,
    chain: nft.chain,
    listed_at: daysAgo(Math.floor(Math.random() * 14)),
  }));

  const { data, error } = await supabase.from('listings').insert(listings).select();
  if (error) {
    console.error('  ❌ Failed:', error.message);
    return [];
  }
  console.log(`  ✅ Created ${data.length} listings`);
  return data;
}

// ─── STEP 5: Seed Auctions ─────────────────────────────────
async function seedAuctions(nfts) {
  console.log('\n🔨 Seeding auctions...');

  // Pick 3 unlisted NFTs for auctions
  const unlisted = nfts.filter(n => !n.listed);
  const auctionNfts = unlisted.slice(0, 3);

  const auctions = auctionNfts.map((nft, i) => ({
    nft_mint: nft.mint,
    seller: nft.owner,
    starting_price: [1.0, 0.5, 2.0][i],
    current_bid: [1.5, 0.5, 3.0][i],
    highest_bidder: [WALLETS.bob, null, WALLETS.eve][i] || null,
    min_bid_increment: 0.5,
    start_time: daysAgo(2),
    end_time: hoursFromNow([24, 48, 6][i]),
    status: 'active',
    chain: nft.chain,
  }));

  const { data, error } = await supabase.from('auctions').insert(auctions).select();
  if (error) {
    console.error('  ❌ Failed:', error.message);
    return [];
  }
  console.log(`  ✅ Created ${data.length} auctions`);

  // Add bids for auctions that have current_bid
  const bidsToInsert = [];
  for (const auction of data) {
    if (auction.highest_bidder) {
      bidsToInsert.push({
        auction_id: auction.id,
        bidder: auction.highest_bidder,
        amount: auction.current_bid,
        created_at: daysAgo(1),
      });
    }
  }

  if (bidsToInsert.length > 0) {
    const { error: bidError } = await supabase.from('bids').insert(bidsToInsert);
    if (bidError) console.warn('  ⚠️  Bids:', bidError.message);
    else console.log(`  ✅ Created ${bidsToInsert.length} bids`);
  }

  return data;
}

// ─── STEP 6: Seed Activities ───────────────────────────────
async function seedActivities(nfts, collections) {
  console.log('\n📊 Seeding activities...');

  const activities = [];

  // Mint activities for all NFTs
  for (const nft of nfts) {
    activities.push({
      type: 'mint',
      nft_mint: nft.mint,
      nft_name: nft.name,
      nft_image: nft.image,
      from_address: nft.creator,
      to_address: nft.owner,
      collection: nft.collection,
      chain: nft.chain,
      created_at: nft.created_at,
    });
  }

  // Sale activities for some NFTs
  const saleNfts = nfts.filter(n => n.owner !== n.creator).slice(0, 5);
  for (const nft of saleNfts) {
    activities.push({
      type: 'sale',
      nft_mint: nft.mint,
      nft_name: nft.name,
      nft_image: nft.image,
      from_address: nft.creator,
      to_address: nft.owner,
      price: (Math.random() * 3 + 0.5).toFixed(2) * 1,
      collection: nft.collection,
      chain: nft.chain,
      created_at: daysAgo(Math.floor(Math.random() * 10) + 1),
    });
  }

  // List activities
  const listedNfts = nfts.filter(n => n.listed);
  for (const nft of listedNfts) {
    activities.push({
      type: 'list',
      nft_mint: nft.mint,
      nft_name: nft.name,
      nft_image: nft.image,
      from_address: nft.owner,
      price: nft.price,
      collection: nft.collection,
      chain: nft.chain,
      created_at: daysAgo(Math.floor(Math.random() * 7)),
    });
  }

  // Transfer activities
  activities.push({
    type: 'transfer',
    nft_mint: nfts[2].mint,
    nft_name: nfts[2].name,
    nft_image: nfts[2].image,
    from_address: WALLETS.alice,
    to_address: nfts[2].owner,
    collection: nfts[2].collection,
    chain: nfts[2].chain,
    created_at: daysAgo(5),
  });

  const { data, error } = await supabase.from('activities').insert(activities).select();
  if (error) {
    console.error('  ❌ Failed:', error.message);
    return;
  }
  console.log(`  ✅ Created ${data.length} activities`);
}

// ─── STEP 7: Seed Offers ───────────────────────────────────
async function seedOffers(nfts) {
  console.log('\n💰 Seeding offers...');

  const listedNfts = nfts.filter(n => n.listed && n.price);
  const offers = [];

  // Create offers on first 4 listed NFTs
  for (const nft of listedNfts.slice(0, 4)) {
    const bidders = Object.values(WALLETS).filter(w => w !== nft.owner);
    const bidder = pick(bidders);
    offers.push({
      nft_mint: nft.mint,
      bidder,
      amount: (nft.price * 0.8).toFixed(4) * 1,
      status: 'active',
      expires_at: hoursFromNow(168), // 7 days
      created_at: daysAgo(Math.floor(Math.random() * 3)),
    });
  }

  if (offers.length > 0) {
    const { data, error } = await supabase.from('offers').insert(offers).select();
    if (error) {
      console.error('  ❌ Failed:', error.message);
      return;
    }
    console.log(`  ✅ Created ${data.length} offers`);
  }
}

// ─── MAIN ──────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  NEXUS NFT Marketplace — Data Seeder');
  console.log('═══════════════════════════════════════════\n');

  await clearAll();
  const collections = await seedCollections();
  if (collections.length === 0) {
    console.error('\n❌ No collections created. Check Supabase connection.');
    process.exit(1);
  }

  const nfts = await seedNFTs(collections);
  if (nfts.length === 0) {
    console.error('\n❌ No NFTs created.');
    process.exit(1);
  }

  await seedListings(nfts);
  await seedAuctions(nfts);
  await seedActivities(nfts, collections);
  await seedOffers(nfts);

  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ SEEDING COMPLETE!');
  console.log('═══════════════════════════════════════════');
  console.log(`\n  📁 ${collections.length} Collections`);
  console.log(`  🖼️  ${nfts.length} NFTs`);
  console.log(`  📋 ${nfts.filter(n => n.listed).length} Listings`);
  console.log(`  🔨 3 Auctions`);
  console.log(`  📊 ${nfts.length + 5 + nfts.filter(n => n.listed).length + 1} Activities`);
  console.log(`  💰 4 Offers`);
  console.log(`\n  Wallets used:`);
  for (const [name, addr] of Object.entries(WALLETS)) {
    console.log(`    ${name.padEnd(8)} → ${addr.slice(0, 8)}...${addr.slice(-4)}`);
  }
  console.log('');
}

main().catch(console.error);
