

## Plan: Two-Step Category Selection for Learning Section

### What changes
In `src/components/wizard/TopicStep.tsx`, when rendering the `learning` section's expanded topics grid, replace the flat list with a two-step UI:

**Step 1**: Show 4 large category buttons:
- 🔤 אותיות (topics with `id` starting with `letter-`)
- 🔢 מספרים (topics with `id` starting with `number-`)
- 🎨 צבעים (topics with `id` starting with `color-`)
- ⭐ צורות (topics with `id` starting with `shape-`)

**Step 2**: When a category is clicked, show only topics matching that prefix as cards (using existing `SimpleTile`). Add a back button (arrow + text) to return to the 4 categories.

### Technical details

**File**: `src/components/wizard/TopicStep.tsx` only

1. Add a `learningSubTab` state: `useState<string | null>(null)` — `null` = show 4 buttons, `"letter-"` / `"number-"` / `"color-"` / `"shape-"` = show filtered topics.

2. In the topics grid rendering block (lines 226-252), add a special case when `section.id === "learning"`:
   - If `learningSubTab` is null: render 4 large buttons (rounded-2xl, aspect-square-ish, with emoji + label, gradient backgrounds)
   - If `learningSubTab` is set: render a back button + grid of `SimpleTile` for topics whose `id` starts with `learningSubTab`

3. Reset `learningSubTab` to null when the learning section is collapsed.

### No other files touched.

