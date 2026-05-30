## Goal
Allow gift card purchases via Grow (in addition to PayPal) to automatically generate a unique coupon code, then display it on the success screen with copy + WhatsApp share options — identical to the current PayPal flow.

## Design decisions (per user answers)
- Reuse existing Grow links (basic / popular / premium prices match regular packages — same amounts). A `gift=1` flag identifies gift purchases.
- Recipient info (childName, senderName) is saved to a new `pending_gifts` table before redirecting to Grow.
- After return from Grow, GiftCard.tsx polls a lightweight Edge Function for ~30s until the webhook has written the coupon code.

## Changes

### 1. New table `pending_gifts` (migration)
Columns: `id`, `user_id`, `package_id`, `child_name`, `sender_name`, `status` (`pending` / `completed`), `coupon_code` (nullable), `created_at`, `completed_at`.
RLS: owner can SELECT/INSERT own rows; service_role can UPDATE. GRANTs for authenticated + service_role.

### 2. `src/pages/GiftCard.tsx`
- Add a "שלם בכרטיס אשראי (Grow)" button next to existing PayPal flow.
- On click: validate childName → insert a `pending_gifts` row with status=`pending` → store its `id` in `localStorage` (`pending_gift_id`) → open Grow checkout URL (existing `openGrowCheckout(selectedPackage as GrowLinkKey)` — append `?gift=1&pgid=<id>` via a small helper or use Grow custom fields if URL params unsupported — fall back to lookup by `user_id + status=pending` most-recent).
- On mount: if URL contains `?grow_return=1` (or simply on every mount when a `pending_gift_id` exists in localStorage), start polling a new edge function `get-gift-coupon` every 2s for up to 30s. When `coupon_code` returns → set `generatedCode`, `purchaseComplete=true`, clear localStorage key. Reuse the existing success screen exactly as-is.
- Show "ממתין לאישור התשלום…" spinner state during polling.

### 3. New Edge Function `get-gift-coupon`
- Auth-required (validate JWT).
- Input: `{ pendingGiftId }`.
- Returns `{ status, code }` from `pending_gifts` where `user_id = auth.uid()`.

### 4. `supabase/functions/grow-webhook/index.ts` (extend, do not break existing flow)
- After successful identification of `userId` + `packageId`, before calling `applyPurchaseCredits`:
  - Look up most-recent `pending_gifts` row for this `user_id` with `status='pending'` (matching `package_id`).
  - If found → treat as gift:
    - Generate unique coupon code (`GIFT-XXXXXXXX`, same alphabet as `create-gift-coupon`).
    - Insert into `coupons` (`coupon_type='extra_stories'`, `free_stories=<config.stories>`, `max_uses=1`, `is_active=true`).
    - Insert into `purchases` (`package_name='gift_<packageId>'`) for record-keeping. Skip `applyPurchaseCredits` (buyer should NOT receive credits — it's a gift).
    - Update `pending_gifts` row: `status='completed'`, `coupon_code=<code>`, `completed_at=now()`.
  - If not found → existing behavior (apply credits to buyer as normal purchase).
- Idempotency: keep the existing `purchases.package_name LIKE 'grow_<tx>_%'` guard.

### 5. `supabase/config.toml`
Add `[functions.get-gift-coupon] verify_jwt = false` (in-code JWT validation).

## What is NOT changed
- PayPal gift flow (`create-gift-coupon` + `handlePayPalSuccess` in GiftCard.tsx).
- Existing Grow non-gift purchase flow.
- `grow-links.ts`, `pricing.ts`, `purchase-credits.ts`.

## Risk notes
- Grow static links may not allow URL query params. The plan uses a per-user `pending_gifts` lookup (most-recent pending row matching package) as the primary match key, so query-param support isn't required.
- Race condition is bounded: a user is unlikely to start two gift purchases of the same package within the polling window.
