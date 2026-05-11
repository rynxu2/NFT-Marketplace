# PLAN: Feature Proposals — Nâng cấp NEXUS Marketplace

## Phân tích hiện trạng

### ✅ Các tính năng đã có
| # | Feature | Trạng thái |
|---|---|---|
| 1 | Mint NFT (upload → IPFS → Solana) | ✅ Hoàn thiện |
| 2 | List NFT (fixed-price) | ✅ Hoàn thiện |
| 3 | Cancel Listing | ✅ Hoàn thiện |
| 4 | Buy NFT | ✅ Hoàn thiện |
| 5 | Auction (create, bid, settle) | ✅ Hoàn thiện |
| 6 | Mutual exclusion auction/sale | ✅ Hoàn thiện |
| 7 | Transfer NFT | ✅ Hoàn thiện |
| 8 | Profile (owned, created, listed, won, activity) | ✅ Hoàn thiện |
| 9 | Explore + Filters + Search | ✅ Hoàn thiện |
| 10 | Activity Feed (global) | ✅ Hoàn thiện |
| 11 | Collection pages | ✅ Hoàn thiện |
| 12 | Price History Chart | ✅ Hoàn thiện |
| 13 | Dark/Light theme | ✅ Hoàn thiện |
| 14 | Like / Share NFT | ✅ Hoàn thiện |

### ❌ Các tính năng CHƯA CÓ (so với OpenSea, Magic Eden, Tensor)

| # | Feature | Đối thủ có |
|---|---|---|
| 1 | Collection Offer (đặt giá mua cả collection) | OpenSea, Magic Eden |
| 2 | Make Offer (đặt giá mua NFT cụ thể) | OpenSea, Magic Eden, Tensor |
| 3 | Watchlist / Favorites (bookmark NFT) | OpenSea, Magic Eden |
| 4 | Notification System (real-time alerts) | Tất cả |
| 5 | Stats / Analytics Dashboard | Tensor, Magic Eden |
| 6 | Bulk Actions (sweep floor, batch list) | Tensor |
| 7 | Rarity Ranking trong collection | Magic Eden |
| 8 | Creator Verification / Badges | OpenSea, Magic Eden |

---

## 🌟 Đề xuất 5 tính năng nổi bật nhất (khả thi + Impact cao)

Tôi đánh giá theo 3 tiêu chí:
- **Impact**: Ấn tượng với người dùng và giám khảo
- **Feasibility**: Khả thi với tech stack hiện tại (Next.js + Supabase + Solana Devnet)
- **Uniqueness**: Khác biệt so với dự án sinh viên thông thường

---

### Feature 1: 🔥 Make Offer (Đặt giá mua NFT)
**Impact: ⭐⭐⭐⭐⭐ | Feasibility: ⭐⭐⭐⭐⭐ | Priority: P0**

> Cho phép người dùng đặt giá mua (offer) cho bất kỳ NFT nào, kể cả chưa listed. Owner có thể accept/reject offer.

**Tại sao nổi bật:**
- Đây là tính năng **core** của mọi marketplace thực tế
- Tăng thanh khoản — NFT không cần phải list mới bán được
- Tạo thêm tương tác giữa buyer ↔ seller

**Thay đổi kỹ thuật:**
- **Database**: Thêm bảng `offers` (id, nft_mint, bidder, amount, status, expires_at)
- **API**: `POST /api/offers` (create), `PATCH /api/offers/[id]` (accept/reject)
- **UI**: Nút "Make Offer" trên NFT detail + panel hiển thị offers
- **Hook**: `useOffer` (create, accept, reject)
- **Activity**: Log offer/accept events

**Số files:** ~8 files mới + 3 files sửa

---

### Feature 2: ⭐ Watchlist / Favorites
**Impact: ⭐⭐⭐⭐ | Feasibility: ⭐⭐⭐⭐⭐ | Priority: P1**

> Cho phép người dùng bookmark NFT vào danh sách yêu thích, hiện tab "Watchlist" trên profile.

**Tại sao nổi bật:**
- UX cơ bản nhưng tạo cảm giác marketplace **hoàn chỉnh**
- Hiện tại nút Like chỉ lưu localStorage — upgrade thành server-side watchlist
- Thêm tab "Favorites" trong Profile page

