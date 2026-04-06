
## Plan: Fix Coloring Kit Purchase Flow

### Problems Found
1. **Wrong retry behavior**: When coloring/edit kit purchase fails → `setShowFailed(true)` → user clicks "נסו שוב" → `handleRetry` always opens story package PayPal (`setShowPayPal(true)`) instead of re-opening the correct kit PayPal.
2. **Wrong success modal after coloring kit purchase**: After successful coloring kit purchase, `PurchaseSuccessModal` shows "הסיפורים שלך מוכנים לקסם!" and an edit-kit upsell — irrelevant for a coloring kit purchase.
3. **"תהלים" typo**: Could not find this word anywhere in the codebase. It may appear in PayPal's own Hebrew UI or a browser element. If you can screenshot where you see it, I can investigate further.

### Fix — single file: `src/pages/Upgrade.tsx`

**1. Track which purchase type failed (line ~44)**
Add state to remember what was being purchased when failure occurred:
```ts
const [failedPurchaseType, setFailedPurchaseType] = useState<'stories' | 'coloring' | 'edit' | 'educator' | 'toolkit' | null>(null);
```

**2. Set `failedPurchaseType` in each error handler**
- Story package error (line ~205): `setFailedPurchaseType('stories')`
- Coloring kit error (line ~629): `setFailedPurchaseType('coloring')`
- Edit kit error (line ~674): `setFailedPurchaseType('edit')`
- Educator error (line ~505): `setFailedPurchaseType('educator')`
- Toolkit error (line ~252): `setFailedPurchaseType('toolkit')`

**3. Fix `handleRetry` (line 221)**
Replace:
```ts
const handleRetry = () => { setShowFailed(false); setShowPayPal(true); };
```
With:
```ts
const handleRetry = () => {
  setShowFailed(false);
  switch (failedPurchaseType) {
    case 'coloring': setShowColoringKitPayPal(true); break;
    case 'edit': setShowEditKitPayPal(true); break;
    case 'educator': setShowEducatorPayPal(true); break;
    case 'toolkit': setShowToolkitPayPal(true); break;
    default: setShowPayPal(true); break;
  }
  setFailedPurchaseType(null);
};
```

**4. After coloring kit success — show simple toast instead of wrong modal**
Replace lines 621-623:
```ts
setShowColoringKitPayPal(false);
setPurchasedCredits(0);
setShowSuccess(true);
```
With:
```ts
setShowColoringKitPayPal(false);
```
(Remove `setShowSuccess(true)` — the toast `🎨 נוספו 5 דפי צביעה בהצלחה!` on line 626 is sufficient. No need to show the story-oriented success modal with edit-kit upsell.)

**5. Same fix for edit kit success (lines 667-669)**
Remove `setShowSuccess(true)` — the toast on line 671 already confirms success.

### What stays the same
- All design, colors, layout, buttons
- Story package purchase flow (unchanged)
- PurchaseSuccessModal component (unchanged)
- All other files
