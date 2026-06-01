# 📄 DÀN Ý BÁO CÁO — NEXUS NFT MARKETPLACE

> **Mục đích:** Dựa vào file này để viết báo cáo Word gồm 3 chương.
> **Dự án:** NEXUS — Multi-Chain NFT Marketplace (Solana + Polygon)
> **Công nghệ chính:** Next.js 16, Solana (Devnet), Polygon Amoy (Testnet), Supabase, Solidity, IPFS/Pinata

---

## 📑 MỤC LỤC TỔNG QUÁT

```
Lời mở đầu
Chương 1: Giới thiệu đề tài
Chương 2: Cơ sở lý thuyết
Chương 3: Phân tích chương trình
Kết luận
Tài liệu tham khảo
Phụ lục
```

---

# CHƯƠNG 1: GIỚI THIỆU ĐỀ TÀI

## 1.1. Lý do chọn đề tài

- Thị trường NFT phát triển mạnh mẽ từ năm 2021, đạt volume hàng tỷ USD
- Nhu cầu về marketplace phi tập trung (decentralized) ngày càng tăng
- Hạn chế của các marketplace hiện tại: phụ thuộc vào một blockchain duy nhất (OpenSea chủ yếu Ethereum, Magic Eden chủ yếu Solana)
- Cơ hội xây dựng marketplace multi-chain kết nối nhiều hệ sinh thái blockchain

## 1.2. Mục tiêu đề tài

- Xây dựng NFT Marketplace hỗ trợ đa chuỗi (multi-chain): **Solana** và **Polygon**
- Tích hợp cầu nối cross-chain (bridge) cho phép chuyển NFT giữa các blockchain
- Hỗ trợ đầy đủ các tính năng: Mint, List, Buy, Auction, Offer, Bridge
- Phát triển Smart Contract trên Solidity (ERC-721) cho Polygon
- Sử dụng kiến trúc hybrid: on-chain (blockchain) + off-chain (Supabase database)
- Giao diện hiện đại, responsive với Next.js và Tailwind CSS

## 1.3. Phạm vi đề tài

- **Blockchain hỗ trợ:** Solana Devnet, Polygon Amoy Testnet
- **Loại NFT:** ERC-721 (Polygon), SPL Token (Solana)
- **Chức năng:**
  - Tạo (Mint) NFT trên cả 2 chain
  - Đăng bán (List) và mua (Buy) NFT
  - Đấu giá (Auction) với hệ thống đặt giá (Bid)
  - Đề xuất mua (Offer) với Escrow on-chain
  - Chuyển NFT cross-chain (Bridge) Solana ↔ Polygon
  - Quản lý bộ sưu tập (Collections)
  - Xem lịch sử hoạt động (Activity Feed)
  - Thống kê (Stats Dashboard)
  - Hồ sơ người dùng (Profile)
- **Không bao gồm:** Mainnet deployment, royalty enforcement on-chain, DAO governance

## 1.4. Đối tượng sử dụng

- Người sáng tạo nội dung số (digital artists, creators)
- Nhà sưu tập NFT
- Người dùng muốn trải nghiệm giao dịch NFT đa chuỗi
- Sinh viên/nhà phát triển tìm hiểu về blockchain

## 1.5. Phương pháp nghiên cứu

- Nghiên cứu tài liệu: Whitepaper Solana, Ethereum/Polygon, các chuẩn ERC-721, SPL Token
- Phân tích các marketplace hiện có: OpenSea, Magic Eden, Rarible
- Phương pháp phát triển phần mềm: Agile/Iterative
- Công cụ phát triển: VS Code, Hardhat, Solana CLI, Git

## 1.6. Cấu trúc báo cáo

- Tóm tắt ngắn gọn nội dung 3 chương

---

# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT

## 2.1. Tổng quan về Blockchain

### 2.1.1. Blockchain là gì?

- Định nghĩa: Sổ cái phân tán (distributed ledger), bất biến (immutable), minh bạch
- Cấu trúc block: Header (hash, timestamp, nonce) + Body (transactions)
- Cơ chế liên kết: Hash chain — mỗi block chứa hash của block trước
- Đặc điểm: Phi tập trung, minh bạch, không thể sửa đổi, đồng thuận

### 2.1.2. Lịch sử phát triển

- Bitcoin (2009) — Satoshi Nakamoto — Blockchain 1.0
- Ethereum (2015) — Vitalik Buterin — Blockchain 2.0 (Smart Contract)
- Solana, Polygon, Avalanche... — Blockchain 3.0 (Scalability)

### 2.1.3. Cơ chế đồng thuận (Consensus Mechanism)

| Cơ chế | Blockchain tiêu biểu | Đặc điểm |
|--------|----------------------|-----------|
| Proof of Work (PoW) | Bitcoin, Ethereum (trước 2022) | An toàn cao, tốn năng lượng |
| Proof of Stake (PoS) | Ethereum 2.0, Polygon | Tiết kiệm năng lượng, staking |
| Proof of History (PoH) | Solana | Timestamp có thể xác minh, tốc độ cao |
| Delegated PoS (DPoS) | EOS, Tron | Đại biểu bỏ phiếu |

## 2.2. Các tầng kiến trúc Blockchain (Layer Architecture)

### 2.2.1. Layer 0 — Infrastructure Layer

