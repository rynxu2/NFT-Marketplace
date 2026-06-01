# 🛒 PLAN: Buy Collection — Mua toàn bộ Collection (Ownership + NFTs)

> **Tính năng:** Cho phép người dùng mua cả quyền sở hữu collection VÀ toàn bộ NFT trong collection đó, thanh toán on-chain.
> **Chains hỗ trợ:** Solana (Devnet) + Polygon Amoy (Testnet)
> **Nguyên tắc:** 1 transaction duy nhất nếu cùng chain

---

## 📋 MỤC LỤC

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Database changes](#2-database-changes)
3. [Smart Contract (Polygon)](#3-smart-contract-polygon)
4. [API Routes](#4-api-routes)
5. [Solana Logic](#5-solana-logic)
6. [Polygon Logic](#6-polygon-logic)
7. [Custom Hook](#7-custom-hook---usebuyCollection)
8. [Frontend UI](#8-frontend-ui)
9. [Task Breakdown](#9-task-breakdown)
10. [Verification](#10-verification)

---

## 1. Tổng quan kiến trúc

### Luồng hoạt động tổng quát

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BUYER clicks "Buy Collection"              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Xác định chain     │
                    │  của collection     │
                    └──────┬──────┬───────┘
                           │      │
              ┌────────────▼┐    ┌▼────────────┐
              │  SOLANA     │    │  POLYGON     │
              │             │    │              │
              │ 1. Buyer gửi│    │ 1. Buyer gọi│
              │   SOL tới   │    │   buyCollect │
              │   seller    │    │   ionBatch() │
              │   (1 tx:    │    │   trên smart │
              │   SOL pay + │    │   contract   │
              │   multi-NFT │    │   (1 tx:     │
              │   transfer  │    │    POL pay + │
              │   attempt)  │    │    batch     │
              │             │    │    transfer) │
              │ 2. Fallback:│    │              │
              │   SOL pay   │    │              │
              │   only +    │    │              │
              │   DB update │    │              │
              └──────┬──────┘    └──────┬───────┘
                     │                  │
              ┌──────▼──────────────────▼───────┐
              │     API: /api/collections/       │
              │            [id]/buy              │
              │                                  │
              │  • Validate collection for_sale  │
              │  • Update collection.owner       │
              │  • Batch update NFTs owner       │
              │  • Cancel active listings        │
              │  • Log activity (collection_sale)│
              └─────────────────────────────────┘
```

### Luồng chi tiết — Seller đặt bán Collection

```
Seller (chủ collection) → Vào trang collection → Click "Sell Collection"
  → Nhập giá (SOL hoặc POL)
  → Sign message (Solana) hoặc Approve all NFTs (Polygon)
  → API: PATCH /api/collections/[id] → set for_sale = true, sale_price = X
  → Collection hiển thị badge "FOR SALE" trên UI
```

### Luồng chi tiết — Buyer mua Collection

```
Buyer → Vào trang collection → Thấy "FOR SALE" badge
  → Click "Buy Collection" → Confirm modal (hiển thị giá + danh sách NFT)
  → On-chain transaction:
    [Solana]: SOL transfer buyer → seller
    [Polygon]: buyCollectionBatch() → POL transfer + batch NFT transfer
  → API: POST /api/collections/[id]/buy
    → Update collection.owner = buyer
    → Update tất cả NFTs.owner = buyer  
    → Deactivate listings liên quan
    → Log activity
  → UI cập nhật, buyer trở thành chủ collection
```

---

## 2. Database Changes

### 2.1. Thêm cột cho bảng `collections`

```sql
-- File: supabase/migrations/add_collection_sale.sql

ALTER TABLE collections ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT false;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sale_price NUMERIC;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sale_currency TEXT DEFAULT 'SOL';  -- 'SOL' hoặc 'POL'
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sale_tx TEXT;  -- transaction hash khi đặt bán
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sale_listed_at TIMESTAMPTZ;

-- Index cho filter collections đang bán
CREATE INDEX IF NOT EXISTS idx_collections_for_sale ON collections(for_sale) WHERE for_sale = true;
```

### 2.2. Thêm activity type mới

Hiện tại bảng `activities` dùng trường `type TEXT`. Thêm type mới:
- `collection_listed` — Collection được đặt bán
- `collection_sale` — Collection đã được mua
- `collection_delisted` — Collection bị hủy bán

---

## 3. Smart Contract — Polygon

### 3.1. NexusCollectionSale.sol (Contract mới)

> **Lý do tạo contract mới:** NexusEscrow chỉ xử lý offer cho 1 NFT. Cần contract mới hỗ trợ batch transfer nhiều NFT + payment trong 1 transaction.

```solidity
// contracts/NexusCollectionSale.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NexusCollectionSale
 * @dev Handles buying an entire collection of NFTs in a single transaction.
 * 
 * Flow:
 *   1. Seller calls setApprovalForAll() trên NexusNFT contract cho contract này
 *   2. Buyer calls buyCollectionBatch() với POL payment
 *   3. Contract: chuyển POL cho seller + batch transfer tất cả NFTs cho buyer
 */
contract NexusCollectionSale is ReentrancyGuard {

    event CollectionPurchased(
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256[] tokenIds,
        uint256 totalPrice
    );

    /**
     * @dev Buy all NFTs in a collection in one transaction.
     * Seller MUST have called setApprovalForAll(this_contract, true)
     * on the NFT contract beforehand.
     *
     * @param nftContract  The ERC-721 contract address
     * @param seller       The current owner of all NFTs
     * @param tokenIds     Array of token IDs to transfer
     */
    function buyCollectionBatch(
        address nftContract,
        address seller,
        uint256[] calldata tokenIds
    ) external payable nonReentrant {
        require(msg.value > 0, "Must send POL payment");
        require(seller != address(0), "Invalid seller");
        require(seller != msg.sender, "Cannot buy your own collection");
        require(tokenIds.length > 0, "No tokens to transfer");
        require(tokenIds.length <= 100, "Too many tokens in single tx");

        IERC721 nft = IERC721(nftContract);

        // Verify seller owns all tokens and has approved this contract
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                nft.ownerOf(tokenIds[i]) == seller,
                "Seller does not own all tokens"
            );
        }

        // Step 1: Transfer POL to seller
        (bool success, ) = payable(seller).call{value: msg.value}("");
        require(success, "Payment transfer failed");

        // Step 2: Batch transfer NFTs from seller to buyer
        for (uint256 i = 0; i < tokenIds.length; i++) {
            nft.transferFrom(seller, msg.sender, tokenIds[i]);
        }

        emit CollectionPurchased(
            msg.sender,
            seller,
            nftContract,
            tokenIds,
            msg.value
        );
    }
}
```

### 3.2. Deploy script

```
// scripts/deploy-collection-sale.cjs
// Tương tự deploy-escrow.cjs, deploy NexusCollectionSale contract
```

### 3.3. Config update

```
// .env.local — thêm:
NEXT_PUBLIC_COLLECTION_SALE_CONTRACT=0x...
```

### 3.4. ABI export

```
// src/lib/abi/NexusCollectionSale.json — Generated từ hardhat compile
```

---

## 4. API Routes

### 4.1. POST /api/collections/[id]/buy (MỚI)

**File:** `src/app/api/collections/[id]/buy/route.ts`

**Request body:**
```json
{
  "buyer": "wallet_address",
  "tx_signature": "on-chain tx hash",
  "chain": "solana" | "polygon",
  "price": 10.5
}
```

**Logic:**
1. Validate collection exists + `for_sale === true`
2. Validate buyer ≠ seller (collection.owner)
3. Update `collections`: `owner = buyer`, `for_sale = false`, clear sale fields
4. Batch update `nfts`: `UPDATE nfts SET owner = buyer WHERE collection_id = id`
5. Deactivate related `listings`: `UPDATE listings SET active = false WHERE mint IN (...)`
6. Log `activity`: type = `collection_sale`
7. Return updated collection

**Response:**
```json
{
  "data": { ...updated_collection },
  "transferred_nfts": 15,
  "deactivated_listings": 3
}
```

### 4.2. PATCH /api/collections/[id] — Mở rộng (SỬA)

**File:** `src/app/api/collections/[id]/route.ts`

**Thêm logic cho sell collection:**
- Accept fields: `for_sale`, `sale_price`, `sale_currency`, `sale_tx`, `sale_listed_at`
- Validate: chỉ owner mới được set `for_sale = true`
- Khi `for_sale = false` (delist): clear `sale_price`, `sale_currency`, `sale_tx`, `sale_listed_at`

### 4.3. GET /api/collections — Mở rộng (SỬA)

**File:** `src/app/api/collections/route.ts`

**Thêm filter:**
- `for_sale=true` — chỉ hiển thị collections đang bán
- Response include `for_sale`, `sale_price`, `sale_currency` fields

---

## 5. Solana Logic

### 5.1. src/lib/solana/collection-sale.ts (MỚI)

```typescript
// Luồng Solana:
// 1. Buyer build Transaction gồm:
//    - SystemProgram.transfer (SOL: buyer → seller)
//    - Cho mỗi NFT: createAssociatedTokenAccountInstruction (nếu cần) 
//      + createTransferInstruction (SPL token: seller ATA → buyer ATA)
//      LƯU Ý: SPL transfer cần seller signature → nên trong demo marketplace,
//      chỉ SOL payment on-chain, NFT ownership update qua DB (giống flow buyNFT hiện tại)
// 
// 2. Fallback approach (phù hợp demo):
//    - 1 transaction: SOL transfer buyer → seller (tổng giá collection)
//    - API update: batch update NFTs owner trong DB
//    - Consistent với flow marketplace hiện tại (hybrid custodial)

export async function buyCollectionSolana({
  wallet,
  sellerAddress,
  totalPrice,
}: {
  wallet: WalletContextState;
  sellerAddress: string;
  totalPrice: number;
}): Promise<{ txSignature: string }> {
  // SOL transfer buyer → seller
  // Giống buyNFT() hiện tại nhưng với totalPrice = sum of all NFTs
}
```

### 5.2. Lý do chọn approach "SOL payment only"

Trên Solana, SPL token transfer đòi hỏi **owner signature** (seller). Trong marketplace demo hiện tại, seller **không online** khi buyer mua → không có seller signature. Do đó:
- **On-chain:** SOL payment (proof of purchase)  
- **Off-chain:** Database update ownership (giống flow `buyNFT()` hiện tại)
- Đây là **consistent** với kiến trúc hybrid hiện có

---

## 6. Polygon Logic

### 6.1. src/lib/polygon/collection-sale.ts (MỚI)

```typescript
// Luồng Polygon (full on-chain):
// 
// PREREQUISITE: Seller đã gọi setApprovalForAll(COLLECTION_SALE_CONTRACT, true)
//               trên NexusNFT contract (khi "Sell Collection")
//
// 1. Buyer gọi NexusCollectionSale.buyCollectionBatch():
//    - msg.value = total POL price
//    - args: nftContract, seller, tokenIds[]
//    - Contract tự động: transfer POL → seller + batch transfer NFTs → buyer
//    - 1 transaction duy nhất!

export async function buyCollectionPolygon({
  buyerAddress,
  sellerAddress,
  tokenIds,
  totalPrice,
}: {
  buyerAddress: string;
  sellerAddress: string;
  tokenIds: string[];
  totalPrice: number;
}): Promise<{ txHash: string }> {
  // writeContract: buyCollectionBatch()
}

export async function approveCollectionForSale({
  ownerAddress,
}: {
  ownerAddress: string;
}): Promise<{ txHash: string }> {
  // writeContract: setApprovalForAll(COLLECTION_SALE_CONTRACT, true) trên NexusNFT
}
```

### 6.2. Gas estimation

- Mỗi ERC-721 transfer ≈ 60,000 gas
- 10 NFTs ≈ 600,000 gas + overhead ≈ 700,000 gas
- 50 NFTs ≈ 3,500,000 gas (vẫn dưới block gas limit)
- **Giới hạn:** Max 100 NFTs per transaction (contract enforce)
- Nếu collection > 100 NFTs → cần chia thành nhiều batch

---

## 7. Custom Hook — useBuyCollection

### 7.1. src/hooks/useBuyCollection.ts (MỚI)

```typescript
export type BuyCollectionStep = 
  'idle' | 'confirming' | 'paying' | 'transferring' | 'updating' | 'complete' | 'error';

export function useBuyCollection() {
  const [step, setStep] = useState<BuyCollectionStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const buyCollection = useCallback(
    async (collection: Collection) => {
      // 1. Validate: collection.for_sale, buyer ≠ owner
      // 2. Determine chain
      // 3. On-chain payment:
      //    - Solana: buyCollectionSolana()
      //    - Polygon: buyCollectionPolygon()
      // 4. API call: POST /api/collections/[id]/buy
      // 5. Invalidate queries
      // 6. Return success
    },
    [...]
  );

  return { buyCollection, step, txHash };
}
```

### 7.2. src/hooks/useSellCollection.ts (MỚI)

```typescript
export function useSellCollection() {
  const sellCollection = useCallback(
    async (collectionId: string, price: number) => {
      // 1. Determine chain
      // 2. Solana: signMessage (proof-of-intent)
      //    Polygon: setApprovalForAll() on-chain
      // 3. API: PATCH /api/collections/[id] → for_sale = true, sale_price
      // 4. Log activity: collection_listed
    },
    [...]
  );

  const cancelSale = useCallback(
    async (collectionId: string) => {
      // 1. Polygon: revoke approval (optional)
      // 2. API: PATCH /api/collections/[id] → for_sale = false
      // 3. Log activity: collection_delisted
    },
    [...]
  );

  return { sellCollection, cancelSale };
}
```

---

## 8. Frontend UI

### 8.1. Collection Detail Page — Thêm UI mua/bán

**File sửa:** `src/app/collection/[slug]/page.tsx`

**Thêm:**
- Nếu `isOwner && !collection.for_sale` → hiện nút **"Sell Collection"**
- Nếu `isOwner && collection.for_sale` → hiện nút **"Cancel Sale"** + badge giá
- Nếu `!isOwner && collection.for_sale` → hiện nút **"Buy Collection"** + giá
- Nếu `!isOwner && !collection.for_sale` → không hiện gì (như hiện tại)

### 8.2. SellCollectionModal (MỚI)

**File:** `src/components/collections/SellCollectionModal.tsx`

```
┌────────────────────────────────────────┐
│       🏷️ Sell Collection               │
│                                        │
│  Collection: "Cyber Punks"             │
│  Items: 15 NFTs                        │
│  Chain: Polygon                        │
│                                        │
│  Set Price: [________] POL             │
│                                        │
│  ⚠️ This will sell ALL 15 NFTs and     │
│     the collection ownership to the    │
│     buyer.                             │
│                                        │
│  [Cancel]           [Sell Collection]  │
└────────────────────────────────────────┘
```

### 8.3. BuyCollectionModal (MỚI)

**File:** `src/components/collections/BuyCollectionModal.tsx`

```
┌────────────────────────────────────────┐
│       🛒 Buy Collection                │
│                                        │
│  Collection: "Cyber Punks"             │
│  Owner: 0x1234...5678                  │
│  Items: 15 NFTs                        │
│                                        │
│  Price: 50 POL ($12.50 USD)            │
│                                        │
│  You will receive:                     │
│  ✅ Collection ownership               │
│  ✅ All 15 NFTs transferred to you     │
│  ✅ Active listings will be cancelled  │
│                                        │
│  ── Progress ──────────────────────    │
│  [█████░░░░░] Paying...                │
│                                        │
│  [Cancel]         [Confirm Purchase]   │
└────────────────────────────────────────┘
```

### 8.4. CollectionBanner — Sửa hiện trạng thái bán

**File sửa:** `src/components/collections/CollectionBanner.tsx`

**Thêm:**
- Badge "FOR SALE" với giá khi `collection.for_sale === true`
- Nút Buy/Sell tùy theo `isOwner`

### 8.5. Collections List — Hiển thị badge "FOR SALE"

**File sửa:** Nơi render danh sách collections (trong `/collections` page)

- Collection card hiện badge "FOR SALE" + giá nếu `for_sale === true`
- Filter option: "Show only for sale"

### 8.6. Collection Type — Cập nhật

**File sửa:** `src/types/collection.ts`

```typescript
// Thêm vào interface Collection:
export interface Collection {
  // ...existing fields...
  forSale: boolean;
  salePrice: number | null;
  saleCurrency: string;  // 'SOL' | 'POL'
  saleTx: string | null;
  saleListedAt: string | null;
}
```

---

## 9. Task Breakdown

### Phase 1: Database + Types (Cơ sở)

| # | Task | File | Ước lượng |
|---|------|------|-----------|
| 1.1 | Tạo migration SQL cho collection sale columns | `supabase/migrations/add_collection_sale.sql` | 10 min |
| 1.2 | Update Collection type interface | `src/types/collection.ts` | 5 min |
| 1.3 | Update collection mapper trong useCollections | `src/hooks/useCollections.ts` | 5 min |

### Phase 2: Smart Contract (Polygon)

| # | Task | File | Ước lượng |
|---|------|------|-----------|
| 2.1 | Viết NexusCollectionSale.sol | `contracts/NexusCollectionSale.sol` | 30 min |
| 2.2 | Viết deploy script | `scripts/deploy-collection-sale.cjs` | 10 min |
| 2.3 | Compile + Deploy lên Amoy | CLI commands | 10 min |
| 2.4 | Export ABI + thêm vào config | `src/lib/abi/`, `.env.local` | 10 min |

### Phase 3: API Routes (Backend)

| # | Task | File | Ước lượng |
|---|------|------|-----------|
| 3.1 | Tạo POST /api/collections/[id]/buy | `src/app/api/collections/[id]/buy/route.ts` | 30 min |
| 3.2 | Mở rộng PATCH /api/collections/[id] | `src/app/api/collections/[id]/route.ts` | 15 min |
| 3.3 | Mở rộng GET /api/collections (filter for_sale) | `src/app/api/collections/route.ts` | 10 min |

### Phase 4: Blockchain Logic (Lib)

| # | Task | File | Ước lượng |
|---|------|------|-----------|
| 4.1 | Tạo Solana collection sale logic | `src/lib/solana/collection-sale.ts` | 20 min |
| 4.2 | Tạo Polygon collection sale logic | `src/lib/polygon/collection-sale.ts` | 25 min |
| 4.3 | Update polygon/config.ts (thêm contract address) | `src/lib/polygon/config.ts` | 5 min |

### Phase 5: Custom Hooks

| # | Task | File | Ước lượng |
|---|------|------|-----------|
| 5.1 | Tạo useBuyCollection hook | `src/hooks/useBuyCollection.ts` | 30 min |
| 5.2 | Tạo useSellCollection hook | `src/hooks/useSellCollection.ts` | 25 min |
| 5.3 | Update API client functions | `src/lib/api.ts` | 10 min |

### Phase 6: Frontend UI

| # | Task | File | Ước lượng |
|---|------|------|-----------|
| 6.1 | Tạo SellCollectionModal | `src/components/collections/SellCollectionModal.tsx` | 30 min |
| 6.2 | Tạo BuyCollectionModal | `src/components/collections/BuyCollectionModal.tsx` | 35 min |
| 6.3 | Update CollectionBanner (badge + buttons) | `src/components/collections/CollectionBanner.tsx` | 20 min |
| 6.4 | Update Collection detail page | `src/app/collection/[slug]/page.tsx` | 20 min |
| 6.5 | Update Collections list (FOR SALE badge) | Pages hiển thị collections | 15 min |

### Phase 7: Testing + Polish

| # | Task | File | Ước lượng |
|---|------|------|-----------|
| 7.1 | Test flow Sell Collection (Solana) | Manual test | 15 min |
| 7.2 | Test flow Buy Collection (Solana) | Manual test | 15 min |
| 7.3 | Test flow Sell Collection (Polygon) | Manual test | 15 min |
| 7.4 | Test flow Buy Collection (Polygon) | Manual test | 15 min |
| 7.5 | Test edge cases (empty collection, mixed chains) | Manual test | 15 min |

### Tổng ước lượng: ~7-8 giờ

---

## 10. Verification

### 10.1. Test Scenarios

| # | Scenario | Expected Result |
|---|----------|----------------|
| 1 | Seller đặt bán collection (Solana) | Sign message → DB update for_sale = true |
| 2 | Seller đặt bán collection (Polygon) | setApprovalForAll() → DB update for_sale = true |
| 3 | Buyer mua collection (Solana) | SOL transfer → DB update owner + NFTs |
| 4 | Buyer mua collection (Polygon) | buyCollectionBatch() → on-chain transfer + DB update |
| 5 | Seller hủy bán collection | DB update for_sale = false |
| 6 | Buyer cố mua collection chưa for_sale | API reject 400 |
| 7 | Owner cố mua collection của chính mình | API/Contract reject |
| 8 | Collection có NFT listed → mua → listings bị cancel | Listings deactivated |
| 9 | Collection trống (0 NFTs) → đặt bán | Cho phép (chỉ bán ownership) |
| 10 | Collection > 100 NFTs (Polygon) | Error message: "Too many NFTs, contact support" |

### 10.2. Build + Lint Check

```bash
npm run build   # Phải pass
npm run lint     # Phải clean
npm test         # Tests phải pass
```

### 10.3. Smart Contract Verification

```bash
npm run compile                    # Hardhat compile
npx hardhat test                   # Contract tests (nếu có)
npm run deploy:collection-sale     # Deploy lên Amoy
```

---

## 📁 Danh sách file (Tóm tắt)

### File MỚI (9 files)

| File | Loại |
|------|------|
| `supabase/migrations/add_collection_sale.sql` | SQL Migration |
| `contracts/NexusCollectionSale.sol` | Smart Contract |
| `scripts/deploy-collection-sale.cjs` | Deploy Script |
| `src/lib/abi/NexusCollectionSale.json` | ABI (auto-generated) |
| `src/lib/solana/collection-sale.ts` | Solana Logic |
| `src/lib/polygon/collection-sale.ts` | Polygon Logic |
| `src/hooks/useBuyCollection.ts` | React Hook |
| `src/hooks/useSellCollection.ts` | React Hook |
| `src/components/collections/SellCollectionModal.tsx` | UI Component |
| `src/components/collections/BuyCollectionModal.tsx` | UI Component |
| `src/app/api/collections/[id]/buy/route.ts` | API Route |

### File SỬA (7 files)

| File | Thay đổi |
|------|----------|
| `src/types/collection.ts` | Thêm forSale, salePrice, saleCurrency fields |
| `src/hooks/useCollections.ts` | Update mapper cho sale fields |
| `src/lib/polygon/config.ts` | Thêm NEXUS_COLLECTION_SALE_CONTRACT |
| `src/lib/api.ts` | Thêm apiBuyCollection(), apiSellCollection() |
| `src/app/api/collections/[id]/route.ts` | PATCH: accept sale fields |
| `src/app/api/collections/route.ts` | GET: filter for_sale |
| `src/app/collection/[slug]/page.tsx` | Thêm Buy/Sell buttons + modals |
| `src/components/collections/CollectionBanner.tsx` | Thêm FOR SALE badge |

---

## ⚠️ Edge Cases & Lưu ý

### Mixed-chain Collections
- Collection có thể chứa NFT từ cả Solana lẫn Polygon
- Khi mua: chỉ transfer on-chain được NFTs **cùng chain** với payment
- NFTs **khác chain**: chỉ update DB ownership (consistent với flow hiện tại)
- UI cần cảnh báo: "NFTs on other chains will only have database ownership transferred"

### Listings conflict
- Khi collection được bán, tất cả active listings của NFTs trong collection phải bị **deactivate**
- Buyer trở thành owner → listings cũ (seller cũ) không còn hợp lệ

### Auctions conflict
- Active auctions cho NFTs trong collection → **BLOCK**: Không cho phép bán collection nếu có auction active
- API validate: kiểm tra `auctions` table với `status = 'active'` cho các NFT trong collection

### Gas limit (Polygon)
- Max 100 NFTs per buyCollectionBatch() call
- Nếu > 100: Frontend chia thành nhiều batch, hoặc hiện warning

### Concurrency
- Dùng Supabase transaction (hoặc sequential updates) để đảm bảo atomicity
- Nếu on-chain tx thành công nhưng DB update fail → cần manual reconciliation
