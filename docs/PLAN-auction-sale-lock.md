# PLAN: Mutual Exclusion — Auction vs Fixed-Price Sale

## Mục tiêu

Ngăn chặn conflict khi 1 NFT được đồng thời đấu giá (auction) và bán giá cố định (listing). Giống cách hoạt động thực tế của **OpenSea**, **Magic Eden**: **NFT chỉ có thể ở 1 trạng thái bán tại 1 thời điểm.**

## Hành vi mong đợi

| Trạng thái hiện tại | Hành động | Kết quả |
|---|---|---|
| NFT idle (không list, không auction) | List for Sale | ✅ Cho phép |
| NFT idle | Create Auction | ✅ Cho phép |
| NFT đang **listed** | Create Auction | ❌ Chặn — hiển thị "Cancel listing first" |
| NFT đang **auction active** | List for Sale | ❌ Chặn — hiển thị "Active auction exists" |
| NFT đang **auction active** | Create Auction | ❌ Chặn — hiển thị "Active auction exists" |
| Auction ended + settled | List for Sale / Auction | ✅ Cho phép (owner mới) |

---

## Thay đổi cần thực hiện

### 1. Frontend — NFT Detail Page

#### [MODIFY] [page.tsx](file:///e:/Antigarvity/NFT-Marketplace/src/app/nft/[mint]/page.tsx)

- **Fetch auction status** cho NFT hiện tại từ `useFetchAuctions()` data
- Thêm biến `hasActiveAuction`: kiểm tra `auctions.some(a => a.nft.mint === mint && (a.status === 'active' || new Date(a.endTime) > Date.now()))`
- **Owner Actions section** (line 270-364):
  - Khi `hasActiveAuction = true`: Ẩn cả "LIST FOR SALE" và "CREATE AUCTION", hiển thị badge "Active Auction" + link đến trang auction
  - Khi `isListed = true`: Ẩn "CREATE AUCTION" (chỉ hiện "Cancel Listing")
  - Khi cả 2 = false: Hiển thị cả 2 nút (hiện tại)
- **Mobile bottom bar** (line 477-487): Áp dụng cùng logic

### 2. Backend — API Validation (Server-side guard)

#### [MODIFY] [listings/route.ts](file:///e:/Antigarvity/NFT-Marketplace/src/app/api/listings/route.ts)

- Trong `POST` handler, trước khi insert listing:
  - Query `auctions` table: kiểm tra có auction `active` nào cho `mint` này không
  - Nếu có → return `409 Conflict: "NFT has an active auction. Cancel or settle the auction first."`

#### [MODIFY] [auctions/route.ts](file:///e:/Antigarvity/NFT-Marketplace/src/app/api/auctions/route.ts)

- Trong `POST` handler, trước khi insert auction:
  - Query `listings` table: kiểm tra có listing `active` nào cho `nft_mint` này không
  - Query `auctions` table: kiểm tra có auction `active` nào cho `nft_mint` này không
  - Nếu có listing → return `409: "NFT is currently listed for sale. Cancel the listing first."`
  - Nếu có auction → return `409: "NFT already has an active auction."`

### 3. Frontend — Hook Error Handling

#### [MODIFY] [useMarketplace.ts](file:///e:/Antigarvity/NFT-Marketplace/src/hooks/useMarketplace.ts)

- `useListNFT`: đã có error toast, API error 409 sẽ tự hiển thị qua `addToast(msg, 'error')`

#### [MODIFY] [useAuction.ts](file:///e:/Antigarvity/NFT-Marketplace/src/hooks/useAuction.ts)

- `useCreateAuction`: tương tự, error từ API đã được handle

---

## Tổng kết Files

| File | Thay đổi |
|---|---|
| `src/app/nft/[mint]/page.tsx` | Thêm auction check → ẩn/hiện buttons |
| `src/app/api/listings/route.ts` | Server-side guard: chặn list khi có auction |
| `src/app/api/auctions/route.ts` | Server-side guard: chặn auction khi có listing/auction |

**Không cần thay đổi:**
- Database schema (không cần thêm cột)
- Hooks (error handling đã có sẵn)
- Stores (không ảnh hưởng)

---

## Verification

1. Mint 1 NFT → Create Auction → Xác nhận nút "LIST FOR SALE" bị ẩn
2. Mint 1 NFT → List for Sale → Xác nhận nút "CREATE AUCTION" bị ẩn
3. Cancel listing → Xác nhận cả 2 nút xuất hiện lại
4. Auction settled → Xác nhận owner mới có thể list/auction bình thường
5. Test API trực tiếp: POST listing khi có auction → Expect 409