- Nền tảng hạ tầng cho các blockchain: mạng P2P, giao thức internet
- Ví dụ: Polkadot (Relay Chain), Cosmos (IBC), Avalanche (Primary Network)
- Vai trò: Cung cấp khả năng interoperability (tương tác liên chuỗi)

### 2.2.2. Layer 1 — Base Layer (Settlement Layer)

- Blockchain chính, xử lý đồng thuận và finality
- Đặc điểm: Bảo mật cao nhất, throughput giới hạn
- **Ethereum:**
  - Ngôn ngữ: Solidity
  - EVM (Ethereum Virtual Machine)
  - Gas fee, Block time ~12s
  - Hạn chế: ~15 TPS, phí cao
- **Solana:**
  - Ngôn ngữ: Rust, C, C++
  - SVM (Solana Virtual Machine)
  - Proof of History + Tower BFT
  - Ưu điểm: ~65,000 TPS, phí cực thấp (~$0.00025/tx)
  - Block time: ~400ms

> **Liên hệ dự án:** NEXUS sử dụng Solana Devnet như một Layer 1 blockchain

### 2.2.3. Layer 2 — Scaling Layer

- Giải pháp mở rộng xây dựng trên Layer 1
- Mục đích: Tăng throughput, giảm phí, giữ bảo mật từ L1
- **Các loại Layer 2:**

| Loại | Cơ chế | Ví dụ |
|------|--------|-------|
| Rollups (Optimistic) | Fraud proof, 7 ngày challenge | Optimism, Arbitrum |
| Rollups (ZK) | Validity proof, zero-knowledge | zkSync, StarkNet |
| Sidechains | Consensus riêng, bridge tới L1 | Polygon PoS |
| State Channels | Off-chain transactions | Lightning Network |
| Plasma | Child chains với fraud proof | OMG Network |

- **Polygon (được sử dụng trong dự án):**
  - Ban đầu là Matic Network (sidechain)
  - Hiện tại phát triển thành Polygon 2.0 với ZK rollups
  - Polygon Amoy Testnet (Chain ID: 80002) — testnet mới thay thế Mumbai
  - Native token: POL (trước đây MATIC)
  - EVM-compatible: chạy được smart contract Solidity
  - Tốc độ: ~2s block time, phí rất thấp

> **Liên hệ dự án:** NEXUS deploy smart contract trên Polygon Amoy (Layer 2 của Ethereum)

### 2.2.4. Layer 3 — Application Layer

- Ứng dụng phi tập trung (dApps) xây dựng trên L1/L2
- Ví dụ: DeFi (Uniswap), NFT Marketplace (OpenSea), GameFi (Axie Infinity)
- Giao tiếp với blockchain thông qua RPC, SDK, wallet adapter

> **Liên hệ dự án:** NEXUS là một dApp (Layer 3) chạy trên Solana (L1) và Polygon (L2)

## 2.3. Smart Contract

### 2.3.1. Khái niệm

- Hợp đồng thông minh: Code tự thực thi trên blockchain khi điều kiện thỏa mãn
- Đặc điểm: Tự động, minh bạch, bất biến (sau khi deploy)

### 2.3.2. Solidity và ERC-721

- **Solidity:** Ngôn ngữ bậc cao cho EVM, cú pháp giống JavaScript/C++
- **ERC-721:** Chuẩn Non-Fungible Token
  - Mỗi token có `tokenId` duy nhất
  - Interface chính: `ownerOf()`, `transferFrom()`, `approve()`, `safeTransferFrom()`
  - Extension: `ERC721URIStorage` — lưu metadata URI per token
- **OpenZeppelin:** Thư viện smart contract đã được audit, chuẩn hóa

### 2.3.3. SPL Token (Solana)

- Token Program trên Solana tương đương ERC-721 trên Ethereum
- NFT trên Solana = SPL Token với supply = 1, decimals = 0
- Metaplex Token Metadata Program: Lưu name, symbol, URI on-chain
- Associated Token Account (ATA): Account chứa token cho mỗi wallet

## 2.4. IPFS và Lưu trữ phi tập trung

### 2.4.1. IPFS (InterPlanetary File System)

- Hệ thống file phân tán, peer-to-peer
- Content-addressed: File được định danh bằng CID (Content Identifier = hash)
- Ưu điểm: Không thể sửa đổi (immutable), không single point of failure

### 2.4.2. Pinata

- Dịch vụ IPFS pinning: Đảm bảo file luôn available trên mạng IPFS
- API cho upload file + JSON metadata
- Gateway URL để truy cập: `https://gateway.pinata.cloud/ipfs/{CID}`

> **Liên hệ dự án:** NEXUS upload ảnh NFT và metadata JSON lên IPFS qua Pinata API

## 2.5. Wallet và Xác thực

### 2.5.1. Crypto Wallet

- Ví tiền mã hóa: Lưu trữ private key, ký giao dịch
- **Phantom:** Ví phổ biến cho Solana (Browser extension)
- **MetaMask:** Ví phổ biến cho EVM chains (Ethereum, Polygon)
- Wallet Adapter: SDK kết nối dApp với wallet (auto-detect)

### 2.5.2. Message Signing Authentication

