<div align="center">

# ⚡ NEXUS — Multichain NFT Marketplace

**A next-generation, multichain NFT marketplace built with Next.js 16, Solana, and Polygon.**

Trade, auction, bridge, and collect digital art across blockchains — all from a single cyberpunk-inspired interface.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana)](https://solana.com)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy-7B3FE4?style=for-the-badge&logo=polygon)](https://polygon.technology)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-00F0FF?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Smart Contracts](#-smart-contracts)
- [Scripts](#-scripts)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [License](#-license)

---

## 🌐 Overview

**NEXUS** is a full-stack multichain NFT marketplace that supports both **Solana** and **Polygon** blockchains. Users can mint, list, buy, auction, and bridge NFTs across chains through a unified, cyberpunk-themed interface.

The platform features a **Chain Abstraction Layer** that allows seamless switching between blockchains, a **simulated cross-chain bridge** for NFT transfers, and a complete **auction system** with real-time bidding.

### Key Highlights

| Feature | Description |
|---|---|
| 🔗 **Multichain** | Solana (Devnet) + Polygon (Amoy Testnet) |
| 🎨 **Mint NFTs** | Create on-chain NFTs with IPFS metadata |
| 🛒 **Marketplace** | List, buy, and make offers on NFTs |
| ⏰ **Auctions** | Timed auctions with minimum bid increments |
| 🌉 **Cross-Chain Bridge** | Bridge NFTs between Solana ↔ Polygon |
| 📦 **Collections** | Create, manage, buy & sell entire collections |
| 📊 **Analytics** | Stats dashboard with volume, traders, rankings |
| ❤️ **Watchlist** | Server-side favorites with optimistic UI |
| 🌙 **Dark/Light Mode** | Theme switching with full design token support |

---

## ✨ Features

### Marketplace Core

- **Mint NFTs** — Upload artwork to Cloudinary/IPFS, mint on Solana (Metaplex) or Polygon (ERC-721)
- **List for Sale** — Set fixed prices with on-chain signing
- **Buy NFTs** — Direct purchase with SOL or POL
- **Cancel Listing** — Remove listings and reclaim your NFT
- **Transfer NFTs** — Send NFTs to any wallet address
- **Make Offers** — Bid on unlisted NFTs, owners can accept/reject

### Auction System

- **Create Auctions** — Set starting price, duration (in minutes), and minimum bid increment
- **Real-Time Bidding** — Place bids with automatic validation
- **Auction Settlement** — Automated winner determination and NFT transfer
- **Countdown Timer** — Live countdown with days/hours/minutes/seconds
- **Lock System** — NFTs are locked during active auctions (cannot be sold separately)

### Multichain & Bridge

- **Chain Switcher** — Toggle between Solana and Polygon from the header
- **Dual Wallet Support** — Phantom/Solflare (Solana) + MetaMask (Polygon) via unified wallet hook
- **Cross-Chain Bridge** — 4-step animated bridge flow: Lock → Bridge → Mint → Complete
- **Chain Badges** — Visual indicators on NFT cards showing which chain each NFT lives on
- **Bridge History** — Track all bridge transactions per NFT

### Collections

- **Create Collections** — Name, description, banner, and category
- **Collection Pages** — Dedicated page per collection with stats and NFT grid
- **Buy/Sell Collections** — Trade entire collections as a unit
- **Collection Rankings** — Leaderboard sorted by volume, floor price, items

### Social & Analytics

- **Watchlist / Favorites** — Server-side (Supabase) with optimistic updates
- **Activity Feed** — Global and per-NFT activity history
- **Stats Dashboard** — Total volume, NFTs created, top traders, top creators
- **Price History Charts** — Interactive price charts per NFT (Recharts)
- **Share NFTs** — Copy link to clipboard

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | React framework (App Router, Turbopack) |
| [React 19](https://react.dev) | UI library |
| [TypeScript 5](https://typescriptlang.org) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling |
| [Framer Motion](https://motion.dev) | Animations and transitions |
| [Recharts](https://recharts.org) | Price history charts |
| [Lucide React](https://lucide.dev) | Icon system |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark/Light mode |

### Blockchain

| Technology | Purpose |
|---|---|
| [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) | Solana blockchain interaction |
| [@solana/spl-token](https://www.npmjs.com/package/@solana/spl-token) | SPL token operations |
| [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter) | Phantom, Solflare wallet integration |
| [wagmi](https://wagmi.sh) | Polygon/EVM wallet hooks |
| [viem](https://viem.sh) | EVM blockchain interaction |
| [@wagmi/core](https://wagmi.sh/core) | Core EVM functions (read/write contracts) |
| [Hardhat](https://hardhat.org) | Smart contract compilation & deployment |
| [OpenZeppelin](https://openzeppelin.com) | Audited ERC-721 base contracts |

### Backend & Data

| Technology | Purpose |
|---|---|
| [Supabase](https://supabase.com) | PostgreSQL database + auth + RLS |
| [Cloudinary](https://cloudinary.com) | Image upload and CDN |
| [TanStack React Query](https://tanstack.com/query) | Server state management |
| [Zustand](https://zustand-demo.pmnd.rs) | Client state management |

### Testing & Tooling

| Technology | Purpose |
|---|---|
| [Vitest](https://vitest.dev) | Unit and integration testing |
| [Testing Library](https://testing-library.com) | Component testing utilities |
| [ESLint](https://eslint.org) | Code linting |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        NEXUS CLIENT                         │
│  ┌───────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │  Next.js   │  │  Chain Store   │  │  Wallet Adapters   │  │
│  │  App Router│  │  (Zustand)     │  │  Phantom/MetaMask  │  │
│  └─────┬─────┘  └───────┬───────┘  └────────┬───────────┘  │
│        │                │                     │              │
│  ┌─────▼─────────────────▼─────────────────────▼──────────┐  │
│  │              Chain Abstraction Layer                    │  │
│  │  useChainWallet() · useChainStore() · ChainSwitcher    │  │
│  └────────┬──────────────────────────────────┬────────────┘  │
│           │                                  │               │
│  ┌────────▼────────┐              ┌──────────▼───────────┐  │
│  │   Solana Lib     │              │    Polygon Lib        │  │
│  │  mint.ts         │              │  mint.ts (ERC-721)    │  │
│  │  marketplace.ts  │              │  marketplace.ts       │  │
│  │  auction.ts      │              │  config.ts (wagmi)    │  │
│  │  connection.ts   │              │  abi.ts               │  │
│  └────────┬────────┘              └──────────┬───────────┘  │
└───────────┼──────────────────────────────────┼──────────────┘
            │                                  │
   ┌────────▼────────┐              ┌──────────▼───────────┐
   │  Solana Devnet   │              │  Polygon Amoy        │
   │  (on-chain)      │              │  (ERC-721 Contract)  │
   └─────────────────┘              └──────────────────────┘
            │                                  │
            └──────────────┬───────────────────┘
                    ┌──────▼──────┐
                    │  Supabase   │
                    │  PostgreSQL │
                    │  (off-chain │
                    │   metadata) │
                    └─────────────┘
```

### Design Principles

- **Chain Agnostic** — All UI components work with any chain via `ChainId` type
- **Wallet Unified** — `useChainWallet()` abstracts Solana/EVM wallet differences
- **Optimistic UI** — Actions update immediately, sync with server in background
- **Server-First Data** — All persistent data flows through Supabase API routes
- **Design Token System** — CSS custom properties for consistent theming

---

## 📁 Project Structure

```
NFT-Marketplace/
├── contracts/                    # Solidity smart contracts
│   ├── NexusNFT.sol              #   ERC-721 NFT contract
│   ├── NexusEscrow.sol           #   Escrow for marketplace
│   └── NexusCollectionSale.sol   #   Collection trading
│
├── docs/                         # Documentation & plans
│   ├── ARCHITECTURE-DIAGRAMS.md  #   System architecture
│   ├── PROJECT-OVERVIEW.md       #   Full project overview
│   ├── DEPLOY.md                 #   Deployment guide
│   ├── migration-multichain.sql  #   DB migration for multichain
│   └── PLAN-*.md                 #   Feature planning docs
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  #   API Routes
│   │   │   ├── activities/       #     Activity feed
│   │   │   ├── auctions/         #     Auction CRUD + settle
│   │   │   ├── collections/      #     Collection management
│   │   │   ├── favorites/        #     Watchlist
│   │   │   ├── listings/         #     Marketplace listings
│   │   │   ├── nfts/             #     NFT CRUD
│   │   │   ├── offers/           #     Bid offers
│   │   │   ├── stats/            #     Analytics data
│   │   │   └── upload/           #     Image upload (Cloudinary)
│   │   │
│   │   ├── auction/[id]/         #   Auction detail page
│   │   ├── auctions/             #   Auctions listing page
│   │   ├── collection/[slug]/    #   Collection detail page
│   │   ├── collections/          #   Collections listing page
│   │   ├── create/               #   Mint NFT page
│   │   ├── explore/              #   NFT explore/search page
│   │   ├── nft/[mint]/           #   NFT detail page
│   │   ├── profile/[address]/    #   User profile page
│   │   ├── activity/             #   Global activity feed
│   │   └── stats/                #   Stats dashboard
│   │
│   ├── components/
│   │   ├── auction/              #   AuctionCard, Countdown
│   │   ├── collections/          #   CollectionCard, Banner, Picker, Buy/Sell modals
│   │   ├── layout/               #   Header, Footer, ChainSwitcher, WalletPicker
│   │   ├── nft/                  #   NFTCard, NFTGrid, TransferModal, PriceChart
│   │   └── ui/                   #   Badge, Button, Card, Input, Modal, Skeleton, Toast
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuction.ts         #   Create/bid/settle auctions
│   │   ├── useBalance.ts         #   Wallet balance
│   │   ├── useBuyCollection.ts   #   Buy collection flow
│   │   ├── useChainWallet.ts     #   Unified multichain wallet
│   │   ├── useCollections.ts     #   Collection CRUD
│   │   ├── useData.ts            #   Data fetching (NFTs, listings, activities)
│   │   ├── useFavorites.ts       #   Watchlist/favorites
│   │   ├── useMarketplace.ts     #   List/buy/cancel
│   │   ├── useMint.ts            #   Mint NFT flow
│   │   ├── useOffer.ts           #   Make/respond offers
│   │   └── useSellCollection.ts  #   Sell collection flow
│   │
│   ├── lib/                      # Core libraries
│   │   ├── solana/               #   Solana: connection, mint, marketplace, auction
│   │   ├── polygon/              #   Polygon: config, abi, mint, marketplace
│   │   ├── ipfs/                 #   IPFS metadata handling
│   │   ├── abi/                  #   ABI definitions
│   │   ├── api.ts                #   API helper functions
│   │   ├── auth.ts               #   Wallet authentication
│   │   ├── cloudinary.ts         #   Image upload
│   │   ├── constants.ts          #   App constants
│   │   └── supabase.ts           #   Supabase client
│   │
│   ├── store/                    # Zustand state management
│   │   ├── useChainStore.ts      #   Active chain state
│   │   ├── useMarketplaceStore.ts#   Listings, auctions, NFTs
│   │   ├── useThemeStore.ts      #   Theme preference
│   │   └── useToastStore.ts      #   Toast notifications
│   │
│   └── types/                    # TypeScript type definitions
│       ├── chain.tsx             #   ChainId, ChainConfig
│       ├── nft.ts                #   NFT, NFTAttribute, NFTListing
│       ├── auction.ts            #   Auction, Bid
│       ├── collection.ts         #   Collection
│       ├── activity.ts           #   Activity, ActivityType
│       └── offer.ts              #   Offer
│
├── __tests__/                    # Test suites
├── hardhat.config.cjs            # Hardhat configuration
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **Git**
- **Phantom Wallet** (for Solana) — [Install](https://phantom.app)
- **MetaMask** (for Polygon) — [Install](https://metamask.io)
- **Supabase** account — [Sign up](https://supabase.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/NFT-Marketplace.git
cd NFT-Marketplace

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your keys (see Environment Variables)

# 4. Run database migrations
# → Open Supabase SQL Editor → Paste & run docs/migration-multichain.sql

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see NEXUS.

### Wallet Setup

1. **Solana** — Switch Phantom to **Devnet** (Settings → Developer Settings → Testnet Mode)
2. **Get Devnet SOL** — Visit [Solana Faucet](https://faucet.solana.com) and airdrop 2 SOL
3. **Polygon** — Add **Amoy Testnet** to MetaMask (Chain ID: 80002)
4. **Get Testnet POL** — Visit [Polygon Faucet](https://faucet.polygon.technology/)

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# ─── Supabase ───────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ─── Solana ─────────────────────────────────────────
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_DEVNET=https://api.devnet.solana.com

# ─── Polygon ───────────────────────────────────────
NEXT_PUBLIC_POLYGON_RPC=https://rpc-amoy.polygon.technology/
NEXT_PUBLIC_POLYGON_CONTRACT=0x...  # Your deployed NexusNFT address

# ─── Cloudinary ─────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🗄 Database Setup

NEXUS uses **Supabase** (PostgreSQL) for off-chain data. Run the migration in [Supabase SQL Editor](https://supabase.com/dashboard):

### Core Tables

| Table | Purpose |
|---|---|
| `nfts` | NFT metadata, owner, chain, listing status |
| `listings` | Active marketplace listings |
| `auctions` | Timed auctions with bids |
| `bids` | Auction bid history |
| `activities` | Transaction activity feed |
| `favorites` | User watchlist/favorites |
| `collections` | NFT collection metadata |
| `offers` | Buy offers on NFTs |
| `bridge_transactions` | Cross-chain bridge history |

### Migration

```bash
# Run in Supabase SQL Editor:
docs/migration-multichain.sql
```

---

## 📜 Smart Contracts

### Polygon (EVM) — Amoy Testnet

| Contract | File | Description |
|---|---|---|
| **NexusNFT** | `contracts/NexusNFT.sol` | ERC-721 with `safeMint(address, string)` |
| **NexusEscrow** | `contracts/NexusEscrow.sol` | Marketplace escrow for listings |
| **NexusCollectionSale** | `contracts/NexusCollectionSale.sol` | Collection trading |

### Deploying

```bash
# Compile contracts
npm run compile

# Deploy NexusNFT to Polygon Amoy
npm run deploy:amoy

# Deploy Bridge contracts
npm run deploy:bridge
```

> **Note:** You need testnet POL in your deployer wallet. Set `PRIVATE_KEY` in your Hardhat config.

---

## 📦 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run compile` | Compile Solidity contracts (Hardhat) |
| `npm run deploy:amoy` | Deploy contracts to Polygon Amoy |
| `npm run deploy:bridge` | Deploy bridge contracts |

---

## 📡 API Reference

All API routes are located at `src/app/api/` and follow RESTful conventions.

### NFTs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/nfts` | List all NFTs (filterable by owner, collection, chain) |
| `POST` | `/api/nfts` | Create/update an NFT record |

### Listings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/listings` | Get active listings |
| `POST` | `/api/listings` | Create or cancel a listing |

### Auctions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auctions` | Get all auctions |
| `POST` | `/api/auctions` | Create an auction |
| `POST` | `/api/auctions/[id]/settle` | Settle a completed auction |

### Offers

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/offers?nft_mint=...` | Get offers for an NFT |
| `POST` | `/api/offers` | Create an offer |
| `PATCH` | `/api/offers/[id]` | Accept or reject an offer |

### Collections

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/collections` | List collections |
| `POST` | `/api/collections` | Create/update a collection |

### Other

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST/DELETE` | `/api/favorites` | Manage user watchlist |
| `GET` | `/api/activities` | Activity feed |
| `GET` | `/api/stats` | Marketplace analytics |
| `POST` | `/api/upload` | Upload image to Cloudinary |

---

<div align="center">

**Built with ⚡ by NEXUS Team**

[Report Bug](https://github.com/your-username/NFT-Marketplace/issues) · [Request Feature](https://github.com/your-username/NFT-Marketplace/issues)

</div>