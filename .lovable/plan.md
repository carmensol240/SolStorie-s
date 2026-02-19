
# "קרא עוד" — Full Topic Description Experience

## Current State
The `SimpleTile` component already has a `line-clamp-2` with a "קרא עוד" toggle, but it has two problems:
1. The toggle only appears when `description.length > 80` — many descriptions are borderline
2. Expanding inline in a 2-column grid card breaks the layout (cards change height unevenly)
3. The tiny `text-[10px]` description area is very hard to read

## Solution: Info Button → Bottom Drawer

Each topic tile will get a small **ℹ️ info button** in the top-right corner of the image. Tapping it opens a clean bottom drawer (using the existing `vaul` Drawer component already installed) showing:
- Topic image (full-width hero)
- Topic label + age range badge
- Full description in readable font size
- A "בחרו נושא זה" (Select) button at the bottom
- A "סגירה" (Close) button

This approach keeps the grid clean and gives users a proper reading experience.

The inline "קרא עוד" toggle in the card body will remain as a secondary option but will be simplified (remove the 80-char threshold — always show it).

## Files to Edit

### `src/components/wizard/TopicStep.tsx`

**Changes to `SimpleTile`:**

1. Add a state `showDrawer` (boolean) per tile
2. Add a small info button `ⓘ` overlaid on the top-right of the image (distinct from the select action)
3. Add a `Drawer` (from `@/components/ui/drawer`) that renders the full topic info when open
4. Lower the "קרא עוד" inline threshold from `> 80` to always showing it (all descriptions get the toggle)
5. The "בחרו נושא זה" button inside the drawer calls `onSelect` and closes the drawer

**New SimpleTile structure:**
```text
┌─────────────────────────────┐
│  [Topic Image]              │
│               [ⓘ button]   │  ← taps open Drawer
│  [✓ selected]  [age badge] │
├─────────────────────────────┤
│  Topic Title                │
│  Short description...       │
│  קרא עוד ▾                 │  ← inline expand (always shown)
└─────────────────────────────┘
```

**Drawer content:**
```text
┌─────────────────────────────┐
│  [Full-width topic image]   │
│  Topic Title      [age]     │
│                             │
│  Full description text in   │
│  readable 14px font...      │
│                             │
│  [בחרו נושא זה  ←]         │
│  [סגירה]                    │
└─────────────────────────────┘
```

## Technical Notes

- `vaul` Drawer is already installed (`vaul version ^0.9.9`) and the `Drawer` component is at `@/components/ui/drawer`
- The drawer opens from the bottom, which is natural mobile UX for RTL Hebrew apps
- Only one file needs changing — `src/components/wizard/TopicStep.tsx`
- No backend changes, no new dependencies
- The info button uses `Info` icon from `lucide-react` (already imported in the project)
- `e.stopPropagation()` on the info button prevents triggering the select action simultaneously
- The drawer's "בחרו נושא זה" button calls `onSelect()` then closes the drawer — users can select directly from the drawer view
