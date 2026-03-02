

## Findings: Gift Card Purchase Flow Has a Critical RLS Bug

### What Works
- Gift page UI renders correctly on mobile
- Package selection (5/10/15 stories) works
- Unauthenticated users are correctly redirected to login with `returnTo=/gift`
- WhatsApp share message format matches the spec
- Copy code button and success screen layout look good

### Critical Bug Found: Coupon Creation Fails for Regular Users

The `coupons` table has an INSERT RLS policy that **only allows admins** to insert rows. When a regular user completes a PayPal payment and the code tries to create a coupon (`supabase.from("coupons").insert(...)`), it will **fail** because the user isn't an admin.

**Impact**: The user pays via PayPal but never receives a coupon code. The payment is captured but the gift is broken.

**Same issue in CouponInput.tsx**: After redeeming a coupon, the code tries to UPDATE `coupons` to increment `current_uses` — this also fails for non-admin users.

### Fix Plan

1. **Add RLS policy for authenticated users to INSERT coupons** — restricted to `coupon_type = 'extra_stories'` and `max_uses = 1` (gift cards only)
2. **Add RLS policy for authenticated users to UPDATE `current_uses`** on coupons — so coupon redemption can increment the counter
3. Alternatively (more secure): **Move coupon creation to an Edge Function** that uses the service role key, so the client never directly inserts into `coupons`. This prevents users from creating arbitrary coupons.

**Recommended approach**: Edge Function (option 3) is safer since allowing client-side coupon INSERT opens potential abuse vectors. The Edge Function would:
- Accept the package details and verify the purchase
- Create the coupon server-side with `SUPABASE_SERVICE_ROLE_KEY`
- Return the generated code to the client

### Secondary Issue: forwardRef Warning Still Present
The `App` component forwardRef fix from the previous message isn't fully working — the warning still appears in console. This is cosmetic but should be addressed.

### Implementation Steps
1. Create a new Edge Function `create-gift-coupon` that handles coupon creation securely
2. Update `GiftCard.tsx` to call the Edge Function instead of direct `supabase.from("coupons").insert()`
3. Update `CouponInput.tsx` to use an Edge Function for coupon redemption (increment `current_uses`) instead of direct client-side UPDATE
4. Fix the remaining forwardRef warning in `App.tsx`