- Xác thực không cần đăng nhập: User ký message bằng private key
- Server verify chữ ký bằng public key (ed25519 cho Solana)
- Không cần password, không cần server lưu credentials

## 2.6. Cross-Chain Bridge

### 2.6.1. Khái niệm

- Cầu nối blockchain: Cho phép chuyển tài sản giữa các blockchain khác nhau
- Vấn đề: Mỗi blockchain là hệ thống độc lập, không giao tiếp trực tiếp

### 2.6.2. Cơ chế hoạt động (Lock-and-Mint)

```
┌─────────────┐                    ┌─────────────┐
│  Chain A     │    Bridge API      │  Chain B     │
│  (Solana)    │ ◄───────────────► │  (Polygon)   │
│              │                    │              │
│  Lock/Burn   │                    │  Mint/Wrap   │
│  Original    │ ──── Message ────► │  Wrapped     │
│  NFT         │                    │  NFT         │
└─────────────┘                    └─────────────┘
```

- **Lock-and-Mint:** Khóa NFT trên chain nguồn → Mint wrapped NFT trên chain đích
- **Burn-and-Release:** Đốt wrapped NFT → Giải phóng NFT gốc

### 2.6.3. Thách thức

- Bảo mật: Bridge là mục tiêu tấn công lớn (Wormhole hack $320M, Ronin $625M)
- Finality: Thời gian xác nhận giao dịch khác nhau giữa các chain
- Trust model: Centralized relayer vs. Decentralized validators

## 2.7. Kiến trúc Hybrid (On-chain / Off-chain)

### 2.7.1. Mô hình kết hợp

- **On-chain:** Giao dịch tài sản (mint, transfer, payment) — bất biến, trustless
- **Off-chain (Supabase):** Metadata, listings, activities — linh hoạt, tốc độ cao
- Lý do: Chi phí on-chain cao, tốc độ chậm cho dữ liệu thay đổi thường xuyên

### 2.7.2. Supabase

- Nền tảng Backend-as-a-Service mã nguồn mở (PostgreSQL)
- Real-time subscriptions, Row Level Security (RLS)
- REST API tự động từ database schema

## 2.8. Các công nghệ Frontend liên quan

### 2.8.1. Next.js

- React framework với Server-Side Rendering (SSR) và App Router
- API Routes: Backend endpoints chạy serverless
- Tối ưu performance: Code splitting, image optimization

### 2.8.2. Wagmi & Viem

- **Wagmi:** React hooks cho EVM blockchain (connect, sign, send tx)
- **Viem:** TypeScript library thay thế ethers.js, type-safe, nhẹ

### 2.8.3. Solana Wallet Adapter

- React components & hooks cho Solana wallet integration
- Auto-detect installed wallets (Phantom, Solflare, Bitget...)
- Connection Provider + Wallet Provider pattern

---

# CHƯƠNG 3: PHÂN TÍCH CHƯƠNG TRÌNH

## 3.1. Kiến trúc tổng thể hệ thống

### 3.1.1. Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐│
│  │ Pages    │  │Components│  │  Hooks   │  │    Stores    ││
│  │ (App     │  │ (UI,NFT, │  │ (use*   │  │  (Zustand)   ││
│  │  Router) │  │ Auction) │  │  hooks)  │  │              ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘│
│       │              │             │                │        │
│  ┌────▼──────────────▼─────────────▼────────────────▼───────┐│
│  │              API Client Layer (src/lib/api.ts)           ││
│  └────────────────────────┬─────────────────────────────────┘│
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTP / Fetch
┌───────────────────────────▼──────────────────────────────────┐
│                   API ROUTES (src/app/api/)                   │
│  /nfts  /listings  /auctions  /activities  /collections      │
│  /upload  /bridge  /offers  /favorites  /stats               │
└───┬────────────────────┬──────────────────────┬──────────────┘
    │                    │                      │
    ▼                    ▼                      ▼
┌─────────┐      ┌──────────────┐      ┌───────────────┐
│Supabase │      │   Solana     │      │   Polygon     │
│(Postgres│      │   Devnet     │      │   Amoy        │
│  + RLS) │      │   (Layer 1)  │      │   (Layer 2)   │
└─────────┘      └──────────────┘      └───────────────┘
                         │                      │
                    ┌────▼──────────────────────▼────┐
                    │      IPFS (Pinata)             │
                    │  Images + JSON Metadata        │
                    └────────────────────────────────┘
