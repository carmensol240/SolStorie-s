

## Add tooltips + legend to user-table credit badges

### Scope (only this — nothing else changes)
The three colored badges in the **Users** tab table column "קרדיטים" of `src/pages/AdminDashboard.tsx`:
- 📖 amber → story credits
- 🎨 purple → coloring credits
- ✏️ blue → editing credits

### Changes

**File: `src/pages/AdminDashboard.tsx`**

1. **Imports** — add (no removals):
   - `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger` from `@/components/ui/tooltip`

2. **Wrap each of the three badges in a Tooltip** (lines 634–636), keeping classes, colors, and content identical:
   - 📖 → tooltip text: `"קרדיטי סיפורים — מספר הסיפורים שהמשתמש יכול ליצור"`
   - 🎨 → tooltip text: `"קרדיטי צביעה — מספר דפי הצביעה שהמשתמש יכול להפיק"`
   - ✏️ → tooltip text: `"קרדיטי עריכה — מספר העריכות הזמינות לסיפורים קיימים"`
   - The whole `<div className="flex gap-1 flex-wrap">` block stays inside a single `<TooltipProvider delayDuration={200}>` so all three share one provider.

3. **Add a small legend row above the users table** (just below the search input at line 594, before `<ReviewedBar … />`):
   - A single line, muted text, RTL, e.g.:
     ```
     <div className="px-3 pb-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
       <span>📖 קרדיטי סיפורים</span>
       <span>🎨 קרדיטי צביעה</span>
       <span>✏️ קרדיטי עריכה</span>
     </div>
     ```
   - No background, border, or color overrides — inherits existing card styling so nothing visually shifts.

### What will NOT change
- No layout changes, no color changes, no spacing changes anywhere else.
- Other tabs (Stories, Purchases, Errors, Coupons, etc.) untouched.
- Stat cards, filters, tables, action buttons untouched.
- Badge styling (`bg-amber-100`, `bg-purple-100`, `bg-blue-100`, `text-[10px]`) preserved exactly.
- No changes to data fetching, types, or logic.

### How to revert
Remove the Tooltip wrappers around the three badges, remove the legend `<div>`, and remove the four Tooltip imports.

