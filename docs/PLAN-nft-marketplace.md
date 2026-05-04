# NFT Marketplace - Solana × Next.js

## Overview

**Dự án:** NFT Marketplace cho đồ án môn học
**Loại:** WEB Application (Full-stack)
**Mục đích:** Xây dựng marketplace NFT hoàn chỉnh trên Solana blockchain với giao diện Futuristic/Cyber, tích hợp wallet, mint, buy/sell, auction và quản lý collection.

---

## Project Type

| Field | Value |
|-------|-------|
| Type | **WEB** |
| Primary Agent | `frontend-specialist` |
| Blockchain | **Solana** (Devnet → Mainnet) |
| Frontend | **Next.js 15** (App Router) |
| Styling | **Tailwind CSS v4** + Custom CSS |
| State | **Zustand** + **TanStack Query** |
| Wallet | **@solana/wallet-adapter** |
| NFT Standard | **Metaplex** (Token Metadata Program) |

---

## Success Criteria

- [ ] Kết nối Phantom/Solflare wallet thành công
- [ ] Mint NFT với metadata upload lên IPFS/Arweave
- [ ] List/Buy/Sell NFT trên marketplace
- [ ] Auction system hoạt động với countdown timer
- [ ] User profile hiển thị owned/created NFTs
- [ ] Search/Filter NFTs theo collection, price, category
- [ ] Activity history (transactions log)
- [ ] Dark/Light mode toggle
- [ ] Collection pages với stats
- [ ] Responsive trên mobile/tablet/desktop
- [ ] Build thành công, không lỗi TypeScript/lint

---

## Tech Stack

| Layer | Technology | Lý do |
|-------|-----------|-------|
| **Framework** | Next.js 15 (App Router) | SSR/SSG tối ưu SEO, Server Components |
| **Language** | TypeScript (strict) | Type safety bắt buộc |
| **Styling** | Tailwind CSS v4 + Framer Motion | Futuristic animations, responsive |
| **State** | Zustand (global) + TanStack Query (server) | Lightweight, cache tốt |
| **Blockchain** | `@solana/web3.js` + `@metaplex-foundation/js` | Solana SDK chính thức |
| **Wallet** | `@solana/wallet-adapter-react` | Multi-wallet support |
| **Storage** | IPFS (via Pinata/NFT.Storage) | Decentralized metadata storage |
| **Fonts** | Orbitron (Display) + Space Grotesk (Body) | Futuristic/Cyber aesthetic |
| **Icons** | Lucide React | Lightweight, consistent |
| **Theme** | next-themes | Dark/Light mode |
| **Charts** | Recharts | Activity/stats visualization |

---

## 🎨 Design Commitment: CYBER NEXUS

```
🎨 DESIGN COMMITMENT: CYBER NEXUS FUTURISM

- Topological Choice: Fragmented HUD layout - overlapping panels with
  scan-line textures, asymmetric card grids, floating data overlays
- Risk Factor: Neon accent borders on dark surfaces, glitch-text effects
  on hover, terminal-style typography for data
- Readability Conflict: Balanced - cyber aesthetic WITHOUT sacrificing usability
- Cliché Liquidation:
  ✅ NO purple/violet (Purple Ban)
  ✅ NO mesh gradients
  ✅ NO glassmorphism blur
  ✅ NO standard SaaS split hero
  ✅ NO bento grid default
```

### Color Palette (Cyber Nexus)

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Background (Dark)** | Void Black | `#0a0a0f` | Primary dark bg |
| **Background (Light)** | Ice White | `#f0f2f5` | Primary light bg |
| **Surface** | Carbon Gray | `#141420` | Cards, panels |
| **Primary Accent** | Neon Cyan | `#00f0ff` | CTAs, highlights, borders |
| **Secondary Accent** | Electric Lime | `#a3ff12` | Success, mint actions |
| **Warning/Hot** | Signal Orange | `#ff6b2b` | Auction, urgent |
| **Error** | Crimson | `#ff2d55` | Errors, delists |
| **Text Primary** | Platinum | `#e8e8ed` | Main text (dark mode) |
| **Text Secondary** | Smoke | `#8a8a9a` | Secondary text |
| **Border** | Neon Line | `rgba(0,240,255,0.15)` | Subtle borders |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| **Display/Hero** | Orbitron | 700-900 | 48-72px |
| **Headings** | Orbitron | 600 | 24-36px |
| **Body** | Space Grotesk | 400-500 | 14-16px |
| **Mono/Data** | JetBrains Mono | 400 | 12-14px |