```

### 3.1.2. Cấu trúc thư mục dự án

```
NFT-Marketplace/
├── contracts/                    # Smart Contracts (Solidity)
│   ├── NexusNFT.sol             # ERC-721 NFT Contract
│   ├── NexusBridge.sol          # Cross-chain Bridge Contract
│   └── NexusEscrow.sol          # Escrow cho Offers
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx             # Trang chủ (Homepage)
│   │   ├── layout.tsx           # Root layout + metadata
│   │   ├── providers.tsx        # Wallet + Query providers
│   │   ├── globals.css          # Design system (CSS variables)
│   │   ├── explore/             # Khám phá NFT
│   │   ├── create/              # Tạo NFT mới
│   │   ├── nft/[mint]/          # Chi tiết NFT
│   │   ├── auction/[id]/        # Chi tiết đấu giá
│   │   ├── auctions/            # Danh sách đấu giá
│   │   ├── collection/[slug]/   # Chi tiết bộ sưu tập
│   │   ├── collections/         # Danh sách bộ sưu tập
│   │   ├── profile/             # Hồ sơ người dùng
│   │   ├── activity/            # Lịch sử hoạt động
│   │   ├── stats/               # Thống kê marketplace
│   │   └── api/                 # Backend API Routes
│   │       ├── nfts/            # CRUD NFT
│   │       ├── listings/        # Quản lý listings
│   │       ├── auctions/        # Quản lý đấu giá
│   │       ├── activities/      # Log hoạt động
│   │       ├── collections/     # Quản lý bộ sưu tập
│   │       ├── offers/          # Quản lý offers
│   │       ├── bridge/          # Cross-chain bridge API
│   │       ├── upload/          # Upload ảnh + metadata
│   │       ├── favorites/       # Yêu thích
│   │       └── stats/           # Thống kê
│   │
│   ├── components/              # React Components
│   │   ├── layout/              # Header, Footer, Sidebar
│   │   ├── ui/                  # Button, Modal, Toast, ChainIcon
│   │   ├── nft/                 # NFT Card, NFT Detail
│   │   ├── auction/             # Auction components
│   │   └── collections/         # Collection components
│   │
│   ├── hooks/                   # Custom React Hooks
│   │   ├── useMarketplace.ts    # Logic mua/bán
│   │   ├── useMint.ts           # Logic tạo NFT
│   │   ├── useAuction.ts        # Logic đấu giá
│   │   ├── useOffer.ts          # Logic đề xuất mua
│   │   ├── useBridge.ts         # Logic bridge cross-chain
│   │   ├── useCollections.ts    # Logic quản lý collections
│   │   ├── useBalance.ts        # Số dư ví
│   │   ├── useChainWallet.ts    # Multi-chain wallet
│   │   ├── useFavorites.ts      # Yêu thích
│   │   └── useData.ts           # Data fetching
│   │
│   ├── lib/                     # Thư viện & utilities
│   │   ├── solana/              # Solana integration
│   │   │   ├── connection.ts    # RPC connection, helpers
│   │   │   ├── mint.ts          # Mint SPL NFT (Metaplex)
│   │   │   ├── marketplace.ts   # List, Buy, Cancel, Transfer
│   │   │   └── auction.ts       # Create, Bid, Settle auction
│   │   ├── polygon/             # Polygon integration
│   │   │   ├── config.ts        # Wagmi config, chain definition
│   │   │   ├── abi.ts           # Contract ABI definitions
│   │   │   ├── connection.ts    # Polygon connection
│   │   │   ├── mint.ts          # Mint ERC-721 NFT
│   │   │   └── marketplace.ts   # List, Buy, Transfer
│   │   ├── ipfs/
│   │   │   └── upload.ts        # IPFS types & URL helpers
│   │   ├── abi/                 # Contract ABI JSON files
│   │   ├── api.ts               # API client functions
│   │   ├── auth.ts              # Wallet signature verification
│   │   ├── constants.ts         # App constants
│   │   ├── cloudinary.ts        # Image CDN integration
│   │   └── supabase.ts          # Supabase client
│   │
│   ├── store/                   # Zustand state management
│   │   ├── useChainStore.ts     # Active chain selection
│   │   ├── useMarketplaceStore.ts # Marketplace state
│   │   ├── useThemeStore.ts     # Dark/light theme
│   │   └── useToastStore.ts     # Toast notifications
│   │
│   └── types/                   # TypeScript type definitions
│       ├── chain.tsx            # ChainId, ChainConfig
│       ├── nft.ts               # NFT, NFTMetadata, NFTFilter
│       ├── collection.ts        # Collection, CollectionStats
│       ├── auction.ts           # Auction, Bid
│       ├── offer.ts             # Offer types
│       └── activity.ts          # Activity types
│
├── supabase/                    # Database
│   ├── schema.sql               # Main schema
│   ├── create_tables.sql        # Extended tables (collections, offers, favorites)
│   ├── setup_rls.sql            # Row Level Security policies
│   └── migration-phase1.sql     # Migration scripts
│
├── scripts/                     # Deploy & maintenance scripts
│   ├── deploy.cjs               # Deploy NexusNFT contract
│   ├── deploy-bridge.cjs        # Deploy NexusBridge contract
│   ├── deploy-escrow.cjs        # Deploy NexusEscrow contract
│   └── fix-stuck-offers.cjs     # Maintenance script
│
├── __tests__/                   # Test files
├── hardhat.config.cjs           # Hardhat config (Solidity compiler)
├── package.json                 # Dependencies & scripts
└── next.config.ts               # Next.js configuration
```

## 3.2. Smart Contracts (On-chain)

### 3.2.1. NexusNFT.sol — Contract Mint NFT

- **File:** `contracts/NexusNFT.sol`
- **Chuẩn:** ERC-721 + ERC721URIStorage (OpenZeppelin v5)
- **Solidity version:** 0.8.28 (EVM target: Cancun)
- **Network:** Polygon Amoy Testnet (Chain ID: 80002)
- **Chức năng:**

| Hàm | Mô tả |
|-----|--------|
| `safeMint(address to, string uri)` | Mint NFT mới, gán metadata URI (IPFS), trả về tokenId |
| `totalSupply()` | Trả về tổng số NFT đã mint |
| `tokenURI(uint256 tokenId)` | Trả về metadata URI của NFT |
| `ownerOf(uint256 tokenId)` | Trả về chủ sở hữu on-chain |

- **Đặc điểm:**
  - `_nextTokenId`: Counter auto-increment cho token ID
  - Kế thừa `Ownable`: Contract có owner (deployer)
  - Open minting (ai cũng mint được) — phù hợp demo testnet

### 3.2.2. NexusBridge.sol — Contract Bridge Cross-chain

- **File:** `contracts/NexusBridge.sol`
- **Mục đích:** Wrap NFT từ chain khác (Solana) sang Polygon dưới dạng ERC-721
- **Cơ chế Lock-and-Mint:**

```
Solana NFT → signMessage (lock proof) → API → bridgeMint() → Wrapped ERC-721
Wrapped ERC-721 → bridgeBurn() → API → Release on Solana
```

- **Dữ liệu lưu trữ:**
  - `BridgeInfo`: `originalMint` (Solana address), `originalChain`, `bridgedAt`
  - `_mintToTokenId`: Mapping từ original mint hash → tokenId (chống trùng lặp)
  - `_activeBridge`: Tracking trạng thái bridge đang active
- **Chức năng chính:**

| Hàm | Mô tả |
|-----|--------|
| `bridgeMint(to, uri, originalMint, originalChain)` | Mint wrapped NFT, lưu bridge info |
| `bridgeBurn(tokenId)` | Burn wrapped NFT, giải phóng về chain gốc |
| `getBridgeInfo(tokenId)` | Xem thông tin bridge |
| `isActiveBridge(originalMint)` | Kiểm tra NFT đang được bridge |
| `getTokenIdByMint(originalMint)` | Tìm tokenId từ mint address gốc |

- **Events:** `BridgeMinted`, `BridgeBurned` — dùng để tracking

### 3.2.3. NexusEscrow.sol — Contract Escrow cho Offers

- **File:** `contracts/NexusEscrow.sol`
- **Mục đích:** Khóa tiền POL trong escrow khi người mua đề xuất mua NFT
- **Luồng hoạt động:**

```
Buyer createOffer() + gửi POL → Funds locked in Escrow
  ├── Seller acceptOffer() → POL chuyển cho Seller
  ├── Buyer cancelOffer() → POL hoàn trả Buyer
  └── Seller rejectOffer() → POL hoàn trả Buyer
