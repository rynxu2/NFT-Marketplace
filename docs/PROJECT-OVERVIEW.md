# NEXUS — NFT Marketplace Cross-Chain

> Tài liệu kỹ thuật tổng quan dự án. Dùng để làm nguồn cho AI tạo báo cáo cuối môn.

---

## 1. Giới Thiệu Dự Án

**Tên:** NEXUS — NFT Marketplace  
**Mô tả:** Sàn giao dịch NFT đa chuỗi (multi-chain) hỗ trợ Solana và Polygon. Người dùng có thể tạo, mua bán, đấu giá, chuyển nhượng và bridge NFT giữa các blockchain.  
**URL Demo:** `https://nexus-nft.pages.dev`  
**Phong cách:** Cyberpunk — giao diện neon tối, hiệu ứng ánh sáng xanh cyan.

---

## 2. Công Nghệ Sử Dụng

### Frontend
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| Next.js | 16.2.4 | Framework React (App Router, SSR) |
| React | 19.2.4 | Thư viện UI |
| TypeScript | ^5 | Kiểu dữ liệu tĩnh |
| Tailwind CSS | v4 | Styling |
| Framer Motion | ^12.38 | Hiệu ứng animation |
| Recharts | ^3.8.1 | Biểu đồ giá, thống kê |

### Blockchain / Web3
| Công nghệ | Vai trò |
|---|---|
| @solana/web3.js + SPL Token | Tương tác blockchain Solana (Devnet) |
| Solana Wallet Adapter | Kết nối ví Phantom, Solflare |
| wagmi + viem | Tương tác Polygon/EVM, kết nối MetaMask |
| Hardhat | Phát triển Smart Contract |
| OpenZeppelin | Thư viện ERC-721 chuẩn |

### Backend / Lưu Trữ
| Công nghệ | Vai trò |
|---|---|
| Supabase | Database PostgreSQL (BaaS) + Row Level Security |
| Cloudinary | Lưu trữ hình ảnh CDN (tự động tối ưu WebP) |
| Pinata (IPFS) | Lưu trữ metadata phi tập trung |

### State Management
| Công nghệ | Vai trò |
|---|---|
| Zustand | Quản lý state client (chain, theme, toast) |
| TanStack React Query | Data fetching + cache + invalidation |

### Bảo Mật
| Công nghệ | Vai trò |
|---|---|
| tweetnacl | Xác minh chữ ký Ed25519 (Solana) |
| bs58 | Mã hóa Base58 |

---

## 3. Kiến Trúc Hệ Thống

```
┌───────────────────────────────────────────┐
│              NEXUS Frontend               │
│           (Next.js 16 + React 19)         │
└──────────────────┬────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
┌────▼─────┐ ┌────▼─────┐ ┌────▼──────┐
│ Solana   │ │ Polygon  │ │ Supabase  │
│ Devnet   │ │ Amoy     │ │ PostgreSQL│
│          │ │          │ │           │
│ SPL Token│ │ NexusNFT │ │ 8 tables  │
│ Metaplex │ │ NexusBrid│ │ RLS       │
│ Phantom  │ │ MetaMask │ │ Realtime  │
└──────────┘ └──────────┘ └───────────┘
```

### Luồng Dữ Liệu
```
Hành động User → Custom Hook → Giao dịch Blockchain + API Route → Supabase DB
                                                                      ↓
         React Query Cache ← API Response ← ─────────────────────────┘
```

**Quyết định kiến trúc chính:**
- Supabase là nguồn sự thật (source of truth) cho marketplace data
- Blockchain dùng cho bằng chứng giao dịch (mint, thanh toán, chữ ký)
- Optimistic UI: cập nhật giao diện ngay, đồng bộ DB sau
- Mọi truy vấn đều phân tách theo chain (multi-chain isolation)

---

## 4. Cơ Sở Dữ Liệu (8 Bảng)

