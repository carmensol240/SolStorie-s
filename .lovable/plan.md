

## Create 5 One-Time Coupon Codes (5 Stories Each)

### What
Insert 5 unique coupon codes into the `coupons` table. Each code grants 5 free stories and can only be used once.

### Coupon Codes
| Code | Stories | Max Uses |
|------|---------|----------|
| GIFT-5STORY-A1 | 5 | 1 |
| GIFT-5STORY-B2 | 5 | 1 |
| GIFT-5STORY-C3 | 5 | 1 |
| GIFT-5STORY-D4 | 5 | 1 |
| GIFT-5STORY-E5 | 5 | 1 |

### Technical Details
- **Table**: `coupons`
- **coupon_type**: `extra_stories`
- **free_stories**: 5
- **max_uses**: 1
- **is_active**: true
- No expiration date

Single SQL INSERT with 5 rows. No code changes needed — the existing `redeem-coupon` edge function already handles `extra_stories` type coupons.