```

- **Chức năng chính:**

| Hàm | Mô tả |
|-----|--------|
| `createOffer(nftContract, tokenId, seller)` | Tạo offer, gửi POL vào escrow |
| `acceptOffer(offerId)` | Seller chấp nhận, nhận POL |
| `cancelOffer(offerId)` | Buyer hủy, hoàn POL |
| `rejectOffer(offerId)` | Seller từ chối, hoàn POL |

- **Bảo mật:**
  - `ReentrancyGuard`: Chống reentrancy attack
  - `_activeOfferKeys`: Chống duplicate offers từ cùng buyer
  - Kiểm tra `OfferStatus.Active` trước mọi thao tác

## 3.3. Cơ sở dữ liệu (Off-chain — Supabase)

### 3.3.1. Sơ đồ ERD (Entity Relationship)

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│   nfts   │      │ listings │      │ auctions │
│──────────│      │──────────│      │──────────│
│ id (PK)  │      │ id (PK)  │      │ id (PK)  │
│ mint (UQ)│◄────►│ mint     │      │ nft_mint │
│ name     │      │ seller   │      │ seller   │
│ owner    │      │ price    │      │ start_price│
│ creator  │      │ active   │      │ current_bid│
│ image    │      │ listed_at│      │ end_time │
│ listed   │      └──────────┘      │ status   │
│ price    │                        └─────┬────┘
│ chain    │                              │
│ token_id │                        ┌─────▼────┐
│ contract │                        │  bids    │
└──────┬───┘                        │──────────│
       │                            │ id (PK)  │
       │                            │ auction_id (FK)│
       │                            │ bidder   │
  ┌────▼─────┐                      │ amount   │
  │activities│                      └──────────┘
  │──────────│
  │ id (PK)  │      ┌────────────┐  ┌──────────┐
  │ type     │      │collections │  │ offers   │
  │ nft_mint │      │────────────│  │──────────│
  │ from_addr│      │ id (PK)    │  │ id (PK)  │
  │ to_addr  │      │ slug (UQ)  │  │ nft_mint │
  │ price    │      │ name       │  │ buyer    │
  │ tx_sig   │      │ owner      │  │ seller   │
  └──────────┘      │ category   │  │ amount   │
                    │ chain      │  │ status   │
                    │ theme_color│  │ escrow_id│
                    └────────────┘  └──────────┘
```

### 3.3.2. Các bảng chính

| Bảng | Mô tả | Số cột |
|------|--------|--------|
| `nfts` | Thông tin NFT: mint, name, owner, image, chain, tokenId | 15+ |
| `listings` | Danh sách NFT đang bán: mint, seller, price, active | 6 |
| `auctions` | Phiên đấu giá: starting_price, current_bid, end_time, status | 9 |
| `bids` | Lịch sử đặt giá: auction_id (FK), bidder, amount | 5 |
| `activities` | Log hoạt động: type (mint/list/buy/bridge...), price, tx | 10 |
| `collections` | Bộ sưu tập: name, slug, owner, category, chain, stats | 15+ |
| `offers` | Đề xuất mua: buyer, seller, amount, status, escrow_id | 10+ |
| `favorites` | Yêu thích: wallet, nft_mint | 4 |