### nfts — Bảng NFT chính
| Cột | Kiểu | Mô tả |
|---|---|---|
| mint | TEXT PK | Địa chỉ mint duy nhất |
| name, description | TEXT | Tên và mô tả |
| image | TEXT | URL hình ảnh (Cloudinary) |
| owner | TEXT | Địa chỉ ví chủ sở hữu hiện tại |
| creator | TEXT | Địa chỉ ví người tạo |
| price | NUMERIC | Giá hiện tại |
| listed | BOOLEAN | Đang được rao bán không |
| collection_id | UUID FK | Liên kết collection |
| attributes | JSONB | Thuộc tính NFT |
| metadata_uri | TEXT | URL metadata trên IPFS |
| chain | TEXT | 'solana' hoặc 'polygon' |
| token_id | TEXT | ERC-721 token ID (Polygon) |
| bridge_origin | TEXT | Chain gốc nếu đã bridge |

### listings — Danh sách rao bán
Gồm: id, mint, seller, price, active, chain, listed_at

### auctions — Đấu giá
Gồm: id, nft_mint, seller, starting_price, current_bid, highest_bidder, min_bid_increment, end_time, status (active/ended/settled), chain

### bids — Lượt đặt giá
Gồm: id, auction_id (FK→auctions), bidder, amount, tx_signature

### activities — Nhật ký hoạt động
Gồm: id, type (11 loại: sale, listing, bid, transfer, mint, cancel, auction_created, auction_settled, auction_won, offer, offer_accepted), nft_mint, from_address, to_address, price, chain

### offers — Đề nghị mua
Gồm: id, nft_mint, bidder, amount, status (active/accepted/rejected/expired/cancelled), expires_at

### collections — Bộ sưu tập
Gồm: id, slug, name, description, logo, banner, owner, category, theme_color, social_links (JSONB), is_verified, chain

### bridge_transactions — Lịch sử bridge
Gồm: id, nft_mint, source_chain, dest_chain, source_tx, dest_tx, status (pending/completed/failed), initiated_by

### favorites — Yêu thích
Gồm: user_address + nft_mint (composite PK)

---

## 5. Smart Contracts (Solidity)

### NexusNFT.sol — Hợp đồng NFT ERC-721
- **Mạng:** Polygon Amoy Testnet (chain ID 80002)
- **Chuẩn:** ERC-721 (OpenZeppelin v5)
- **Hàm chính:**
  - `safeMint(address to, string uri)` → Mint NFT mới, trả về tokenId
  - `totalSupply()` → Tổng số NFT đã mint
  - `transferFrom()` → Chuyển nhượng NFT

### NexusBridge.sol — Hợp đồng Bridge Cross-Chain
- **Hàm chính:**
  - `bridgeMint(address to, string uri, string originalMint, string originalChain)` → Mint wrapped NFT trên chain đích, chống trùng lặp
  - `bridgeBurn(uint256 tokenId)` → Đốt wrapped NFT khi bridge ngược, chỉ chủ sở hữu mới được gọi
  - `getBridgeInfo(tokenId)` → Thông tin bridge (mint gốc, chain gốc, thời gian)
  - `isActiveBridge(originalMint)` → Kiểm tra NFT đã bridge chưa
- **Events:** BridgeMinted, BridgeBurned

---

## 6. Các Trang Chính (12 trang)

| Trang | URL | Chức năng |
|---|---|---|
| Trang chủ | `/` | Hero, NFT nổi bật, trending collections, thống kê |
| Khám phá | `/explore` | Duyệt NFT với tìm kiếm, lọc, sắp xếp |
| Tạo NFT | `/create` | Form mint NFT đa bước (upload, metadata, thuộc tính) |
| Chi tiết NFT | `/nft/[mint]` | Xem NFT, lịch sử giá, mua/bán/đặt giá/đấu giá/chuyển/bridge |
| Hồ sơ | `/profile/[address]` | NFT sở hữu, đã tạo, yêu thích, hoạt động |
| Đấu giá | `/auctions` | Duyệt đấu giá đang diễn ra |
| Chi tiết đấu giá | `/auction/[id]` | Giao diện đặt giá, đếm ngược, lịch sử bid |
| Bộ sưu tập | `/collections` | Duyệt và tạo collection |
| Tạo collection | `/collections/create` | Form tạo bộ sưu tập |
| Chi tiết collection | `/collection/[slug]` | Banner, grid NFT, thống kê, quản lý |
| Hoạt động | `/activity` | Feed hoạt động toàn sàn |
| Thống kê | `/stats` | Phân tích marketplace, biểu đồ volume |

