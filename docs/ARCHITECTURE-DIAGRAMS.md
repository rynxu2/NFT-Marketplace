# NEXUS NFT Marketplace — Sơ Đồ Kiến Trúc & Cấu Trúc Thư Mục

> Tài liệu phục vụ báo cáo Word — Phiên bản hiện tại (không bao gồm Bridge)

---

## 1. Sơ Đồ Kiến Trúc Tổng Quan Hệ Thống

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client - Trình Duyệt"]
        UI["Next.js 16 App Router<br/>React 19 + Tailwind CSS v4"]
        WALLET_SOL["Solana Wallet Adapter<br/>(Phantom, Bitget, ...)"]
        WALLET_POLY["Wagmi / MetaMask<br/>(EVM Wallet)"]
    end

    subgraph FRONTEND["⚛️ Frontend Layer"]
        PAGES["Pages<br/>(App Router)"]
        COMPONENTS["Components<br/>(UI, NFT, Auction, Collection, Layout)"]
        HOOKS["Custom Hooks<br/>(useMarketplace, useMint, useAuction,<br/>useOffer, useData, useCollections, ...)"]
        STORE["Zustand Store<br/>(Chain, Marketplace, Theme, Toast)"]
    end

    subgraph API_LAYER["🔌 API Routes Layer (Next.js)"]
        API_NFTS["/api/nfts"]
        API_LISTINGS["/api/listings"]
        API_AUCTIONS["/api/auctions"]
        API_OFFERS["/api/offers"]
        API_ACTIVITIES["/api/activities"]
        API_STATS["/api/stats"]
        API_COLLECTIONS["/api/collections"]
        API_FAVORITES["/api/favorites"]
        API_UPLOAD["/api/upload"]
    end

    subgraph BLOCKCHAIN["⛓️ Blockchain Layer"]
        SOLANA["Solana Devnet<br/>(Metaplex, SPL Token)"]
        POLYGON["Polygon Amoy Testnet<br/>(NexusNFT, NexusEscrow,<br/>NexusCollectionSale)"]
    end

    subgraph STORAGE["💾 Storage Layer"]
        SUPABASE["Supabase<br/>(PostgreSQL + RLS)"]
        IPFS["IPFS / Cloudinary<br/>(File Upload)"]
    end

    UI --> PAGES
    WALLET_SOL --> HOOKS
    WALLET_POLY --> HOOKS
    PAGES --> COMPONENTS
    PAGES --> HOOKS
    HOOKS --> STORE
    HOOKS --> API_LAYER

    API_NFTS --> SUPABASE
    API_LISTINGS --> SUPABASE
    API_AUCTIONS --> SUPABASE
    API_OFFERS --> SUPABASE
    API_ACTIVITIES --> SUPABASE
    API_STATS --> SUPABASE
    API_COLLECTIONS --> SUPABASE
    API_FAVORITES --> SUPABASE
    API_UPLOAD --> IPFS

    HOOKS -->|"Solana TX"| SOLANA
    HOOKS -->|"EVM TX"| POLYGON
    SOLANA -.->|"Xác nhận TX"| HOOKS
    POLYGON -.->|"Xác nhận TX"| HOOKS

    style CLIENT fill:#1a1a2e,stroke:#e94560,color:#fff
    style FRONTEND fill:#16213e,stroke:#0f3460,color:#fff
    style API_LAYER fill:#0f3460,stroke:#533483,color:#fff
    style BLOCKCHAIN fill:#1b1b2f,stroke:#e94560,color:#fff
    style STORAGE fill:#162447,stroke:#1f4068,color:#fff