### Design Elements

- **Cards:** Sharp edges (0-2px radius), neon cyan border glow on hover
- **Buttons:** Clipped corners (clip-path), glow pulse on hover
- **Animations:** Scan-line sweep, staggered reveal on scroll, spring physics
- **Background:** Subtle grid pattern overlay, floating particle system
- **Data Display:** Terminal-style monospace for prices, addresses, timestamps
- **NFT Cards:** Parallax tilt on hover, image zoom, price flash animation

---

## File Structure

```
nft-marketplace/
├── public/
│   ├── fonts/                    # Self-hosted fonts
│   ├── images/                   # Static assets
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout + providers
│   │   ├── page.tsx              # Homepage (Explore/Featured)
│   │   ├── globals.css           # Global styles + cyber theme
│   │   ├── explore/
│   │   │   └── page.tsx          # Browse all NFTs
│   │   ├── nft/
│   │   │   └── [mint]/
│   │   │       └── page.tsx      # NFT detail page
│   │   ├── collection/
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Collection page
│   │   ├── create/
│   │   │   └── page.tsx          # Mint NFT page
│   │   ├── profile/
│   │   │   └── [address]/
│   │   │       └── page.tsx      # User profile
│   │   ├── auction/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Auction detail
│   │   ├── activity/
│   │   │   └── page.tsx          # Activity/History
│   │   └── api/
│   │       ├── nfts/
│   │       │   └── route.ts      # NFT listing API
│   │       ├── collections/
│   │       │   └── route.ts      # Collections API
│   │       └── activity/
│   │           └── route.ts      # Activity feed API
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx        # Navigation + wallet connect
│   │   │   ├── Footer.tsx        # Footer
│   │   │   ├── Sidebar.tsx       # Mobile sidebar
│   │   │   └── ThemeToggle.tsx   # Dark/Light toggle
│   │   ├── nft/
│   │   │   ├── NFTCard.tsx       # NFT display card
│   │   │   ├── NFTGrid.tsx       # Grid layout
│   │   │   ├── NFTDetail.tsx     # Detail view
│   │   │   └── MintForm.tsx      # Mint form
│   │   ├── auction/
│   │   │   ├── AuctionCard.tsx   # Auction card with timer
│   │   │   ├── BidForm.tsx       # Place bid form
│   │   │   └── Countdown.tsx     # Live countdown
│   │   ├── marketplace/
│   │   │   ├── ListingForm.tsx   # Create listing
│   │   │   ├── BuyButton.tsx     # Purchase action
│   │   │   └── PriceDisplay.tsx  # SOL price display
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx # User info + stats
│   │   │   ├── OwnedTab.tsx      # Owned NFTs tab
│   │   │   └── CreatedTab.tsx    # Created NFTs tab
│   │   ├── search/
│   │   │   ├── SearchBar.tsx     # Search input
│   │   │   └── FilterPanel.tsx   # Filter sidebar
│   │   ├── collection/
│   │   │   ├── CollectionBanner.tsx # Collection header
│   │   │   └── CollectionStats.tsx  # Floor price, volume, etc.
│   │   ├── activity/
│   │   │   ├── ActivityFeed.tsx  # Transaction list
│   │   │   └── ActivityItem.tsx  # Single transaction
│   │   └── ui/
│   │       ├── Button.tsx        # Cyber button component
│   │       ├── Card.tsx          # Cyber card component
│   │       ├── Input.tsx         # Styled input
│   │       ├── Modal.tsx         # Modal overlay
│   │       ├── Skeleton.tsx      # Loading skeleton
│   │       ├── Badge.tsx         # Status badge
│   │       ├── Tabs.tsx          # Tab navigation
│   │       ├── Toast.tsx         # Notification toast
│   │       └── ParticleField.tsx # Background particles
│   ├── hooks/
│   │   ├── useNFTs.ts            # NFT data fetching
│   │   ├── useAuction.ts         # Auction logic
│   │   ├── useWallet.ts          # Wallet connection wrapper
│   │   ├── useMint.ts            # Minting logic
│   │   ├── useMarketplace.ts     # Buy/sell operations
│   │   ├── useSearch.ts          # Search/filter logic
│   │   └── useActivity.ts       # Activity feed
│   ├── lib/
│   │   ├── solana/
│   │   │   ├── connection.ts     # RPC connection config
│   │   │   ├── marketplace.ts    # Marketplace program interactions
│   │   │   ├── mint.ts           # Mint NFT functions
│   │   │   ├── auction.ts        # Auction program interactions
│   │   │   └── utils.ts          # Solana utility functions
│   │   ├── ipfs/
│   │   │   └── upload.ts         # IPFS upload (Pinata)
│   │   ├── constants.ts          # Contract addresses, configs
│   │   └── utils.ts              # General utilities
│   ├── store/
│   │   ├── useThemeStore.ts      # Theme state (dark/light)
│   │   ├── useWalletStore.ts     # Wallet connection state
│   │   └── useCartStore.ts       # Cart/wishlist state
│   ├── types/
│   │   ├── nft.ts                # NFT types
│   │   ├── auction.ts            # Auction types
│   │   ├── collection.ts         # Collection types
│   │   └── activity.ts           # Activity types
│   └── data/
│       └── mock.ts               # Mock data for development
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env.local.example
```

