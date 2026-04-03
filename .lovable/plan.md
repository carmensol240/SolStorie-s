

## Plan: Add 9-12 Age Range Near English Button

### Current Layout
The form has a 3-column grid: Age (left) | Length (center) | Language (right). Age has 3 buttons (0-2, 3-6, 7-8). Language has 2 buttons (עברית, EN). There's empty space below the EN button.

### Approach
Add a "9-12" age button positioned below the EN language button in the Language column, with a small hint label connecting it to English stories. This keeps it visually associated with EN without breaking the grid layout.

### Changes — `src/components/wizard/ChildInfoStep.tsx`

1. **Add 9-12 to AGE_BUTTONS array** (line 53): Add `{ id: "9-12", label: "9-12", range: "8-10" as const }` — maps to the existing internal `8-10` range.

2. **Update `rangeToDisplayButton`** (line 69): Add case for `"8-10"` returning `"9-12"` instead of falling through to `"7-8"`.

3. **Split age buttons rendering** (lines 576-590): Render only the first 3 age buttons (0-2, 3-6, 7-8) in the Age column as before.

4. **Add 9-12 button below EN button** (after line 658): Inside the Language column, after the EN button, add the 9-12 age button with a small connecting label like `✨ גיל 9-12` styled to hint it pairs well with English stories. It will call the same `handleAgeButtonSelect("9-12")` and use the same selected styling.

### Also update — `src/pages/CreateStory.tsx`
No changes needed — the `ageRange` type already includes `"8-10"` which is what 9-12 maps to.

### Files modified
1. `src/components/wizard/ChildInfoStep.tsx` — add 9-12 age option, render it below EN button

