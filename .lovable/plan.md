

## Plan: Update Upgrade Page — Launch Sale Pricing

### Changes

#### 1. Remove story preview carousel — `src/pages/Upgrade.tsx`
- Delete the `<StoryPreviewCarousel />` render (line 322-323)
- Remove the import (line 22)

#### 2. Update pricing — `src/config/pricing.ts`
Add `originalPrice` field to each package and update `price` and `pricePerStory`:

| Package | Original | Sale | Per Story |
|---------|----------|------|-----------|
| 5 stories | ₪49 | ₪35 | 7₪ |
| 10 stories | ₪89 | ₪65 | 6.5₪ |
| 15 stories | ₪129 | ₪95 | 6.3₪ |

#### 3. Show strikethrough pricing — `src/pages/Upgrade.tsx`
In the package card rendering (lines 362-367), show original price with strikethrough above the sale price:

```tsx
<div className="text-sm text-white/40 line-through">₪{pkg.originalPrice}</div>
<div className="text-xl font-black text-white">₪{pkg.price}</div>
```

#### 4. Update offer badge text (line 329)
Change from `"🔥 מבצע מיוחד"` to `"מחיר השקה מיוחד 🔥"`

#### 5. Add expiry text below countdown timer (after line 335)
```tsx
<p className="text-center text-white/70 text-xs mb-3">המבצע בתוקף עד 10.4.26 בלבד</p>
```

### Files modified
1. `src/config/pricing.ts` — add `originalPrice`, update `price` and `pricePerStory`
2. `src/pages/Upgrade.tsx` — remove carousel, add strikethrough prices, update badge text, add expiry line

