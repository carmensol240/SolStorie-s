
## Plan: Add Dedicated Editing Credits System (Like Coloring Credits)

### Overview
Add a new `editing_credits` column to profiles and wire it through purchase, display, and consumption — exactly mirroring the `coloring_credits` pattern.

### 1. Database Migration
Add `editing_credits` integer column to `profiles` table, default 0.

### 2. Purchase flow — `src/pages/Upgrade.tsx` (lines 678-702)
Replace the edit kit `onSuccess` handler with the same robust pattern as coloring kit:
- Insert into `purchases` with error check
- Select current `editing_credits` with error check
- Update `editing_credits + 5` with error check
- Console logs at each step (`✏️ [EDIT PURCHASE]`)
- Dispatch `editing-credits-updated` custom event
- Toast: `✏️ נוספו קרדיטי עריכה!` with description and 6s duration

### 3. New hook — `src/hooks/use-editing-credits.ts`
Clone `use-coloring-credits.ts` pattern:
- Fetch `editing_credits` from profiles
- Listen for `editing-credits-updated` event
- Export `{ editingCredits, loading, refetch }`

### 4. Home screen pill — `src/components/home/LoggedInHome.tsx`
- Import `useEditingCredits` hook and `Pencil` icon
- Add third pill after coloring pill with ✏️ icon, same enlarged styling
- Always visible (like coloring credits)

### 5. Edit consumption — `src/hooks/use-story-edit.ts`
Update `performEdit` to check `editing_credits` FIRST (before `free_edits_remaining` and `story_credits`):
- Fetch `editing_credits` alongside existing fields
- If `editing_credits > 0` → deduct 1
- Else if `free_edits_remaining > 0` → deduct 1 (backward compat)
- Else if `story_credits > 0` → deduct 1
- Else → block with message: `אין קרדיטי עריכה, לחץ לרכישה`

Update `canEdit` to also check editing credits.

Dispatch `editing-credits-updated` event after successful deduction.

### Files changed
1. **Migration**: Add `editing_credits` column
2. `src/hooks/use-editing-credits.ts` — new file
3. `src/pages/Upgrade.tsx` — edit kit purchase handler
4. `src/components/home/LoggedInHome.tsx` — third credit pill
5. `src/hooks/use-story-edit.ts` — deduction logic

### What stays the same
- All design, colors, layout, buttons
- Coloring credits system untouched
- Story credits system untouched
- `free_edits_remaining`/`free_edits_total` columns kept for backward compat