```

---

## 2. Sơ Đồ Luồng Dữ Liệu (Data Flow)

```mermaid
flowchart LR
    subgraph USER["👤 Người Dùng"]
        BROWSER["Trình Duyệt"]
    end

    subgraph FRONTEND["Frontend"]
        PAGE["Pages"]
        HOOK["Hooks"]
        STATE["Zustand Store"]
    end

    subgraph BACKEND["Backend API"]
        ROUTE["API Routes"]
    end

    subgraph DB["Database"]
        SUPA["Supabase<br/>PostgreSQL"]
    end

    subgraph CHAIN["Blockchain"]
        SOL["Solana"]
        POLY["Polygon"]
    end

    subgraph FILE["File Storage"]
        CLOUD["Cloudinary /<br/>IPFS"]
    end

    BROWSER -->|"1. Tương tác UI"| PAGE
    PAGE -->|"2. Gọi Hook"| HOOK
    HOOK -->|"3a. Gọi API"| ROUTE
    HOOK -->|"3b. Gửi TX"| SOL
    HOOK -->|"3b. Gửi TX"| POLY
    ROUTE -->|"4. CRUD"| SUPA
    ROUTE -->|"4. Upload"| CLOUD
    SUPA -->|"5. Dữ liệu"| ROUTE
    ROUTE -->|"6. Response"| HOOK
    HOOK -->|"7. Cập nhật"| STATE
    STATE -->|"8. Re-render"| PAGE

    style USER fill:#e94560,stroke:#fff,color:#fff
    style FRONTEND fill:#0f3460,stroke:#fff,color:#fff
    style BACKEND fill:#533483,stroke:#fff,color:#fff
    style DB fill:#1f4068,stroke:#fff,color:#fff
    style CHAIN fill:#e94560,stroke:#fff,color:#fff
    style FILE fill:#16213e,stroke:#fff,color:#fff
```

---

## 3. Sơ Đồ Kiến Trúc Multi-Chain

```mermaid
graph TB
    subgraph APP["Ứng Dụng NEXUS"]
        SWITCH["ChainSwitcher<br/>(Chuyển đổi chain)"]
        CHAIN_STORE["useChainStore<br/>(Zustand)"]
    end

    subgraph SOLANA_STACK["🟣 Solana Stack"]
        SOL_WALLET["Solana Wallet Adapter"]
        SOL_CONN["connection.ts<br/>(RPC Endpoint)"]
        SOL_MINT["mint.ts<br/>(Metaplex UMI)"]
        SOL_MARKET["marketplace.ts<br/>(Transfer SPL)"]
        SOL_AUCTION["auction.ts"]
        SOL_COLL["collection-sale.ts"]
    end

    subgraph POLYGON_STACK["🔷 Polygon Stack"]
        POLY_WALLET["Wagmi + MetaMask"]
        POLY_CONN["connection.ts<br/>(Viem Client)"]
        POLY_MINT["mint.ts<br/>(NexusNFT Contract)"]
        POLY_MARKET["marketplace.ts<br/>(NexusEscrow Contract)"]
        POLY_ABI["abi.ts<br/>(Contract ABI)"]
        POLY_COLL["collection-sale.ts<br/>(NexusCollectionSale)"]
    end

    subgraph CONTRACTS["📜 Smart Contracts (Solidity)"]
        C1["NexusNFT.sol<br/>(ERC-721 Mint)"]
        C2["NexusEscrow.sol<br/>(List / Buy / Offer)"]
        C3["NexusCollectionSale.sol<br/>(Collection Sale)"]
    end

    SWITCH --> CHAIN_STORE
    CHAIN_STORE -->|"solana"| SOLANA_STACK
    CHAIN_STORE -->|"polygon-amoy"| POLYGON_STACK

    SOL_WALLET --> SOL_CONN
    SOL_CONN --> SOL_MINT
    SOL_CONN --> SOL_MARKET
    SOL_CONN --> SOL_AUCTION
    SOL_CONN --> SOL_COLL

    POLY_WALLET --> POLY_CONN
    POLY_CONN --> POLY_MINT
    POLY_CONN --> POLY_MARKET
    POLY_CONN --> POLY_COLL
    POLY_ABI --> POLY_MINT
    POLY_ABI --> POLY_MARKET

    POLY_MINT -.-> C1
    POLY_MARKET -.-> C2
    POLY_COLL -.-> C3

    style APP fill:#1a1a2e,stroke:#e94560,color:#fff
    style SOLANA_STACK fill:#2d1b69,stroke:#9945ff,color:#fff
    style POLYGON_STACK fill:#1b2838,stroke:#8247e5,color:#fff
    style CONTRACTS fill:#0f3460,stroke:#00d2ff,color:#fff
