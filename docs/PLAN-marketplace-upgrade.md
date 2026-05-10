# PLAN: Nâng cấp toàn diện NEXUS NFT Marketplace

## Tổng quan dự án hiện tại

| Tiêu chí | Hiện trạng |
|-----------|-----------|
| **Framework** | Next.js 16.2.4 + React 19 + TypeScript |
| **Blockchain** | Solana (devnet) — @solana/web3.js v1 |
| **Database** | Supabase (PostgreSQL) |
| **State** | Zustand + persist (localStorage) |
| **UI** | Tailwind v4 + Framer Motion + Lucide Icons |
| **Pages** | 8 trang (Home, Explore, Create, Activity, Profile, NFT Detail, Auctions, Auction Detail) |
| **API Routes** | 5 route groups (nfts, listings, auctions, activities, upload) |
| **Tests** | Vitest — rất ít test, chủ yếu constants/store |

---

## 🔴 CRITICAL — Cần sửa ngay

### 1. Bảo mật API Routes (SEVERITY: HIGH)

> [!CAUTION]
> Tất cả API routes hiện tại **KHÔNG CÓ authentication**. Bất kỳ ai cũng có thể gọi `POST /api/nfts` để inject dữ liệu giả vào database.

**Hiện tại:**
- Không verify wallet signature trên server
- Không rate limiting
- Không input validation (SQL injection potential qua search params)
- Supabase anon key dùng public RLS policies (allow all)

**Đề xuất:**
- Verify wallet signature trên mỗi API call (sign message → server verify)
- Thêm rate limiting middleware (ví dụ: `upstash/ratelimit`)
- Server-side input sanitization cho search queries
- RLS policies nên dùng wallet-based auth thay vì `USING (true)`

---

### 2. Auction Logic — Không có Escrow (SEVERITY: HIGH)

> [!WARNING]
> Hệ thống đấu giá hiện tại **chuyển SOL trực tiếp cho seller khi bid**, không sử dụng escrow. Nếu bidder mới outbid, SOL của bidder cũ đã mất và không được refund.

**Hiện tại (file `auction.ts`):**
```
placeBid → SystemProgram.transfer → seller nhận SOL ngay lập tức
```

**Vấn đề:**
- Bidder cũ mất SOL khi bị outbid (không có refund mechanism)
- Seller nhận SOL trước khi auction kết thúc
- Không có escrow PDA để hold fund

**Đề xuất:**
- Implement Solana escrow program (PDA holds fund)
- Khi bị outbid → tự động refund cho bidder cũ
- Seller chỉ nhận SOL khi auction settle

---

### 3. Listing — Không có SPL Token Transfer khi Buy (SEVERITY: MEDIUM)

> [!WARNING]
> Khi mua NFT qua listing, hệ thống chỉ chuyển SOL từ buyer → seller. **KHÔNG chuyển SPL token (NFT) từ seller → buyer** trên blockchain.

**Hiện tại (file `marketplace.ts`):**
- `listNFT()` → chỉ sign message, không escrow NFT
- `buyNFT()` → chỉ transfer SOL, không transfer SPL token
- NFT ownership chỉ update trong database, không trên chain

**Đề xuất:**
- Sử dụng `transferNFT()` (đã có sẵn trong code nhưng chưa được gọi!) 
- Hoặc tạo escrow: `list → escrow NFT → buy → release NFT + SOL`
- Atomic swap: dùng 1 transaction chứa cả SOL transfer + NFT transfer

---

## 🟠 IMPORTANT — Nên cải thiện sớm

### 4. React Query không được sử dụng

`@tanstack/react-query` đã cài nhưng **không dùng ở bất cứ đâu**. Hiện dùng custom hooks với `useState` + `useEffect` + `useCallback` thủ công.

**Đề xuất:**
- Chuyển tất cả data fetching sang React Query
- Tận dụng: caching, stale-while-revalidate, background refetch, retry logic
- Loại bỏ hệ thống `refreshKey` thủ công (React Query đã có `invalidateQueries`)
- Giảm đáng kể code trong `useData.ts` (hiện ~260 dòng → có thể còn ~80 dòng)

---

### 5. Xóa Zustand Persist hoặc giảm phạm vi

**Vấn đề:**
- Zustand persist lưu **toàn bộ listings, auctions, activities, mintedNFTs** vào localStorage
- Dữ liệu cũ (stale) trong localStorage xung đột với Supabase data
- Gây "ghost data" — NFT đã bán vẫn hiện trong list
- Cross-browser sync đã được fix nhưng localStorage vẫn gây confusion

**Đề xuất:**
- **Option A:** Xóa hoàn toàn `persist` → Supabase là single source of truth
- **Option B:** Chỉ persist `theme`, `favorites` — data transactional không persist
- Thêm cache invalidation khi Supabase data thay đổi

---

### 6. Mobile Responsiveness

**Vấn đề:** 
- Header chưa có mobile menu (hamburger)
- Bid form trên auction page khó dùng trên mobile
- NFT grid không tối ưu cho small screens

**Đề xuất:**
- Thêm mobile hamburger menu + slide drawer
- Bottom action bar cho NFT detail (Buy/List buttons)
- Touch-friendly bid input

---

### 7. Error Handling & Loading UX

**Vấn đề:**
- Blockchain transactions có thể fail silently
- Không có retry mechanism
- Không có transaction status tracking (pending → confirmed → finalized)

**Đề xuất:**
- Transaction progress modal (step 1: signing → step 2: confirming → step 3: done)
- Retry button khi transaction fail
- Toast hiện transaction link ngay khi submit (trước khi confirmed)