---

## 7. API Endpoints (28 endpoint, 10 nhóm)

| Nhóm | Endpoints | Chức năng |
|---|---|---|
| `/api/nfts` | GET, POST, PATCH | CRUD NFT với filter chain/owner/collection/search |
| `/api/listings` | GET, POST, DELETE | Tạo/hủy/lấy danh sách rao bán |
| `/api/auctions` | GET, POST | Tạo đấu giá |
| `/api/auctions/[id]/bid` | POST | Đặt giá |
| `/api/auctions/[id]/settle` | POST | Kết thúc đấu giá |
| `/api/collections` | GET, POST | CRUD bộ sưu tập |
| `/api/collections/[id]` | GET, PATCH, DELETE | Chi tiết + cập nhật + xóa |
| `/api/collections/[id]/nfts` | POST, DELETE | Thêm/xóa NFT trong collection |
| `/api/collections/[id]/transfer` | POST | Chuyển quyền sở hữu collection |
| `/api/bridge` | POST | Bridge NFT cross-chain |
| `/api/upload` | POST | Upload hình ảnh lên Cloudinary |
| `/api/upload/metadata` | POST | Upload metadata lên IPFS |
| `/api/favorites` | GET, POST, DELETE | Hệ thống yêu thích |
| `/api/offers` | GET, POST | Tạo/lấy đề nghị mua |
| `/api/offers/[id]` | PATCH | Chấp nhận/từ chối offer |
| `/api/activities` | GET, POST | Nhật ký hoạt động |
| `/api/stats` | GET | Thống kê marketplace |

---

## 8. Luồng Hoạt Động Chính

### 8.1 Mint (Tạo NFT)
1. Kết nối ví (Phantom cho Solana / MetaMask cho Polygon)
2. Upload hình ảnh → Cloudinary (tự động nén WebP, max 1200px)
3. Tạo metadata JSON → Upload lên IPFS qua Pinata
4. **Solana:** Tạo SPL Token mint + metadata account (Metaplex) trong 1 giao dịch
5. **Polygon:** Gọi `NexusNFT.safeMint(address, tokenURI)` qua wagmi
6. Lưu record vào Supabase, ghi log "mint"

### 8.2 List (Rao bán)
1. Chủ NFT chọn "List for Sale" và nhập giá
2. **Solana:** Ký message chứng minh ý định bán
3. **Polygon:** Gọi `setApprovalForAll` trên contract
4. Tạo listing trong DB, cập nhật NFT (listed=true), ghi log "listing"

### 8.3 Buy (Mua)
1. Người mua nhấn "Buy Now"
2. **Solana:** Tạo giao dịch SOL transfer (buyer → seller)
3. **Polygon:** Gửi POL cho seller + gọi `transferFrom` trên contract
4. Cập nhật owner trong DB, deactivate listing, ghi log "sale"

### 8.4 Auction (Đấu giá)
1. **Tạo:** Chủ NFT ký message → tạo auction record với thời gian kết thúc
2. **Đặt giá:** Người bid ký commitment message → lưu bid vào DB
3. **Kết thúc:** Sau end_time, người thắng thanh toán → chuyển quyền sở hữu NFT

### 8.5 Bridge (Chuyển chuỗi)
1. Chọn chain đích + nhập địa chỉ ví nhận (hoặc tự detect từ ví đang connect)
2. **Solana → Polygon:** Ký lock message trên Phantom → gọi `bridgeMint()` trên Polygon
3. **Polygon → Solana:** Gọi `bridgeBurn()` trên Polygon → cập nhật DB
4. Cập nhật NFT chain + owner trong Supabase

### 8.6 Transfer (Chuyển nhượng)
1. Nhập địa chỉ ví người nhận
2. **Solana:** `createTransferInstruction` (SPL Token)
3. **Polygon:** `transferFrom` trên NexusNFT contract
4. Cập nhật owner trong DB, ghi log "transfer"