**Thay đổi kỹ thuật:**
- **Database**: Thêm bảng `favorites` (user_address, nft_mint, created_at)
- **API**: `POST /api/favorites`, `DELETE /api/favorites`, `GET /api/favorites?user=xxx`
- **UI**: Nút Heart trên NFTCard → toggle server-side + Tab "Favorites" trên Profile
- **Hook**: `useFavorites` (toggle, list)

**Số files:** ~5 files mới + 3 files sửa

---

### Feature 3: 📊 Collection Stats / Leaderboard
**Impact: ⭐⭐⭐⭐⭐ | Feasibility: ⭐⭐⭐⭐ | Priority: P1**

> Trang Stats hiển thị bảng xếp hạng collections theo volume, floor price, số items, số owners.

**Tại sao nổi bật:**
- Tạo ấn tượng mạnh — thể hiện marketplace **data-driven** và chuyên nghiệp
- Bảng xếp hạng tạo cảm giác cạnh tranh, thu hút người dùng quay lại
- Có thể tích hợp mini-charts (sparkline) cho volume trend

**Thay đổi kỹ thuật:**
- **API**: `GET /api/stats` — aggregate từ activities + listings + auctions
- **UI**: Trang `/stats` với table xếp hạng, sparkline volume 7d, floor price
- **Component**: `StatsTable`, `SparklineChart`
- **Navigation**: Thêm link "Stats" vào Header

**Số files:** ~5 files mới + 2 files sửa

---

### Feature 4: 🔔 Notification Center
**Impact: ⭐⭐⭐⭐ | Feasibility: ⭐⭐⭐⭐ | Priority: P2**

> Bell icon trên navbar hiển thị thông báo real-time: outbid, offer received, auction ending, sale complete.

**Tại sao nổi bật:**
- Giữ chân người dùng, tạo urgency (FOMO) cho auction
- Polling từ Supabase hoặc Supabase Realtime
- Rất ít dự án sinh viên có notification system

**Thay đổi kỹ thuật:**
- **Database**: Thêm bảng `notifications` (user_address, type, message, read, data)
- **API**: `GET /api/notifications`, `PATCH /api/notifications/[id]/read`
- **UI**: Bell icon + dropdown panel + unread badge
- **Backend trigger**: Insert notification khi có bid, offer, sale

**Số files:** ~6 files mới + 4 files sửa

---

### Feature 5: 🏆 Leaderboard — Top Traders / Collectors
**Impact: ⭐⭐⭐⭐ | Feasibility: ⭐⭐⭐⭐⭐ | Priority: P2**

> Bảng xếp hạng top buyers, sellers, minters theo volume, số lượng giao dịch.

**Tại sao nổi bật:**
- Gamification — khuyến khích người dùng giao dịch nhiều hơn
- Tạo social proof, cạnh tranh lành mạnh
- Có thể gộp chung với Feature 3 (trang `/stats`)

**Thay đổi kỹ thuật:**
- **API**: `GET /api/leaderboard` — aggregate từ activities
- **UI**: Section trong trang `/stats` hoặc trang riêng `/leaderboard`
- **Component**: `LeaderboardTable` với avatar, address, volume, rank

**Số files:** ~3 files mới + 1 file sửa

---

## Tổng hợp & Khuyến nghị

| # | Feature | Priority | Effort | Impact | Khuyến nghị |
|---|---|---|---|---|---|
| 1 | Make Offer | P0 | ~3h | ⭐⭐⭐⭐⭐ | **Làm ngay** — core feature |
| 2 | Watchlist / Favorites | P1 | ~2h | ⭐⭐⭐⭐ | **Làm ngay** — dễ, impact cao |
| 3 | Collection Stats | P1 | ~3h | ⭐⭐⭐⭐⭐ | **Làm ngay** — ấn tượng nhất |
| 4 | Notification Center | P2 | ~3h | ⭐⭐⭐⭐ | Nếu có thời gian |
| 5 | Leaderboard | P2 | ~2h | ⭐⭐⭐⭐ | Gộp với Stats |

### Lộ trình đề xuất:
1. **Phase 1** (ngay): Make Offer + Watchlist + Stats — 3 features tạo khác biệt lớn nhất
2. **Phase 2** (nếu đủ thời gian): Notification + Leaderboard — polish thêm

> **Ước tính tổng:** ~13h cho 5 features, ~8h cho Phase 1

---

## Câu hỏi cho bạn

1. Bạn muốn làm cả 5 hay chọn một số features cụ thể?
2. Thứ tự ưu tiên này có đúng ý bạn không?
3. Có feature nào bạn muốn thêm/bỏ không?
