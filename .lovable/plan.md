

# Plan: Update Edit Logic to Sync with Package Free Edits

## Current State Analysis

The editing system currently has two separate, partially conflicting mechanisms:
1. **`use-story-edit.ts`** -- gives the first edit per story for free, then deducts from `story_credits` (same credits used for creating stories)
2. **`use-edit-credits.ts`** -- daily limit of 5 edit credits that resets every 24 hours (stored in `profiles.daily_edit_credits`)

Neither mechanism actually tracks how many free edits came with a purchased package. The `freeEdits` field in the pricing config (5/10/15/25) is displayed on the Upgrade page but never stored or enforced.

## Proposed Solution

Replace the current daily-reset system with a **package-based free edits pool** stored on the user profile. When a user purchases a package, they receive both story credits AND a matching number of free edits.

### Database Changes

Add two new columns to the `profiles` table:
- `free_edits_remaining` (integer, default 0) -- how many free edits the user has left
- `free_edits_total` (integer, default 0) -- total free edits granted (for display purposes)

### Purchase Flow Update (`src/pages/Upgrade.tsx`)

When a package is purchased (PayPal success, test purchase, educator package), in addition to `addCredits(pkg.stories)`, also update the profile:
- Add `pkg.freeEdits` (or `pkg.stories` since they match 1:1) to `free_edits_remaining`
- Update `free_edits_total` accordingly

### Hook Refactor (`src/hooks/use-edit-credits.ts`)

Rewrite to use the new `free_edits_remaining` column instead of `daily_edit_credits`:
- `hasEditCredits()` returns true if `free_edits_remaining > 0`
- `useEditCredit()` decrements `free_edits_remaining` by 1
- Remove all daily-reset logic
- Expose `freeEditsRemaining` and `freeEditsTotal` for UI display

### Edit Dialog Update (`src/components/story/edit-page-dialog.tsx`)

Replace the current static messages:
- If user has free edits remaining: show "You have X free edits remaining in your package" (in Hebrew)
- If user has 0 free edits: show "Your free edits have been used. Each edit costs 1 credit"
- Remove the "first edit is free" per-story logic

### Story Edit Hook Update (`src/hooks/use-story-edit.ts`)

Simplify to use `useEditCredits` instead of `useCredits`:
- Remove the "first edit free" per-story logic
- Use the package-based free edits pool first
- Only fall back to story credits when free edits are exhausted

### Story Viewer Update (`src/pages/StoryViewer.tsx`)

Update the edit confirmation dialog to show the dynamic message about remaining free edits instead of the static "first edit free" text.

## Technical Details

### Migration SQL
```text
ALTER TABLE profiles ADD COLUMN free_edits_remaining integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN free_edits_total integer DEFAULT 0;
```

### Files to Modify
1. **Database migration** -- add `free_edits_remaining` and `free_edits_total` columns
2. **`src/hooks/use-edit-credits.ts`** -- rewrite to use package-based pool instead of daily reset
3. **`src/hooks/use-story-edit.ts`** -- remove first-edit-free logic, integrate with new edit credits
4. **`src/pages/Upgrade.tsx`** -- add free edits when purchasing a package
5. **`src/components/story/edit-page-dialog.tsx`** -- dynamic remaining edits message
6. **`src/pages/StoryViewer.tsx`** -- update confirmation dialog text
7. **`src/config/pricing.ts`** -- update educator package `freeEdits` from 2 to 25 to match stories count

### Message Logic
- Free edits > 0: "נותרו לך X עריכות בחינם בחבילה" (friendly reminder before editing)
- Free edits = 0: "העריכות בחינם נוצלו. כל עריכה עולה 1 קרדיט" (shown as info, not blocking)
- No package purchased: standard credit cost message
