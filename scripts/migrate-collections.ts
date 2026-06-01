/**
 * Migration Script: Migrate existing text-based collections to the new collections table.
 *
 * Usage: npx tsx scripts/migrate-collections.ts
 *
 * What this does:
 * 1. Query distinct collection + collection_slug pairs from nfts table
 * 2. For each, create a collections row (owner = first NFT creator)
 * 3. Update nfts.collection_id FK for all matching NFTs
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local (Next.js doesn't load it for standalone scripts)
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('SUPABASE_URL', SUPABASE_URL);
  console.log('SUPABASE_KEY', SUPABASE_KEY);
  console.error('Missing SUPABASE_URL or SUPABASE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface NFTRow {
  collection: string | null;
  collection_slug: string | null;
  creator: string;
  image: string;
  chain: string;
}

async function migrate() {
  console.log('=== Collection Migration Script ===\n');

  // Step 1: Get all distinct collections from NFTs
  const { data: nfts, error: nftsError } = await supabase
    .from('nfts')
    .select('collection, collection_slug, creator, image, chain')
    .not('collection', 'is', null);

  if (nftsError) {
    console.error('Failed to fetch NFTs:', nftsError.message);
    process.exit(1);
  }

  // Group by collection name
  const collectionMap = new Map<string, {
    name: string;
    slug: string;
    creator: string;
    image: string;
    chain: string;
    count: number;
  }>();

  for (const nft of (nfts as NFTRow[])) {
    if (!nft.collection) continue;

    const key = nft.collection.toLowerCase();
    if (!collectionMap.has(key)) {
      const slug = nft.collection_slug ||
        nft.collection.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 30);
      collectionMap.set(key, {
        name: nft.collection,
        slug,
        creator: nft.creator,
        image: nft.image,
        chain: nft.chain || 'solana',
        count: 1,
      });
    } else {
      collectionMap.get(key)!.count++;
    }
  }

  console.log(`Found ${collectionMap.size} unique collections from ${nfts?.length || 0} NFTs\n`);

  if (collectionMap.size === 0) {
    console.log('No collections to migrate. Done.');
    return;
  }

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const [, col] of collectionMap) {
    // Check if already migrated
    const { data: existing } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', col.slug)
      .maybeSingle();

    let collectionId: string;

    if (existing) {
      collectionId = existing.id;
      console.log(`  [SKIP] "${col.name}" already exists (${collectionId})`);
    } else {
      // Create collection
      const { data: inserted, error: insertErr } = await supabase
        .from('collections')
        .insert({
          name: col.name,
          slug: col.slug,
          owner: col.creator,
          logo: col.image,
          chain: col.chain,
          category: 'art',
          theme_color: '#00f0ff',
        })
        .select('id')
        .single();

      if (insertErr || !inserted) {
        console.error(`  [ERROR] Failed to create "${col.name}":`, insertErr?.message);
        errors++;
        continue;
      }

      collectionId = inserted.id;
      created++;
      console.log(`  [CREATED] "${col.name}" → ${collectionId} (${col.count} NFTs)`);
    }

    // Update NFTs with collection_id
    const { count, error: updateErr } = await supabase
      .from('nfts')
      .update({ collection_id: collectionId })
      .eq('collection', col.name)
      .is('collection_id', null);

    if (updateErr) {
      console.error(`  [ERROR] Failed to update NFTs for "${col.name}":`, updateErr.message);
      errors++;
    } else {
      updated += count || 0;
    }
  }

  console.log('\n=== Migration Complete ===');
  console.log(`  Collections created: ${created}`);
  console.log(`  NFTs updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
}

migrate().catch(console.error);
