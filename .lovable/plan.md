

## Plan: Remove Sale Prices, Keep Full Prices Only

### Single file changed: `src/pages/Upgrade.tsx`

### Changes

**1. Remove the green "חסכו" discount pill (lines 373-376)**
Delete the entire div showing "חסכו ₪X".

**2. Remove the strikethrough original price (lines 383-385)**
Delete the `line-through` div showing `₪{pkg.originalPrice}`.

**3. Update the displayed price to use `originalPrice` instead of `price` (line 387)**
Change `₪{pkg.price}` → `₪{pkg.originalPrice}` so it shows 39/99/139.

**4. Update price-per-story calculation**
The `pricePerStory` field in `pricing.ts` is based on the discounted price. Update it to reflect full prices:
- 3 stories at 39₪ → "13₪"
- 10 stories at 99₪ → "9.9₪"  
- 15 stories at 139₪ → "9.3₪"

**5. Update the CTA button text and purchase logic**
The bottom CTA button and PayPal amount references `pkg.price` / `discountedPrice`. Update these to use `originalPrice` so the actual charge matches the displayed price.

### Also update: `src/config/pricing.ts`
- Set `price` equal to `originalPrice` (39/99/139) so all purchase logic uses the full price
- Update `pricePerStory` values accordingly

### What stays the same
- All layout, design, colors, badges, coloring/editing bonuses
- Coupon system still works (applies discount on the full price)
- No other files changed

