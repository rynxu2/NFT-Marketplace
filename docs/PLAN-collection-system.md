# PLAN: Full Collection System

## Background

Currently, "collection" is just a free-text field (`collection TEXT`) on the `nfts` table. There is:
- ❌ No `collections` table
- ❌ No Create Collection page
- ❌ No collection management (edit, delete, transfer)
- ❌ No collection metadata (banner, logo, description, social links)
- ❌ No verified badge system
- ❌ No membership control (anyone can type any collection name)

Collections are derived at runtime by grouping NFTs with the same `collection_slug`. This is fragile and unscalable.

---

## User Requirements

| Requirement | Decision |
|-------------|----------|
| Who can create? | Any connected wallet user |
| NFT membership | Dual: Owner adds + Creator picks when minting |
| Metadata | Premium: name, description, banner, logo, social links, category, theme color, featured NFTs, verified badge |
| Storage | Hybrid: Off-chain (Supabase) with wallet ownership verification |
| Management | Full: CRUD, add/remove NFT, stats, transfer ownership, settings |

---

## Proposed Changes

### Phase 1: Database — `collections` Table

#### [NEW] `supabase/migrations/add_collections_table.sql`

```sql
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  logo TEXT,                       -- Cloudinary/IPFS URL
  banner TEXT,                     -- Cloudinary/IPFS URL
  owner TEXT NOT NULL,             -- wallet address (creator)
  category TEXT DEFAULT 'art',     -- art, gaming, music, photography, etc.
  theme_color TEXT DEFAULT '#00f0ff',
  social_links JSONB DEFAULT '{}', -- { twitter, discord, website }
  featured_nfts TEXT[] DEFAULT '{}', -- array of NFT mints
  is_verified BOOLEAN DEFAULT false,
  chain TEXT DEFAULT 'solana',
  settings JSONB DEFAULT '{}',     -- extensible config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_collections_owner ON collections(owner);
CREATE INDEX idx_collections_chain ON collections(chain);
```

#### [MODIFY] `nfts` table — Add FK reference

```sql
ALTER TABLE nfts ADD COLUMN collection_id UUID REFERENCES collections(id);
CREATE INDEX idx_nfts_collection_id ON nfts(collection_id);
```

> [!IMPORTANT]
> Keep existing `collection` and `collection_slug` text fields for backward compatibility during migration. New code uses `collection_id` FK.

---

### Phase 2: API Routes

#### [NEW] `src/app/api/collections/route.ts`

**GET** `/api/collections?chain=solana&owner=<addr>&search=<term>`
- List all collections, with aggregated stats (item count, floor price, volume)
- Join with `nfts` table for counts
- Filter by chain, owner, search

**POST** `/api/collections`
- Create new collection
- Body: `{ name, description, logo, banner, category, theme_color, social_links, chain }`
- Auto-generate `slug` from name
- Set `owner` from authenticated wallet
- Validate: no duplicate slug

#### [NEW] `src/app/api/collections/[id]/route.ts`

**GET** `/api/collections/:id`
- Get single collection by ID or slug
- Include aggregated stats + NFT list

**PATCH** `/api/collections/:id`
- Update collection metadata
- Only owner can update
- Body: partial `{ name, description, logo, banner, ... }`

**DELETE** `/api/collections/:id`
- Soft-delete or remove collection
- Only owner can delete
- Detach NFTs (set `collection_id = null`)

#### [NEW] `src/app/api/collections/[id]/nfts/route.ts`

**POST** `/api/collections/:id/nfts`
- Add NFT(s) to collection
- Body: `{ mints: string[] }`
- Auth: Only collection owner OR NFT owner can add
- Validate NFT exists & isn't already in another collection

**DELETE** `/api/collections/:id/nfts`
- Remove NFT(s) from collection
- Body: `{ mints: string[] }`
- Auth: Collection owner OR NFT owner

#### [NEW] `src/app/api/collections/[id]/transfer/route.ts`

**POST** `/api/collections/:id/transfer`
- Transfer ownership
- Body: `{ newOwner: string }`
- Auth: Current owner only

---

### Phase 3: Types & Hooks

#### [NEW] `src/types/collection.ts`

```typescript
import type { ChainId } from './chain';

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  banner: string | null;
  owner: string;
  category: CollectionCategory;
  themeColor: string;
  socialLinks: SocialLinks;
  featuredNfts: string[];
  isVerified: boolean;
  chain: ChainId;
  stats: CollectionStats;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionStats {
  items: number;
  owners: number;
  floorPrice: number;
  totalVolume: number;
  listed: number;
}

export interface SocialLinks {
  twitter?: string;
  discord?: string;
  website?: string;
}

export type CollectionCategory =
  | 'art'
  | 'gaming'
  | 'music'
  | 'photography'
  | 'generative'
  | 'collectibles'
  | 'utility'
  | 'other';
```

#### [NEW] `src/hooks/useCollections.ts`

- `useFetchCollections(params?)` — React Query hook
- `useFetchCollection(idOrSlug)` — single collection
- `useCreateCollection()` — mutation hook
- `useUpdateCollection()` — mutation hook
- `useCollectionNFTs(collectionId)` — add/remove NFTs
- `useTransferCollection()` — ownership transfer

#### [MODIFY] `src/hooks/useData.ts`

- Add `queryKeys.collections` 
- Add `collections` to `invalidateAll()`

#### [MODIFY] `src/hooks/useMint.ts`