### 8.7 Offer (Đề nghị mua)
1. Người mua nhập giá đề nghị + ký xác nhận
2. Tạo offer trong DB (hết hạn sau 7 ngày)
3. Chủ NFT có thể chấp nhận/từ chối

---

## 9. Tích Hợp Ví

### Solana (Devnet)
- **Ví hỗ trợ:** Phantom, Solflare + auto-detect
- **Chức năng:** Mint SPL Token, chuyển SOL, ký message, yêu cầu airdrop
- **Airdrop:** 3 chiến lược retry (RPC → Web Faucet → số lượng nhỏ hơn)

### Polygon (Amoy Testnet)
- **Ví hỗ trợ:** MetaMask + tất cả ví EVM injected
- **Chức năng:** Mint ERC-721, chuyển POL, gọi smart contract, approve
- **Chain ID:** 80002, RPC: `https://rpc-amoy.polygon.technology/`

### Unified Wallet (useChainWallet)
Hook thống nhất trả về `{ address, connected, chain, balance }` dựa trên chain đang chọn. Tự động chuyển giữa Solana/Polygon.

---

## 10. Cấu Trúc Thư Mục

```
NFT-Marketplace/
├── contracts/              # Smart contracts (Solidity)
│   ├── NexusNFT.sol        # ERC-721 NFT contract
│   └── NexusBridge.sol     # Bridge contract
├── scripts/                # Deploy scripts (Hardhat)
├── supabase/migrations/    # SQL migrations (schema)
├── src/
│   ├── app/                # Pages + API routes (Next.js App Router)
│   │   ├── api/            # 10 nhóm API endpoints
│   │   └── [pages]/        # 12 trang giao diện
│   ├── components/         # 25 React components
│   │   ├── ui/             # 9 component giao diện cơ bản
│   │   ├── nft/            # 5 component NFT
│   │   ├── layout/         # 5 component bố cục
│   │   ├── auction/        # 2 component đấu giá
│   │   └── collections/    # 4 component bộ sưu tập
│   ├── hooks/              # 10 custom hooks
│   ├── lib/                # Thư viện tiện ích
│   │   ├── solana/         # 4 module Solana
│   │   ├── polygon/        # 5 module Polygon
│   │   └── abi/            # ABI smart contract
│   ├── store/              # 4 Zustand stores
│   └── types/              # 6 file định nghĩa kiểu
├── hardhat.config.cjs      # Cấu hình Hardhat
├── next.config.ts          # Cấu hình Next.js
└── package.json            # Dependencies
```

---

## 11. Thiết Kế Giao Diện (Cyber Nexus Theme)

### Bảng Màu
| Tên | Mã | Dùng cho |
|---|---|---|
| Void | `#0a0a0f` | Nền chính (dark mode) |
| Neon Cyan | `#00f0ff` | Accent chính, glow effects |
| Electric Lime | `#a3ff12` | Accent phụ, trạng thái thành công |
| Signal Orange | `#ff6b2b` | Màu chain Polygon |
| Crimson | `#ff2d55` | Lỗi, cảnh báo |

### Typography
| Loại | Font | Dùng cho |
|---|---|---|
| Display | Orbitron | Tiêu đề, heading |
| Body | Space Grotesk | Văn bản chính |
| Mono | JetBrains Mono | Địa chỉ ví, giá, code |

### Hiệu Ứng
- Cyber grid background (lưới 60px)
- Scan line animation (4 giây)
- Glow effects (box-shadow neon cyan)
- Clipped corners (hình dạng cyberpunk)
- Glitch text animation khi hover
- Hỗ trợ `prefers-reduced-motion`

---

## 12. Tổng Kết Số Liệu

| Hạng mục | Số lượng |
|---|---|
| Trang giao diện | 12 |
| API endpoints | 28 |
| React components | 25 |
| Custom hooks | 10 |
| Bảng database | 8 |
| Smart contracts | 2 |
| Zustand stores | 4 |
| Type definitions | 6 |
| Blockchain hỗ trợ | 2 (Solana + Polygon) |
