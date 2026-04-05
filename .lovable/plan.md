

## Plan: Update Coloring Pages in Packages

### 1. `src/config/pricing.ts`

Update `freeColoringPages` values:
- **basic (3 stories)**: `freeColoringPages: 3` → `1`
- **popular (10 stories)**: `freeColoringPages: 10` → `3`
- **premium (15 stories)**: `freeColoringPages: 15` → `5`
- **EDUCATOR_PACKAGE**: add `freeColoringPages: 8` (currently missing)

### 2. `src/pages/Upgrade.tsx`

In the educator PayPal `onSuccess` handler (line ~483), add coloring credits grant — same pattern as the regular packages:
```ts
const { data: profileData } = await supabase.from('profiles')
  .select('free_edits_remaining, free_edits_total, coloring_credits')
  .eq('id', user.id).maybeSingle();
// ... existing edits update ...
// Add: coloring_credits: (profileData?.coloring_credits ?? 0) + EDUCATOR_PACKAGE.freeColoringPages
```

Also add a coloring pages badge in the educator package UI section (after the existing label), showing "8 דפי צביעה 🎨".

### What stays the same
- All other packages, pricing, and UI
- Edge function logic
- Coloring credits hook and display