### 3.3.3. Row Level Security (RLS)

- Mọi bảng đều bật RLS
- Policies: Public read + write (dùng anon key cho demo)
- Trong production: Nên restrict write dựa trên wallet authentication

### 3.3.4. Indexes tối ưu

```sql
idx_nfts_owner        -- Truy vấn NFT theo chủ sở hữu
idx_nfts_creator      -- Truy vấn NFT theo người tạo
idx_listings_active   -- Partial index: chỉ listings active = true
idx_listings_seller   -- Truy vấn listing theo seller
idx_auctions_status   -- Filter auction theo trạng thái
idx_bids_auction      -- Lấy bids của một auction
idx_activities_type   -- Filter activity theo loại
idx_activities_created -- Sort activity theo thời gian (DESC)
```

## 3.4. Tầng Blockchain Integration (src/lib/)

### 3.4.1. Solana Integration

- **connection.ts:** RPC connection management
  - `getConnection()`: Tạo connection tới Solana Devnet
  - `requestAirdrop()`: Nhận SOL test (3 chiến lược fallback)
  - Utility: `shortenAddress()`, `formatSOL()`, `timeAgo()`

- **mint.ts:** Mint SPL Token NFT
  - Tạo mint keypair mới
  - Tạo mint account (82 bytes, 0 decimals = NFT)
  - Tạo Associated Token Account (ATA)
  - Mint 1 token
  - Gọi Metaplex `CreateMetadataAccountV3` — tạo metadata on-chain
  - Transaction gồm 5 instructions, cần 2 signatures (payer + mint keypair)

- **marketplace.ts:** Giao dịch mua bán
  - `listNFT()`: Sign message proof-of-intent (không lock NFT)
  - `buyNFT()`: Transaction gồm SOL transfer (buyer→seller) + tạo ATA cho buyer
  - `cancelListing()`: Sign message hủy listing
  - `transferNFT()`: SPL token transfer giữa 2 wallet

- **auction.ts:** Hệ thống đấu giá
  - `createAuction()`: Sign message tạo phiên đấu giá
  - `placeBid()`: Sign message cam kết bid (không lock SOL — an toàn cho bidder)
  - `settleAuction()`: Winner trả SOL → Seller xác nhận → Update database

### 3.4.2. Polygon Integration

- **config.ts:** Wagmi configuration
  - Custom chain definition cho Polygon Amoy (ID: 80002, native: POL)
  - `wagmiConfig`: createConfig với injected connector (MetaMask)
  - `ensurePolygonChain()`: Tự động switch network nếu user đang sai chain

- **abi.ts:** ABI definitions cho NexusNFT contract
  - Export `NEXUS_NFT_ABI`: Interface gọi smart contract từ frontend

- **mint.ts:** Mint ERC-721 NFT
  - Gọi `safeMint(to, tokenURI)` on-chain
  - Extract `tokenId` từ Transfer event log
  - Gas overrides: `maxFeePerGas: 30 gwei`, `gas: 500,000`

- **marketplace.ts:** Giao dịch mua bán
  - `verifyTokenOwnership()`: Kiểm tra on-chain ownership trước khi thao tác
  - `listNFTPolygon()`: Gọi `setApprovalForAll()` on-chain
  - `buyNFTPolygon()`: Send POL payment + database update
  - `transferNFTPolygon()`: `transferFrom()` on-chain

### 3.4.3. IPFS Integration

- **upload.ts:** Types và helper functions
- Upload thực sự qua API route `/api/upload` (server-side)
  - Upload image → Pinata API → trả về CID
  - Upload metadata JSON → Pinata API → trả về CID
  - `getIPFSUrl(hash)`: Convert CID thành gateway URL

### 3.4.4. Authentication (auth.ts)

- `verifyWalletSignature()`: Verify ed25519 signature (tweetnacl)
- `createAuthMessage()`: Tạo message với nonce + timestamp
- `authenticateRequest()`: Extract + validate headers (x-wallet-address, x-wallet-signature)
- Backward compatible: Cho phép unauthenticated requests

## 3.5. Custom Hooks — Business Logic Layer

### 3.5.1. useMarketplace — Mua/Bán NFT

- Xử lý multi-chain: Tự động chọn Solana hoặc Polygon logic dựa trên `nft.chain`
- `handleListNFT()`: Sign + API create listing + activity log
- `handleBuyNFT()`: Payment on-chain + API update owner + activity log
- `handleCancelListing()`: Sign + API delete listing

### 3.5.2. useMint — Tạo NFT

- Upload image → Upload metadata → Mint on-chain → Save to DB
- Solana: SPL Token + Metaplex metadata
- Polygon: ERC-721 safeMint + tokenURI

### 3.5.3. useAuction — Đấu giá

- `handleCreateAuction()`: Sign + API create auction
- `handlePlaceBid()`: Sign commitment + API record bid
- `handleSettleAuction()`: Role-based (winner pays SOL, seller confirms)

