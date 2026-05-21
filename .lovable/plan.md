
# Cleanup of the purchase page (`src/pages/Upgrade.tsx`)

All edits are scoped to `src/pages/Upgrade.tsx` only. No logic, hooks, or other files change.

## Changes

1. **Remove subtitle text** under "אהבתם? 💛"
   - Delete the `subtitle` constant (line 71) and the `<p>` rendering `{subtitle}` (lines 319–321), leaving only the H1 title.

2. **Remove the collapsible "✨ הרבה יותר מסיפור רגיל" section**
   - Delete the entire collapsible block (lines 339–383): the toggle button + features grid.
   - Also remove the now-unused state `showFeatures` (line 52), the `FEATURES` array (lines 54–66), and the `ChevronDown` import (line 3).

3. **Move the book mockup (`<FlippingBookAnimation />`) below the packages**
   - Remove it from line 386 (above the parent packages grid).
   - Re-insert it after the parent packages grid closes (after line 437) and before the "תשלום חד פעמי" tagline (line 439). It will live between the package cards and the rest of the page so it sits *below* the packages but above the coupon/upsells.

4. **Move "✨ 1 קרדיט = 1 סיפור מלא + איורים" into each package card**
   - Remove the standalone Badge block (lines 324–329).
   - Inside each parent package card (after the `pricePerStory` line, ~line 418) add a small line:
     ```tsx
     <div className="text-[10px] text-white/70 font-semibold mt-1">
       ✨ 1 קרדיט = סיפור מלא
     </div>
     ```
   - Apply the same small line inside each educator package card (after line 497).

5. **Remove the edit kit (₪9.9) and coloring kit (₪19.9) "בקרוב" upsell cards entirely**
   - Delete the whole `{/* Upsell Packages — 2 column grid */}` block (lines 526–585).
   - Also delete the now-unused `{showColoringKitPayPal && ...}` block (lines 587–623) and `{showEditKitPayPal && ...}` block (lines 625–662), since those packages are gone.
   - Remove the related state `showEditKitPayPal`, `showColoringKitPayPal` (lines 40–41), the `'coloring'` and `'edit'` branches in `handleRetry` (lines 235–236), and the unused imports `EDIT_KIT_PACKAGE, COLORING_KIT_PACKAGE` (line 21).

6. **Verify balanced layout**
   - After all removals, confirm spacing reads as: Title → Packages → Book mockup → "תשלום חד פעמי…" tagline → Coupon → Credit Card note → Gift card "בקרוב" → Privacy → Fixed CTA. No empty gaps remain.

## What stays unchanged
- All purchase logic, PayPal flows for main packages, educator packages, coupon, toolkit, success/failure modals.
- Gift card "בקרוב" link, credit card note, privacy text, fixed bottom CTA.
- Pricing config and other pages.
