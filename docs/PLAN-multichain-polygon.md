# PLAN: Multichain — Solana + Polygon (Cross-Chain Bridge)

## Tổng quan

Mở rộng NEXUS Marketplace từ **single-chain (Solana)** thành **multi-chain (Solana + Polygon)** với khả năng **bridge NFT** giữa 2 chain.

### Scope: Demo-grade
- Polygon Amoy Testnet (chain ID: 80002)
- Simulated bridge (lock/burn on source → mint on destination via Supabase tracking)
- Không cần oracle/relayer thực

---

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────┐
│                  NEXUS UI                   │
│         (Chain Selector in Header)          │
│   ┌─────────────┐    ┌─────────────┐       │
│   │   Phantom    │    │  MetaMask   │       │
│   │ (Solana)     │    │  (Polygon)  │       │
│   └─────────────┘    └─────────────┘       │
└──────────────┬──────────────┬───────────────┘
               │              │
    ┌──────────▼──────┐ ┌─────▼──────────┐
    │  Solana Devnet  │ │ Polygon Amoy   │
    │  SPL Token /    │ │ ERC-721        │
    │  Metaplex       │ │ Smart Contract │
    └──────────┬──────┘ └─────┬──────────┘
               │              │
          ┌────▼──────────────▼────┐
          │  Supabase Database     │
          │  (Unified NFT records) │
          │  + Bridge tracking     │
          └────────────────────────┘