### 3.5.4. useOffer — Đề xuất mua (Polygon only)

- `handleCreateOffer()`: Gọi `NexusEscrow.createOffer()` → lock POL on-chain
- `handleAcceptOffer()`: Seller gọi `acceptOffer()` → nhận POL
- `handleCancelOffer()`: Buyer gọi `cancelOffer()` → hoàn POL

### 3.5.5. useBridge — Cross-chain Bridge

- **Luồng Solana → Polygon:**
  1. `signMessage()` trên Solana (proof of lock)
  2. Gọi `/api/bridge` → update database
  3. `bridgeMint()` trên Polygon smart contract → tạo wrapped ERC-721
- **Luồng Polygon → Solana:**
  1. `bridgeBurn()` trên Polygon smart contract
  2. Gọi `/api/bridge` → update database
  3. Update ownership trên Solana (simulated)
- **Step tracking:** idle → confirming → locking → bridging → minting → complete

## 3.6. State Management (Zustand)

### 3.6.1. useChainStore

- Lưu `activeChain: ChainId` (solana | polygon)
- Người dùng có thể switch giữa 2 chain
- Ảnh hưởng tới toàn bộ data fetching và transaction logic

### 3.6.2. useMarketplaceStore

- `listings`, `nfts`: Cached data từ API
- `filters`: Search, sort, category, price range
- `loading`, `error`: UI states

### 3.6.3. useToastStore

- Notification system: success, error, info, warning
- Queue-based, auto-dismiss

## 3.7. API Routes (Backend)

### 3.7.1. Danh sách Endpoints

| Route | Method | Mô tả |
|-------|--------|--------|
| `/api/nfts` | GET | Lấy danh sách NFT (filter: owner, creator, collection, chain) |
| `/api/nfts` | POST | Tạo NFT mới trong DB |
| `/api/nfts` | PATCH | Cập nhật NFT (owner, listed, price) |
| `/api/listings` | GET/POST/DELETE | CRUD marketplace listings |
| `/api/auctions` | GET/POST | Danh sách & tạo auction |
| `/api/auctions/[id]/bid` | POST | Đặt bid |
| `/api/auctions/[id]/settle` | POST | Kết thúc auction |
| `/api/activities` | GET/POST | Activity feed |
| `/api/collections` | GET/POST | CRUD collections |
| `/api/collections/[id]` | GET/PATCH/DELETE | Collection detail |
| `/api/collections/[id]/nfts` | POST/DELETE | Thêm/xóa NFT khỏi collection |
| `/api/collections/[id]/transfer` | POST | Chuyển quyền collection |
| `/api/offers` | GET/POST/PATCH | Quản lý offers |
| `/api/bridge` | POST | Bridge cross-chain |
| `/api/upload` | POST | Upload image (Pinata/Cloudinary) |
| `/api/upload/metadata` | POST | Upload metadata JSON |
| `/api/favorites` | GET/POST/DELETE | Quản lý yêu thích |
| `/api/stats` | GET | Thống kê marketplace |

### 3.7.2. Tích hợp Supabase

- Mỗi API route sử dụng `@supabase/supabase-js` client
- CRUD operations: `.select()`, `.insert()`, `.update()`, `.delete()`
- Filter & search: `.ilike()`, `.eq()`, `.gte()`, `.order()`, `.limit()`

## 3.8. Giao diện người dùng (Frontend)

### 3.8.1. Trang chủ (page.tsx)

- Hero section với animated gradients
- Featured NFTs carousel
- Trending Collections
- Live auctions preview
- Activity feed
- Stats overview

### 3.8.2. Explore (/explore)

- Grid hiển thị tất cả NFT đang bán
- Filter: Chain, Category, Price range
- Sort: Price, Newest, Name
- Search bar
- Infinite scroll hoặc pagination

### 3.8.3. Create (/create)

- Form tạo NFT:
  - Upload ảnh → Preview
  - Name, Description, Symbol
  - Attributes (key-value pairs)
  - Chọn Collection
  - Chọn Chain (Solana / Polygon)
- Progress steps: Upload → Mint → Save → Done

### 3.8.4. NFT Detail (/nft/[mint])

- Ảnh NFT lớn + metadata
- Owner & Creator info (clickable → profile)
- Price + Buy/List buttons
- Offer section (Polygon: on-chain escrow)
- Bridge section (chuyển cross-chain)
- Activity history cho NFT này
- Attributes display

### 3.8.5. Auction (/auction/[id])

- Countdown timer (end_time)
- Current bid + bid history
- Place bid form (min increment validation)
- Settle button (khi auction kết thúc)

### 3.8.6. Profile (/profile)

- Wallet address + balance (SOL/POL)
- Tabs: Owned NFTs, Created, Listed, Favorites
- Chain filter

### 3.8.7. Collections (/collections, /collection/[slug])

- Collection list với stats (floor price, volume, items, owners)
- Collection detail: Banner, Logo, NFT grid
- Management: Add/Remove NFTs, Edit, Transfer ownership

## 3.9. Providers & Multi-chain Architecture

### 3.9.1. Provider Stack (providers.tsx)

```
ThemeProvider (next-themes)
  └─ QueryClientProvider (TanStack Query)
       └─ WagmiProvider (Polygon/EVM)
            └─ ConnectionProvider (Solana RPC)
                 └─ WalletProvider (Solana Wallets)
                      └─ WalletModalProvider (Solana UI)
                           └─ {children}
```

