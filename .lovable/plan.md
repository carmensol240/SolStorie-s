

## Plan: Redesign Story End Page

### Changes — single file: `src/pages/StoryViewer.tsx`

**Lines ~1326-1425** (the `isEndPage` block) will be restructured:

### Layout (top to bottom)
1. **Back arrow** — small purple `ChevronRight` icon button, positioned absolute top-right corner (no text, no "חזרה")
2. **Title** — "קסום, לא? ✨" (replaces "✨ נהננו? ✨")
3. **Remove** "הסיפור של {child_name}" line entirely
4. **Feedback box** — moved UP, before coloring buttons:
   - Subtitle "שתפו אותנו בקסם שלכם" (kept as-is)
   - Stars: larger (`w-8 h-8`), with pulse animation on hover and a gentle scale-in entrance animation
   - Textarea + send button (unchanged)
5. **Two separate coloring buttons** (replaces the single unified button):
   - `🖨️ הדפסה` — amber/orange gradient, opens the coloring picker dialog in print mode
   - `🎨 צביעה אונליין` — purple/indigo gradient, opens the coloring picker dialog in online mode
   - Both buttons side by side in a flex row
6. **Logo footer** — `SolStorie's™` with rainbow gradient at bottom

### Coloring button logic
Currently one button opens the picker dialog, then inside the dialog user chooses print vs online. With two separate buttons, we need a new state `coloringMode: 'print' | 'online'` set before opening the picker. The picker dialog's "choose-action" step is skipped — after picking an illustration, it goes directly to the selected action.

### Mobile considerations
- Buttons stack vertically on small screens (`flex-col sm:flex-row`)
- Padding and gaps reduced for mobile
- Stars row centered with adequate touch targets

### What stays the same
- All coloring generation logic (API calls, caching, canvas footer)
- Feedback submission logic
- The coloring picker dialog (illustration grid)
- Everything else in StoryViewer.tsx