```

---

## Phân tích hiện trạng (Solana-only)

| Layer | File(s) | Ràng buộc Solana |
|---|---|---|
| **Wallet Provider** | `providers.tsx` | `@solana/wallet-adapter-react` |
| **Connection** | `lib/solana/connection.ts` | `@solana/web3.js` Connection |
| **Mint** | `lib/solana/mint.ts` | SPL Token + Metaplex |
| **Marketplace** | `lib/solana/marketplace.ts` | SOL SystemProgram transfers |
| **Auction** | `lib/solana/auction.ts` | SOL transfers + SPL token |
| **Hooks** | `hooks/useMarketplace.ts` | `useWallet` from Solana adapter |
| **Hooks** | `hooks/useAuction.ts` | Solana wallet signing |
| **Hooks** | `hooks/useMint.ts` | Solana mint flow |
| **Hooks** | `hooks/useBalance.ts` | `getBalance` from Solana |
| **Types** | `types/nft.ts` | Không có trường `chain` |
| **Database** | Supabase `nfts` table | Không có cột `chain` |

**Kết luận:** Solana logic nằm gọn trong `lib/solana/*` và `hooks/`. UI layer tương đối chain-agnostic (chỉ cần thay `useWallet` hook).

---

## Kế hoạch triển khai

### Phase 1: Foundation — Chain Abstraction Layer (~3h)

#### 1.1 Chain Type System

##### [NEW] `src/types/chain.ts`
```typescript
export type ChainId = 'solana' | 'polygon';

export interface ChainConfig {
  id: ChainId;
  name: string;
  icon: string; // emoji or icon name
  currency: string; // SOL | POL
  testnet: string;
  explorer: string;
  rpcUrl: string;
}
```

##### [MODIFY] `src/types/nft.ts`
- Thêm `chain: ChainId` vào interface NFT
- Default `chain: 'solana'` cho backward compatibility

##### [MODIFY] Database — `nfts` table
- Thêm cột `chain TEXT DEFAULT 'solana'`
- Thêm cột `token_id TEXT` (cho ERC-721 token ID)
- Thêm cột `contract_address TEXT` (cho Polygon contract)

---

#### 1.2 Chain Context & Switcher

##### [NEW] `src/store/useChainStore.ts`
- Zustand store: `activeChain: ChainId`
- `setChain(chain)` action
- Persist to localStorage

##### [NEW] `src/components/layout/ChainSwitcher.tsx`
- Dropdown/toggle trong Header
- Icons: Solana ◎ | Polygon ▲
- Visual feedback khi switch

##### [MODIFY] `src/components/layout/Header.tsx`
- Thêm ChainSwitcher cạnh wallet button
- Conditionally render Solana wallet button vs MetaMask button

---

### Phase 2: Polygon Integration (~4h)

#### 2.1 EVM Wallet Setup

##### [NEW] Dependencies
```bash
npm install wagmi viem @wagmi/connectors
```

##### [NEW] `src/lib/polygon/config.ts`
- Wagmi config: Polygon Amoy chain
- MetaMask connector
- HTTP transport to `https://rpc-amoy.polygon.technology/`

##### [NEW] `src/lib/polygon/connection.ts`
- `getPolygonExplorerUrl()`
- `formatPOL()` (tương tự `formatSOL()`)
- `shortenAddress()` (reuse)

##### [MODIFY] `src/app/providers.tsx`
- Wrap app với cả `WagmiProvider` + `ConnectionProvider` (Solana)
- Cả 2 provider tồn tại song song (không xung đột)

---

#### 2.2 Smart Contract

##### [NEW] `contracts/NexusNFT.sol`
```solidity
// Simplified ERC-721 for demo
// Mint function: safeMint(address to, string tokenURI)
// Uses OpenZeppelin ERC721URIStorage
```

> **Lưu ý:** Contract sẽ được deploy sẵn. Contract address lưu trong `.env.local`.

##### [NEW] `src/lib/polygon/abi.ts`
- ABI của NexusNFT contract

##### [NEW] `src/lib/polygon/mint.ts`
- `mintNFTPolygon()`: Gọi `safeMint` qua wagmi/viem
- Upload metadata lên IPFS (tái sử dụng Pinata flow)

##### [NEW] `src/lib/polygon/marketplace.ts`
- `listNFTPolygon()`: Sign message proof-of-intent
- `buyNFTPolygon()`: Transfer POL + call `transferFrom`
- Pattern tương tự Solana marketplace

---

#### 2.3 Chain-aware Hooks

##### [NEW] `src/hooks/useChainWallet.ts`
- Unified wallet hook
- Nếu `activeChain === 'solana'` → return Solana wallet
- Nếu `activeChain === 'polygon'` → return wagmi wallet
- Interface chung: `{ address, connected, signMessage, balance }`

##### [MODIFY] `src/hooks/useMint.ts`
- Check `activeChain`
- Dispatch tới `mintNFT` (Solana) hoặc `mintNFTPolygon` (Polygon)

##### [MODIFY] `src/hooks/useMarketplace.ts`
- Check `activeChain`
- Dispatch tới Solana hoặc Polygon marketplace functions

##### [MODIFY] `src/hooks/useBalance.ts`
- Fetch balance from active chain

---

### Phase 3: Cross-Chain Bridge (~3h)

#### 3.1 Bridge Architecture (Simulated)

```
Solana NFT → "Lock" (mark bridged in DB) → Mint ERC-721 on Polygon
Polygon NFT → "Burn" (mark bridged in DB) → "Unlock" on Solana
```

**Cơ chế:**
1. User click "Bridge to Polygon" trên NFT detail
2. NFT bị đánh dấu `status: 'bridging'` trong Supabase
3. Frontend gọi API: lock on source chain → mint on destination
4. Supabase cập nhật: `chain: 'polygon'`, `bridge_origin: 'solana'`, `bridge_tx: '...'`
5. NFT hiện trên Polygon side với badge "Bridged from Solana"

##### [NEW] Database — `bridge_transactions` table
```sql
CREATE TABLE bridge_transactions (
  id UUID PRIMARY KEY,
  nft_mint TEXT NOT NULL,
  source_chain TEXT NOT NULL,
  dest_chain TEXT NOT NULL,
  source_tx TEXT,
  dest_tx TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  initiated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### [NEW] `src/app/api/bridge/route.ts`
- POST: Initiate bridge (validate + update NFT chain + log tx)
- GET: Get bridge history for NFT

##### [NEW] `src/hooks/useBridge.ts`
- `bridgeToPolygon(nft)`: Lock Solana NFT → Mint on Polygon
- `bridgeToSolana(nft)`: Burn Polygon NFT → Unlock on Solana
- Progress tracking: `idle → signing → locking → minting → complete`

##### [NEW] `src/components/nft/BridgeModal.tsx`
- UI modal: Select destination chain
- Progress stepper
- Estimated time + gas cost
- Badge hiện origin chain

---

### Phase 4: UI Updates (~2h)

#### 4.1 Chain-aware UI Components

##### [MODIFY] `src/components/nft/NFTCard.tsx`
- Thêm chain badge (◎ Solana / ▲ Polygon) trên mỗi card
- Màu khác nhau theo chain

##### [MODIFY] `src/app/explore/page.tsx`
- Filter theo chain (All / Solana / Polygon)
- Hiển thị currency đúng (SOL / POL)

##### [MODIFY] `src/app/nft/[mint]/page.tsx`
- Nút "Bridge" (chỉ hiện cho owner)
- Badge chain origin
- Hiển thị bridge history

##### [MODIFY] `src/app/create/page.tsx`
- Dropdown chọn chain trước khi mint
- Form tự adjust (Solana flow vs Polygon flow)

##### [MODIFY] `src/app/stats/page.tsx`
- Stats breakdown theo chain

---

## Environment Variables mới

```env
# POLYGON
NEXT_PUBLIC_POLYGON_CHAIN_ID=80002
NEXT_PUBLIC_POLYGON_RPC=https://rpc-amoy.polygon.technology/
NEXT_PUBLIC_POLYGON_CONTRACT=0x... # Deploy sẵn
POLYGON_DEPLOYER_KEY=... # Server-side only (cho bridge mint)
```

---

## Tổng kết Files

| Phase | Files mới | Files sửa | Effort |
|---|---|---|---|
| Phase 1: Foundation | 3 | 3 | ~3h |
| Phase 2: Polygon | 6 | 4 | ~4h |
| Phase 3: Bridge | 4 | 0 | ~3h |
| Phase 4: UI | 0 | 5 | ~2h |
| **Tổng** | **13 files mới** | **12 files sửa** | **~12h** |

---

## Thứ tự thực hiện đề xuất

1. **Phase 1** → Chain abstraction (không break existing code)
2. **Phase 2** → Polygon integration (mint + marketplace hoạt động độc lập)
3. **Phase 4** → UI updates (chain switcher + filters)
4. **Phase 3** → Bridge (tính năng nổi bật cuối cùng)

> **Lưu ý quan trọng:** Phase 2 yêu cầu **deploy smart contract** lên Polygon Amoy trước. Cần có MetaMask với Amoy testnet POL.

---

## Rủi ro & Giải pháp

| Rủi ro | Mức độ | Giải pháp |
|---|---|---|
| Contract deployment phức tạp | Trung bình | Dùng Hardhat + OpenZeppelin template đơn giản |
| 2 wallet providers xung đột | Thấp | Wagmi + Solana adapter chạy song song (đã verify) |
| Bridge security | Thấp (demo) | Simulated bridge — không involve real asset transfers |
| MetaMask chưa cài | Thấp | Show "Install MetaMask" prompt |

---

## Verification

1. Mint NFT trên Solana → Hiển thị đúng chain badge
2. Switch sang Polygon → Connect MetaMask → Mint NFT → Hiển thị
3. Explore page → Filter chain → Hiển thị đúng
4. Bridge Solana NFT → Polygon → Verify NFT xuất hiện ở Polygon side
5. Bridge Polygon NFT → Solana → Verify NFT xuất hiện ở Solana side
6. Stats page → Volume breakdown theo chain