---

## 🟡 NICE TO HAVE — Cải tiến nâng cao

### 8. Tính năng mới

| Tính năng | Mô tả | Độ phức tạp |
|-----------|--------|-------------|
| **Search/Filter cải tiến** | Full-text search, price range slider, trait filters | Medium |
| **Like/Favorite NFT** | Nút Like hiện chưa hoạt động (UI-only) | Easy |
| **Share functionality** | Nút Share hiện chưa hoạt động | Easy |
| **Notifications** | Thông báo khi bị outbid, auction kết thúc, NFT được bán | Hard |
| **Offer system** | Cho phép đặt offer cho NFT chưa listed | Medium |
| **Collection creation UI** | Tạo/quản lý collection từ dashboard | Medium |
| **Transfer NFT** | Gửi NFT cho wallet khác (code đã có `transferNFT()` nhưng chưa có UI) | Easy |
| **Price history chart** | Biểu đồ giá NFT qua thời gian (recharts đã cài) | Medium |
| **Leaderboard** | Top collectors, top sellers | Easy |
| **Admin dashboard** | Quản lý reports, ban users, moderate content | Hard |

---

### 9. Performance & Infrastructure

| Vấn đề | Đề xuất |
|---------|---------|
| **Image optimization** | Dùng Supabase Storage hoặc Cloudinary thay vì IPFS gateway trực tiếp |
| **API caching** | Thêm `Cache-Control` headers hoặc dùng Vercel Edge Caching |
| **Bundle size** | Audit với `@next/bundle-analyzer` — recharts + framer-motion có thể nặng |
| **Database indexes** | Đã tạo indexes nhưng cần monitor query performance |
| **Connection pooling** | Supabase singleton tốt, nhưng cần xem xét khi scale |
| **SEO** | Thiếu meta tags, Open Graph, dynamic SEO cho NFT pages |

---

### 10. Testing

**Hiện tại:** Gần như không có test coverage.

| Layer | Hiện tại | Đề xuất |
|-------|----------|---------|
| **Unit tests** | 2-3 file (constants, store) | Test tất cả hooks, utils, store actions |
| **Integration tests** | 0 | Test API routes với mock Supabase |
| **E2E tests** | 0 | Playwright: mint → list → buy flow |
| **Contract tests** | 0 | Test Solana transaction building |

---

### 11. Code Quality

| Vấn đề | Chi tiết |
|---------|----------|
| **Duplicate code** | NFT detail page 400+ dòng — nên tách thành components |
| **Type safety** | Nhiều chỗ dùng `Record<string, unknown>` thay vì typed interfaces |
| **Environment validation** | Không validate env vars lúc build (zod schema) |
| **Unused imports** | `createMint`, `getOrCreateAssociatedTokenAccount`, `mintTo` imported nhưng không dùng trực tiếp |

---

## 📊 Ma trận ưu tiên

| # | Vấn đề | Impact | Effort | Priority |
|---|--------|--------|--------|----------|
| 1 | Security (API auth) | 🔴 HIGH | Medium | **P0** |
| 2 | Auction Escrow | 🔴 HIGH | Hard | **P0** |
| 3 | NFT Transfer on Buy | 🔴 HIGH | Medium | **P0** |
| 4 | Migrate React Query | 🟠 HIGH | Medium | **P1** |
| 5 | Remove Persist | 🟠 HIGH | Easy | **P1** |
| 6 | Mobile UX | 🟠 MED | Medium | **P1** |
| 7 | Error/Loading UX | 🟠 MED | Medium | **P2** |
| 8 | New Features | 🟡 MED | Variable | **P2** |
| 9 | Performance/SEO | 🟡 MED | Medium | **P2** |
| 10 | Testing | 🟡 MED | Hard | **P3** |
| 11 | Code Quality | 🟡 LOW | Easy | **P3** |

---

## 🗺️ Lộ trình đề xuất

### Phase 1: Foundation (1-2 ngày)
- [ ] Fix #1: API authentication (wallet signature verify)
- [ ] Fix #5: Xóa Zustand persist cho transactional data
- [ ] Fix #4: Migrate sang React Query
- [ ] Fix #11: Refactor large components

### Phase 2: Core Logic (2-3 ngày)
- [ ] Fix #3: Integrate `transferNFT()` vào buy flow
- [ ] Fix #2: Implement basic escrow cho auctions
- [ ] Fix #7: Transaction progress UX
- [ ] Fix #6: Mobile responsiveness

### Phase 3: Features (2-3 ngày)
- [ ] Fix #8: Like/Favorite, Share, Transfer UI
- [ ] Fix #8: Price history chart (recharts đã sẵn)
- [ ] Fix #8: Search/Filter cải tiến
- [ ] Fix #9: SEO + performance optimization

### Phase 4: Quality (1-2 ngày)  
- [ ] Fix #10: Unit tests cho hooks + utils
- [ ] Fix #10: Integration tests cho API routes
- [ ] Fix #10: E2E test cho core flows
- [ ] Documentation update

---

## ❓ Câu hỏi cho bạn

1. **Ưu tiên nào?** Bạn muốn bắt đầu từ phase nào? Security, features, hay UX?
2. **Deployment target?** Vercel, self-hosted, hay cloud khác?
3. **Mainnet timeline?** Dự định deploy lên mainnet không? Điều này ảnh hưởng lớn đến priority của escrow/security.
4. **Budget cho external services?** Rate limiting (Upstash), image hosting (Cloudinary), monitoring (Sentry)?
5. **Mục đích project?** Portfolio/học tập hay production dùng thật?
