

## Fix empty tooltip text on credit badges

### Root cause (most likely)
The tooltip content text IS in the JSX (`קרדיטי סיפורים — ...` etc.), but it appears empty in the popup. The two most common causes given the current code:

1. **Missing `TooltipPortal`** — Radix's `Tooltip.Content` should portal to `<body>`, but in some shadcn setups inside deeply nested table/overflow containers the content can get clipped or rendered without its text node. Wrapping `TooltipContent` in `TooltipPrimitive.Portal` guarantees it escapes the table cell.
2. **RTL/font issue** — Hebrew text inside `bg-popover text-popover-foreground` without an explicit `dir="rtl"` can render as zero-width in some browsers when the popover is mounted in an LTR context.

### Fix (minimal, targeted)
**File: `src/components/ui/tooltip.tsx`** — add Portal export and wrap content in Portal so all tooltips across the app render reliably:
- Import `TooltipPrimitive.Portal` and wrap `<TooltipPrimitive.Content>` with `<TooltipPrimitive.Portal>`.
- Keep the existing className, ref, and props exactly as-is.

**File: `src/pages/AdminDashboard.tsx`** — add `dir="rtl"` to each of the three `<TooltipContent>` elements (lines 645, 651, 657) so the Hebrew text is laid out correctly inside the portaled popup. No text changes — the existing strings stay:
- `"קרדיטי סיפורים — מספר הסיפורים שהמשתמש יכול ליצור"`
- `"קרדיטי צביעה — מספר דפי הצביעה שהמשתמש יכול להפיק"`
- `"קרדיטי עריכה — מספר העריכות הזמינות לסיפורים קיימים"`

### What will NOT change
- No badge styling, colors, layout, legend, or any other dashboard content changes.
- No changes to data, props, or types.
- All other tooltips in the app keep working (Portal is backward-compatible).

### How to revert
Remove the `Portal` wrapper in `tooltip.tsx` and remove `dir="rtl"` from the three `TooltipContent` tags.