---

## Task Breakdown

### Phase 1: Foundation (P0) — `frontend-specialist`

| # | Task | Agent | Skill | Verify |
|---|------|-------|-------|--------|
| 1.1 | Khởi tạo Next.js 15 project + TypeScript strict | `frontend-specialist` | `app-builder` | `npm run build` pass |
| 1.2 | Cài dependencies (Solana SDK, Metaplex, Tailwind, Framer Motion, Zustand, next-themes) | `frontend-specialist` | `app-builder` | `npm ls` không lỗi |
| 1.3 | Setup Tailwind config với Cyber Nexus theme tokens (colors, fonts, animations) | `frontend-specialist` | `tailwind-patterns` | Tailwind classes hoạt động |
| 1.4 | Tạo globals.css với cyber design system (grid bg, scan-line, glow effects) | `frontend-specialist` | `frontend-design` | Visual verify trên browser |
| 1.5 | Setup root layout + Solana wallet provider + theme provider | `frontend-specialist` | `nextjs-react-expert` | Wallet adapter renders |
| 1.6 | Tạo mock data cho NFTs, Collections, Activity | `frontend-specialist` | - | Import không lỗi |

### Phase 2: UI Components (P1) — `frontend-specialist`

| # | Task | Agent | Skill | Verify |
|---|------|-------|-------|--------|
| 2.1 | Build UI primitives: Button, Card, Input, Modal, Badge, Skeleton, Toast (Cyber style) | `frontend-specialist` | `frontend-design` | Components render đúng style |
| 2.2 | Build Header (nav + wallet connect + theme toggle + search) | `frontend-specialist` | `frontend-design` | Responsive, wallet button hiện |
| 2.3 | Build NFTCard với parallax tilt, price display, hover glow | `frontend-specialist` | `frontend-design` | Hover animation smooth |
| 2.4 | Build NFTGrid (responsive grid + loading skeletons) | `frontend-specialist` | `nextjs-react-expert` | Grid responsive 1→4 cols |
| 2.5 | Build ParticleField background component | `frontend-specialist` | `frontend-design` | Particles animate, GPU-optimized |
| 2.6 | Build SearchBar + FilterPanel | `frontend-specialist` | `frontend-design` | Filter by price/category/collection |
| 2.7 | Build AuctionCard + Countdown timer | `frontend-specialist` | `frontend-design` | Timer counts down in real-time |
| 2.8 | Build ActivityFeed + ActivityItem | `frontend-specialist` | `frontend-design` | Transaction list renders |
| 2.9 | Build Footer | `frontend-specialist` | `frontend-design` | Links, social, responsive |

### Phase 3: Pages (P2) — `frontend-specialist`