- **Dual wallet system:** Solana Wallet Adapter + Wagmi cho Polygon
- **Auto-detect wallets:** Empty array → detect all Wallet Standard wallets
- **Query caching:** staleTime: 30s, gcTime: 60s, retry: 1

### 3.9.2. Chain Configuration (types/chain.tsx)

- 2 chain được hỗ trợ: `solana` (Devnet) và `polygon` (Amoy)
- Mỗi chain có: id, name, symbol, currency, decimals, RPC URL, explorer URL, faucet URL, icon, color
- Helper functions: `getChainConfig()`, `getChainExplorerUrl()`, `formatChainCurrency()`

## 3.10. Quy trình Deploy

### 3.10.1. Smart Contract Deployment

- **Tool:** Hardhat v2.28
- **Config:** `hardhat.config.cjs` — Solidity 0.8.28, optimizer 200 runs
- **Scripts:**
  - `npm run deploy:amoy` → Deploy NexusNFT trên Polygon Amoy
  - `npm run deploy:bridge` → Deploy NexusBridge trên Polygon Amoy
- **Verification:** Contract address lưu trong `.env.local`

### 3.10.2. Frontend Deployment

- `npm run build` → Next.js production build
- `npm run start` → Start production server
- Hoặc deploy lên Vercel (recommended)

## 3.11. Testing

- **Framework:** Vitest + React Testing Library + jsdom
- **Chạy test:** `npm test` hoặc `npm run test:coverage`
- Unit tests cho lib functions, hooks, components
- Smart contract tests qua Hardhat test framework

## 3.12. Bảo mật

### 3.12.1. Các biện pháp bảo mật đã triển khai

| Biện pháp | Chi tiết |
|-----------|----------|
| ReentrancyGuard | NexusEscrow.sol — chống reentrancy attack |
| Wallet Signature Auth | ed25519 verify cho Solana, ECDSA cho Polygon |
| Server-side API Keys | Pinata, Cloudinary keys chỉ ở server (.env.local) |
| On-chain Ownership Verify | `verifyTokenOwnership()` trước mỗi transaction |
| Duplicate Prevention | `_activeOfferKeys`, `_activeBridge` mappings |
| Input Validation | API routes validate input trước khi xử lý |
| RLS (Row Level Security) | Supabase RLS trên tất cả bảng |

### 3.12.2. Hạn chế (trong phạm vi demo)

- RLS policies quá permissive (public write)
- Bridge relayer là centralized (API server)
- Không có rate limiting trên API routes
- Testnet only — chưa audit cho mainnet

---

# KẾT LUẬN

## Kết quả đạt được

- Xây dựng thành công NFT Marketplace multi-chain (Solana + Polygon)
- 3 Smart Contract (NexusNFT, NexusBridge, NexusEscrow) deploy trên Polygon Amoy
- Tích hợp đầy đủ: Mint, List, Buy, Auction, Offer, Bridge, Collections
- Giao diện hiện đại responsive với Next.js 16 + Tailwind CSS v4
- Kiến trúc hybrid on-chain/off-chain hiệu quả
- Cross-chain bridge Solana ↔ Polygon hoạt động

## Hạn chế

- Chưa deploy mainnet
- Bridge là centralized (cần decentralized relayer)
- Chưa có royalty enforcement on-chain
- RLS policies cần strengthen cho production

## Hướng phát triển

- Deploy lên mainnet (Solana Mainnet + Polygon Mainnet)
- Thêm nhiều blockchain (Ethereum L1, Arbitrum, Base)
- Decentralized bridge với validator network
- On-chain royalty enforcement (ERC-2981)
- Mobile app (React Native)
- DAO governance cho marketplace

---

# TÀI LIỆU THAM KHẢO (Gợi ý)

1. Satoshi Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System", 2008
2. Vitalik Buterin, "Ethereum Whitepaper", 2014
3. Solana Foundation, "Solana: A new architecture for a high performance blockchain", 2020
4. Polygon (Matic) Network Whitepaper
5. OpenZeppelin Documentation — ERC-721 Standard
6. Metaplex Token Metadata Standard
7. IPFS Documentation — Content-Addressed Storage
8. Next.js Documentation — App Router
9. Supabase Documentation — PostgreSQL + RLS
10. Wagmi Documentation — React Hooks for Ethereum
11. Hardhat Documentation — Ethereum Development Environment

---

# PHỤ LỤC (Gợi ý)

- **Phụ lục A:** Mã nguồn Smart Contract (NexusNFT.sol, NexusBridge.sol, NexusEscrow.sol)
- **Phụ lục B:** Database Schema SQL
- **Phụ lục C:** Screenshots giao diện ứng dụng
- **Phụ lục D:** Hướng dẫn cài đặt và chạy dự án

---

> **Ghi chú:** File này là dàn ý chi tiết. Khi viết báo cáo Word, cần bổ sung thêm:
> - Hình ảnh minh họa (screenshots, diagrams)
> - Giải thích chi tiết hơn cho từng đoạn code quan trọng
> - So sánh với các marketplace khác (OpenSea, Magic Eden)
> - Đánh giá hiệu năng và trải nghiệm người dùng