- Replace free-text `collection` input with collection picker (select from user's collections OR create new)
- On mint, set `collection_id` FK on the new NFT

---

### Phase 4: Pages & UI

#### [NEW] `src/app/collections/create/page.tsx` — Create Collection Page

Form fields:
- Name (required)
- Description (textarea)
- Logo upload (image)
- Banner upload (image)  
- Category (dropdown)
- Theme color (color picker)
- Social links (twitter, discord, website)
- Chain selector

UI Style: Match existing Create NFT page aesthetic (cyber theme, motion animations)

#### [MODIFY] `src/app/collections/page.tsx` — Collections Listing

- Fetch from `/api/collections` instead of deriving from NFTs
- Add "Create Collection" CTA button
- Show verified badge
- Show proper logos/banners
- Keep grid/list view toggle

#### [MODIFY] `src/app/collection/[slug]/page.tsx` — Collection Detail

- Fetch from `/api/collections/:slug` 
- Show banner, logo, description, social links
- Show theme color
- Featured NFTs section
- Stats from DB (not derived)
- If owner: show "Manage" button → links to management page
- Category badge

#### [NEW] `src/app/collection/[slug]/manage/page.tsx` — Collection Management

Tabs:
1. **Overview** — Edit metadata (name, description, banner, logo, social links, theme color)
2. **NFTs** — List NFTs in collection, add/remove with search
3. **Settings** — Transfer ownership, delete collection
4. **Stats** — Detailed analytics

Auth: Only collection owner can access

#### [MODIFY] `src/app/create/page.tsx` — NFT Mint Page

- Replace free-text `Collection (Optional)` input with:
  - Dropdown of user's existing collections
  - "Create New Collection" quick link
  - Still allow "Independent" (no collection)

---

### Phase 5: Components

#### [NEW] `src/components/collections/CollectionCard.tsx`

- Grid card with banner, logo, name, stats
- Theme color accent
- Verified badge
- Reusable across listing & explore pages

#### [NEW] `src/components/collections/CollectionPicker.tsx`

- Dropdown/modal for selecting a collection when minting
- Search + create inline
- Shows user's owned collections

#### [NEW] `src/components/collections/CollectionBanner.tsx`

- Hero banner for collection detail page
- Banner image, logo overlay, stats bar, social links

#### [NEW] `src/components/collections/CollectionManageForm.tsx`

- Form component for editing collection metadata
- Image upload for logo/banner
- Color picker for theme

#### [MODIFY] `src/components/ui/EmptyState.tsx`

- Update "collection" variant to include "Create Collection" CTA

---

### Phase 6: Migration Script

#### [NEW] `scripts/migrate-collections.ts`

Migrate existing text-based collections to the new `collections` table:
1. Query distinct `collection` + `collection_slug` pairs from `nfts`
2. For each, create a `collections` row (owner = first NFT creator)
3. Update `nfts.collection_id` FK
4. Log migration results

---

## File Summary

| Action | File | Description |
|--------|------|-------------|
| NEW | `supabase/migrations/add_collections_table.sql` | DB schema |
| NEW | `src/types/collection.ts` | TypeScript types |
| NEW | `src/app/api/collections/route.ts` | List + Create API |
| NEW | `src/app/api/collections/[id]/route.ts` | Get + Update + Delete API |
| NEW | `src/app/api/collections/[id]/nfts/route.ts` | Add/Remove NFTs API |
| NEW | `src/app/api/collections/[id]/transfer/route.ts` | Transfer ownership API |
| NEW | `src/hooks/useCollections.ts` | React Query hooks |
| NEW | `src/app/collections/create/page.tsx` | Create collection page |
| NEW | `src/app/collection/[slug]/manage/page.tsx` | Manage collection page |
| NEW | `src/components/collections/CollectionCard.tsx` | Card component |
| NEW | `src/components/collections/CollectionPicker.tsx` | Picker for mint page |
| NEW | `src/components/collections/CollectionBanner.tsx` | Banner component |
| NEW | `src/components/collections/CollectionManageForm.tsx` | Edit form |
| NEW | `scripts/migrate-collections.ts` | Data migration |
| MODIFY | `src/app/collections/page.tsx` | Use API instead of derive |
| MODIFY | `src/app/collection/[slug]/page.tsx` | Full collection detail |
| MODIFY | `src/app/create/page.tsx` | Collection picker |
| MODIFY | `src/hooks/useData.ts` | Add collection query keys |
| MODIFY | `src/hooks/useMint.ts` | Use collection_id |
| MODIFY | `src/app/api/nfts/route.ts` | Support collection_id |
| MODIFY | `src/components/ui/EmptyState.tsx` | Add create CTA |

---

## Open Questions

> [!IMPORTANT]
> **Image uploads**: Logo & banner — nên dùng Cloudinary (đã có sẵn trong `.env.local`) hay IPFS (Pinata)? Cloudinary nhanh hơn cho display, IPFS tốt hơn cho decentralization.

> [!NOTE]
> **Verified badge**: Hiện tại chỉ manual set `is_verified = true` trong DB. Có cần flow verify tự động (ví dụ: ≥10 NFTs, ≥5 owners) không?

---

## Verification Plan

### Automated Tests
1. API route tests: CRUD collections, add/remove NFTs, transfer ownership
2. Build verification: `npx next build` passes
3. Type checking: No TypeScript errors

### Manual Verification
1. Create new collection with full metadata
2. Mint NFT and assign to collection via picker
3. View collection page — verify banner, logo, stats, NFTs
4. Manage collection — edit, add/remove NFTs
5. Transfer ownership to another wallet
6. Migration script — verify existing collections are migrated
7. Collections listing page — verify grid/list views with real data

---

## Execution Order

```
Phase 1 (DB)  →  Phase 2 (APIs)  →  Phase 3 (Types/Hooks)
                                          ↓
Phase 6 (Migration)  ←  Phase 4 (Pages)  ←  Phase 5 (Components)
```

Estimated: ~20 files, phù hợp cho 1 session implementation.