| # | Task | Agent | Skill | Verify |
|---|------|-------|-------|--------|
| 3.1 | Homepage: Hero section (featured NFTs, trending, live auctions) | `frontend-specialist` | `frontend-design` | Hero animation, featured grid |
| 3.2 | Explore page: NFT grid + search/filter + sort | `frontend-specialist` | `nextjs-react-expert` | Filter/sort hoạt động |
| 3.3 | NFT Detail page: Image, metadata, price, buy/bid button, history | `frontend-specialist` | `frontend-design` | Detail đầy đủ info |
| 3.4 | Create/Mint page: Upload form, metadata input, preview, mint button | `frontend-specialist` | `frontend-design` | Form validation, preview |
| 3.5 | Profile page: User info, owned/created/favorited tabs | `frontend-specialist` | `nextjs-react-expert` | Tab switching, NFT grid |
| 3.6 | Collection page: Banner, stats (floor, volume, owners), NFT grid | `frontend-specialist` | `frontend-design` | Stats display, grid |
| 3.7 | Auction page: Bid history, countdown, place bid form | `frontend-specialist` | `frontend-design` | Real-time countdown |
| 3.8 | Activity page: Transaction feed, filters by type | `frontend-specialist` | `frontend-design` | Activity list renders |

### Phase 4: Blockchain Integration (P2) — `frontend-specialist`

| # | Task | Agent | Skill | Verify |
|---|------|-------|-------|--------|
| 4.1 | Setup Solana connection (devnet RPC) | `frontend-specialist` | - | Connection established |
| 4.2 | Wallet connect/disconnect flow (Phantom, Solflare) | `frontend-specialist` | - | Wallet connects, address shows |
| 4.3 | Mint NFT: Upload to IPFS → Create metadata → Mint via Metaplex | `frontend-specialist` | - | NFT minted on devnet |
| 4.4 | List NFT for sale (fixed price) | `frontend-specialist` | - | Listing created, price set |
| 4.5 | Buy NFT (transfer SOL + NFT) | `frontend-specialist` | - | Ownership transfers |
| 4.6 | Auction: Create auction, place bid, settle | `frontend-specialist` | - | Auction flow complete |
| 4.7 | Fetch owned NFTs by wallet address | `frontend-specialist` | - | Profile shows owned NFTs |

### Phase 5: Polish & Dark/Light Mode (P3)

| # | Task | Agent | Skill | Verify |
|---|------|-------|-------|--------|
| 5.1 | Dark/Light mode toggle với smooth transition | `frontend-specialist` | `frontend-design` | Toggle works, no flash |
| 5.2 | Scroll animations (staggered reveal, parallax) via Framer Motion | `frontend-specialist` | `frontend-design` | Smooth scroll animations |
| 5.3 | Loading states (skeletons, spinners) cho tất cả async operations | `frontend-specialist` | `nextjs-react-expert` | No layout shift |
| 5.4 | Error handling + toast notifications | `frontend-specialist` | `frontend-design` | Errors show toast |
| 5.5 | Mobile responsive kiểm tra toàn bộ pages | `frontend-specialist` | `frontend-design` | Mobile layout correct |
| 5.6 | SEO meta tags cho tất cả pages | `frontend-specialist` | `seo-fundamentals` | Meta tags present |

---

## Phase X: Verification (MANDATORY)

### Automated Checks

```bash
# P0: Lint & Type Check
npm run lint && npx tsc --noEmit

# P0: Security Scan
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .

# P1: UX Audit
python .agent/skills/frontend-design/scripts/ux_audit.py .

# P2: Build Verification
npm run build

# P3: Lighthouse (requires running server)
python .agent/skills/performance-profiling/scripts/lighthouse_audit.py http://localhost:3000
```

### Manual Verification

- [ ] Wallet connect/disconnect hoạt động
- [ ] Mint NFT thành công trên devnet
- [ ] Buy/Sell flow hoàn tất
- [ ] Auction countdown chạy real-time
- [ ] Search/Filter hoạt động đúng
- [ ] Dark/Light mode chuyển mượt
- [ ] Mobile responsive tất cả pages
- [ ] No purple/violet hex codes (Purple Ban ✅)
- [ ] No standard template layouts
- [ ] Animations smooth, GPU-optimized

### Rule Compliance

- [ ] No purple/violet hex codes
- [ ] No standard template layouts
- [ ] Socratic Gate was respected
- [ ] Design Commitment followed (Cyber Nexus)