```

---

## 4. Sơ Đồ Cơ Sở Dữ Liệu (ERD)

```mermaid
erDiagram
    nfts {
        TEXT mint PK "Địa chỉ mint (PK)"
        TEXT name "Tên NFT"
        TEXT symbol "Ký hiệu (CYBER)"
        TEXT description "Mô tả"
        TEXT image "URL hình ảnh"
        TEXT owner "Địa chỉ sở hữu"
        TEXT creator "Địa chỉ tạo"
        NUMERIC price "Giá niêm yết"
        BOOLEAN listed "Đang bán?"
        TEXT collection "Tên bộ sưu tập"
        TEXT collection_slug "Slug bộ sưu tập"
        JSONB attributes "Thuộc tính"
        TEXT metadata_uri "URI metadata"
        TEXT tx_signature "Chữ ký TX"
        TEXT chain "Chain (solana/polygon-amoy)"
        TEXT token_id "Token ID (EVM)"
        TEXT contract_address "Địa chỉ contract (EVM)"
        TIMESTAMPTZ created_at "Thời gian tạo"
    }

    listings {
        UUID id PK "ID listing"
        TEXT mint FK "Mint NFT"
        TEXT seller "Địa chỉ người bán"
        NUMERIC price "Giá bán"
        BOOLEAN active "Đang hoạt động?"
        TEXT tx_signature "Chữ ký TX"
        TEXT chain "Chain"
        TIMESTAMPTZ listed_at "Thời gian đăng"
    }

    auctions {
        UUID id PK "ID phiên đấu giá"
        TEXT nft_mint FK "Mint NFT"
        TEXT seller "Người bán"
        NUMERIC starting_price "Giá khởi điểm"
        NUMERIC current_bid "Giá bid hiện tại"
        TEXT highest_bidder "Người bid cao nhất"
        NUMERIC min_bid_increment "Bước giá tối thiểu"
        TIMESTAMPTZ start_time "Thời gian bắt đầu"
        TIMESTAMPTZ end_time "Thời gian kết thúc"
        TEXT status "Trạng thái (active/ended/settled)"
        TEXT chain "Chain"
    }

    bids {
        UUID id PK "ID bid"
        UUID auction_id FK "ID phiên đấu giá"
        TEXT bidder "Người đặt bid"
        NUMERIC amount "Số tiền"
        TEXT tx_signature "Chữ ký TX"
        TIMESTAMPTZ created_at "Thời gian"
    }

    activities {
        UUID id PK "ID hoạt động"
        TEXT type "Loại (mint/list/sale/bid/offer/...)"
        TEXT nft_mint FK "Mint NFT"
        TEXT nft_name "Tên NFT"
        TEXT nft_image "Hình NFT"
        TEXT from_address "Địa chỉ gửi"
        TEXT to_address "Địa chỉ nhận"
        NUMERIC price "Giá"
        TEXT tx_signature "Chữ ký TX"
        TEXT collection "Bộ sưu tập"
        TEXT chain "Chain"
        TIMESTAMPTZ created_at "Thời gian"
    }

    nfts ||--o{ listings : "có nhiều listing"
    nfts ||--o{ auctions : "có nhiều phiên đấu giá"
    nfts ||--o{ activities : "có nhiều hoạt động"
    auctions ||--o{ bids : "có nhiều bid"
```

---

## 5. Sơ Đồ Component (Frontend)

```mermaid
graph TB
    subgraph ROOT["🏠 App Root"]
        LAYOUT["layout.tsx<br/>(RootLayout)"]
        PROVIDERS["providers.tsx<br/>(ThemeProvider, WagmiProvider,<br/>SolanaWalletProvider, QueryClient)"]
    end

    subgraph LAYOUT_COMP["📐 Layout Components"]
        HEADER["Header.tsx<br/>(Navigation, Logo, Search)"]
        FOOTER["Footer.tsx<br/>(Links, Copyright)"]
        CHAIN_SW["ChainSwitcher.tsx<br/>(Solana ↔ Polygon)"]
        WALLET_BTN["ChainWalletButton.tsx<br/>(Connect Wallet)"]
        WALLET_MODAL["WalletPickerModal.tsx<br/>(Chọn ví)"]
    end

    subgraph NFT_COMP["🖼️ NFT Components"]
        NFT_CARD["NFTCard.tsx<br/>(Thẻ NFT)"]
        NFT_GRID["NFTGrid.tsx<br/>(Lưới NFT)"]
        PRICE_CHART["PriceChart.tsx<br/>(Biểu đồ giá)"]
        TRANSFER["TransferModal.tsx<br/>(Chuyển NFT)"]
    end

    subgraph AUCTION_COMP["⏱️ Auction Components"]
        AUCTION_CARD["AuctionCard.tsx<br/>(Thẻ đấu giá)"]
        COUNTDOWN["Countdown.tsx<br/>(Đếm ngược)"]
    end

    subgraph COLL_COMP["📦 Collection Components"]
        COLL_CARD["CollectionCard.tsx"]
        COLL_BANNER["CollectionBanner.tsx"]
        COLL_MANAGE["CollectionManageForm.tsx"]
        COLL_PICKER["CollectionPicker.tsx"]
        BUY_COLL["BuyCollectionModal.tsx"]
        SELL_COLL["SellCollectionModal.tsx"]
    end

    subgraph UI_COMP["🎨 UI Components"]
        BADGE["Badge.tsx"]
        BUTTON["Button.tsx"]
        CARD["Card.tsx"]
        CHAIN_ICON["ChainIcon.tsx"]
        EMPTY["EmptyState.tsx"]
        INPUT["Input.tsx"]
        MODAL["Modal.tsx"]
        SKELETON["Skeleton.tsx"]
        TOAST["ToastProvider.tsx"]
    end

    LAYOUT --> PROVIDERS
    LAYOUT --> HEADER
    LAYOUT --> FOOTER
    HEADER --> CHAIN_SW
    HEADER --> WALLET_BTN
    WALLET_BTN --> WALLET_MODAL

    NFT_GRID --> NFT_CARD
    NFT_CARD --> CHAIN_ICON
    NFT_CARD --> BADGE
    AUCTION_CARD --> COUNTDOWN
    COLL_BANNER --> BUTTON

    style ROOT fill:#1a1a2e,stroke:#e94560,color:#fff
    style LAYOUT_COMP fill:#16213e,stroke:#0f3460,color:#fff
    style NFT_COMP fill:#0f3460,stroke:#533483,color:#fff
    style AUCTION_COMP fill:#533483,stroke:#e94560,color:#fff
    style COLL_COMP fill:#162447,stroke:#1f4068,color:#fff
    style UI_COMP fill:#1b1b2f,stroke:#e94560,color:#fff
```

---

## 6. Sơ Đồ Cấu Trúc Thư Mục

```
NFT-Marketplace/
│
├── 📁 contracts/                      # Smart Contracts (Solidity)
│   ├── NexusNFT.sol                   #   ERC-721 NFT Contract
│   ├── NexusEscrow.sol                #   Marketplace Escrow (List/Buy/Offer)
│   └── NexusCollectionSale.sol        #   Collection Sale Contract
│
├── 📁 scripts/                        # Deployment & Migration Scripts
│   ├── deploy.cjs                     #   Deploy tất cả contracts
│   ├── deploy-escrow.cjs              #   Deploy NexusEscrow
│   ├── deploy-collection-sale.cjs     #   Deploy NexusCollectionSale
│   ├── fix-stuck-offers.cjs           #   Fix offer bị kẹt
│   ├── migrate-collections.ts         #   Migrate dữ liệu collection
│   └── seed.mjs                       #   Seed dữ liệu mẫu
│
├── 📁 supabase/                       # Database
│   ├── schema.sql                     #   Schema gốc
│   ├── create_tables.sql              #   Tạo bảng
│   ├── setup_rls.sql                  #   Row Level Security
│   ├── migration-phase1.sql           #   Migration phase 1
│   └── 📁 migrations/                 #   Các file migration
│
├── 📁 src/                            # Source Code Chính
│   │
│   ├── 📁 app/                        # Next.js App Router (Pages)
│   │   │
│   │   ├── 📁 api/                    # ═══ API Routes ═══
│   │   ├── 📁 explore/               # ═══ Trang Khám Phá ═══
│   │   ├── 📁 create/                # ═══ Trang Mint NFT ═══
│   │   ├── 📁 nft/                   # ═══ Chi Tiết NFT ═══
│   │   ├── 📁 auction/               # ═══ Chi Tiết Đấu Giá ═══
│   │   ├── 📁 auctions/              # ═══ Danh Sách Đấu Giá ═══
│   │   ├── 📁 collection/            # ═══ Chi Tiết Bộ Sưu Tập ═══
│   │   ├── 📁 collections/           # ═══ Danh Sách Bộ Sưu Tập ═══
│   │   ├── 📁 profile/               # ═══ Hồ Sơ Người Dùng ═══
│   │   ├── 📁 activity/              # ═══ Lịch Sử Hoạt Động ═══
│   │   └── 📁 stats/                 # ═══ Trang Thống Kê ═══
│   │
│   ├── 📁 components/                # ═══ React Components ═══
│   │   ├── 📁 layout/                #   Layout Components
│   │   ├── 📁 nft/                   #   NFT Components
│   │   ├── 📁 auction/               #   Auction Components
│   │   ├── 📁 collections/           #   Collection Components
│   │   └── 📁 ui/                    #   Reusable UI Components
│   │
│   ├── 📁 hooks/                     # ═══ Custom Hooks ═══
│   │
│   ├── 📁 lib/                       # ═══ Thư Viện & Utilities ═══
│   │   │
│   │   ├── 📁 abi/                   #   Contract ABIs
│   │   │   └── NexusEscrow.json      #     ABI NexusEscrow
│   │   │
│   │   ├── 📁 solana/                #   Solana-specific
│   │   │   ├── connection.ts         #     RPC connection
│   │   │   ├── mint.ts               #     Mint via Metaplex
│   │   │   ├── marketplace.ts        #     List/Buy/Delist
│   │   │   ├── auction.ts            #     Đấu giá Solana
│   │   │   └── collection-sale.ts    #     Bán collection
│   │   │
│   │   ├── 📁 polygon/               #   Polygon-specific
│   │   │   ├── config.ts             #     Wagmi config
│   │   │   ├── connection.ts         #     Viem client
│   │   │   ├── abi.ts                #     Contract ABI inline
│   │   │   ├── mint.ts               #     Mint via NexusNFT
│   │   │   ├── marketplace.ts        #     List/Buy via NexusEscrow
│   │   │   └── collection-sale.ts    #     Collection sale
│   │   │
│   │   └── 📁 ipfs/                  #   IPFS upload
│   │       └── upload.ts
│   │
│   ├── 📁 store/                     # ═══ State Management (Zustand) ═══
│   │
│   └── 📁 types/                     # ═══ TypeScript Types ═══
│
├── 📁 docs/                          # Tài liệu dự án
├── 📁 public/                        # Static assets
├── 📁 __tests__/                     # Unit tests
│
├── hardhat.config.cjs                # Hardhat config (Polygon contracts)
├── next.config.ts                    # Next.js config
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── vitest.config.ts                  # Test config
└── eslint.config.mjs                 # Linting config
```

---

## 7. Sơ Đồ Luồng Xử Lý Chính

### 7.1 Luồng Mint NFT

```mermaid
sequenceDiagram
    actor User as Người Dùng
    participant UI as Create Page
    participant Hook as useMint
    participant Upload as /api/upload
    participant Chain as Blockchain
    participant API as /api/nfts
    participant DB as Supabase

    User->>UI: Điền form (tên, mô tả, ảnh)
    UI->>Hook: mintNFT(data)
    Hook->>Upload: Upload ảnh
    Upload-->>Hook: URL ảnh (Cloudinary)
    Hook->>Upload: Upload metadata JSON
    Upload-->>Hook: Metadata URI

    alt Solana
        Hook->>Chain: Metaplex create NFT
        Chain-->>Hook: Mint address + TX signature
    else Polygon
        Hook->>Chain: NexusNFT.mintNFT(tokenURI)
        Chain-->>Hook: Token ID + TX hash
    end

    Hook->>API: POST /api/nfts (lưu DB)
    API->>DB: INSERT INTO nfts
    DB-->>API: OK
    API-->>Hook: Success
    Hook-->>UI: Hiển thị kết quả
```

### 7.2 Luồng List & Buy NFT

```mermaid
sequenceDiagram
    actor Seller as Người Bán
    actor Buyer as Người Mua
    participant UI as NFT Detail
    participant Hook as useMarketplace
    participant Chain as Blockchain
    participant API as API Routes
    participant DB as Supabase

    Note over Seller,DB: === LIST NFT ===
    Seller->>UI: Nhấn "List for Sale"
    UI->>Hook: listNFT(mint, price)

    alt Solana
        Hook->>Chain: Transfer NFT to escrow
    else Polygon
        Hook->>Chain: NexusEscrow.listItem(tokenId, price)
    end

    Chain-->>Hook: TX confirmed
    Hook->>API: POST /api/listings
    API->>DB: INSERT listing + UPDATE nft.listed=true
    Hook->>API: POST /api/activities (type: list)

    Note over Seller,DB: === BUY NFT ===
    Buyer->>UI: Nhấn "Buy Now"
    UI->>Hook: buyNFT(mint, price, seller)

    alt Solana
        Hook->>Chain: Transfer SOL to seller + NFT to buyer
    else Polygon
        Hook->>Chain: NexusEscrow.buyItem(tokenId) + send ETH
    end

    Chain-->>Hook: TX confirmed
    Hook->>API: PATCH /api/listings (active=false)
    Hook->>API: PATCH /api/nfts (owner=buyer, listed=false)
    Hook->>API: POST /api/activities (type: sale)
```

### 7.3 Luồng Đấu Giá (Auction)

```mermaid
sequenceDiagram
    actor Seller as Người Bán
    actor Bidder as Người Đấu Giá
    participant UI as Auction Page
    participant Hook as useAuction
    participant API as /api/auctions
    participant DB as Supabase

    Note over Seller,DB: === TẠO ĐẤU GIÁ ===
    Seller->>UI: Tạo phiên đấu giá
    UI->>Hook: createAuction(mint, startPrice, endTime)
    Hook->>API: POST /api/auctions
    API->>DB: INSERT auction
    Hook->>API: POST /api/activities (type: auction_created)

    Note over Seller,DB: === ĐẶT BID ===
    Bidder->>UI: Đặt giá
    UI->>Hook: placeBid(auctionId, amount)
    Hook->>API: PATCH /api/auctions/[id] (bid)
    API->>DB: INSERT bid + UPDATE auction
    Hook->>API: POST /api/activities (type: bid)

    Note over Seller,DB: === KẾT THÚC ===
    Seller->>UI: Settle auction
    UI->>Hook: settleAuction(auctionId)
    Hook->>API: PATCH /api/auctions/[id] (settle)
    API->>DB: UPDATE auction.status='settled'
    Hook->>API: POST /api/activities (type: auction_settled)
```

---

## 8. Sơ Đồ Provider / Context

```mermaid
graph TB
    subgraph PROVIDER_TREE["🌳 Provider Tree"]
        THEME["ThemeProvider<br/>(next-themes)"]
        QUERY["QueryClientProvider<br/>(TanStack Query)"]
        WAGMI["WagmiProvider<br/>(Polygon EVM)"]
        SOL_CONN["ConnectionProvider<br/>(Solana RPC)"]
        SOL_WALLET["WalletProvider<br/>(Solana Wallets)"]
        SOL_MODAL["WalletModalProvider<br/>(Wallet UI)"]
        APP_CONTENT["App Content<br/>(Pages + Components)"]
    end

    THEME --> QUERY
    QUERY --> WAGMI
    WAGMI --> SOL_CONN
    SOL_CONN --> SOL_WALLET
    SOL_WALLET --> SOL_MODAL
    SOL_MODAL --> APP_CONTENT

    style PROVIDER_TREE fill:#1a1a2e,stroke:#e94560,color:#fff
    style THEME fill:#533483,stroke:#fff,color:#fff
    style QUERY fill:#0f3460,stroke:#fff,color:#fff
    style WAGMI fill:#8247e5,stroke:#fff,color:#fff
    style SOL_CONN fill:#9945ff,stroke:#fff,color:#fff
    style SOL_WALLET fill:#2d1b69,stroke:#fff,color:#fff
    style SOL_MODAL fill:#16213e,stroke:#fff,color:#fff
    style APP_CONTENT fill:#e94560,stroke:#fff,color:#fff
```

---

## 9. Sơ Đồ Deployment

```mermaid
graph LR
    subgraph DEV["🛠️ Development"]
        LOCAL["localhost:3000<br/>(npm run dev)"]
        HARDHAT["Hardhat<br/>(Compile & Deploy)"]
    end

    subgraph HOSTING["☁️ Hosting"]
        VERCEL["Vercel<br/>(Next.js Hosting)"]
    end

    subgraph SERVICES["🔧 Dịch Vụ Bên Ngoài"]
        SUPA_CLOUD["Supabase Cloud<br/>(PostgreSQL)"]
        CLOUDINARY_SVC["Cloudinary<br/>(Image CDN)"]
    end

    subgraph NETWORKS["⛓️ Blockchain Networks"]
        SOL_DEV["Solana Devnet"]
        POLY_AMOY["Polygon Amoy<br/>Testnet"]
    end

    LOCAL -->|"Deploy"| VERCEL
    HARDHAT -->|"Deploy contracts"| POLY_AMOY
    VERCEL --> SUPA_CLOUD
    VERCEL --> CLOUDINARY_SVC
    VERCEL --> SOL_DEV
    VERCEL --> POLY_AMOY

    style DEV fill:#16213e,stroke:#0f3460,color:#fff
    style HOSTING fill:#0f3460,stroke:#533483,color:#fff
    style SERVICES fill:#162447,stroke:#1f4068,color:#fff
    style NETWORKS fill:#1b1b2f,stroke:#e94560,color:#fff
```

---

## 10. Bảng Tóm Tắt Công Nghệ

| Thành Phần | Công Nghệ | Phiên Bản |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.x |
| **UI Library** | React | 19.x |
| **Styling** | Tailwind CSS | v4 |
| **Animation** | Framer Motion | - |
| **State Management** | Zustand | - |
| **Data Fetching** | TanStack Query | - |
| **Database** | Supabase (PostgreSQL) | - |
| **Solana SDK** | @solana/web3.js, Metaplex UMI | - |
| **EVM SDK** | Wagmi, Viem | - |
| **Smart Contracts** | Solidity (Hardhat) | 0.8.x |
| **File Storage** | Cloudinary, IPFS | - |
| **Testing** | Vitest | - |
| **Linting** | ESLint | - |
| **Language** | TypeScript | 5.x |

---

> 📌 **Ghi chú**: Tất cả các sơ đồ Mermaid có thể copy trực tiếp vào công cụ render Mermaid hoặc xuất ra ảnh PNG/SVG để chèn vào báo cáo Word.
> 
> Công cụ gợi ý: [Mermaid Live Editor](https://mermaid.live) — Paste code Mermaid → Export PNG/SVG
