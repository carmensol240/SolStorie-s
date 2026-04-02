

## Plan: Improve About Page — Show More Content in Hero + Floating Close Button

### Changes — `src/pages/About.tsx` only

#### 1. Move the personal intro paragraphs ABOVE the fold (outside `showMore`)
Move the 3 personal intro paragraphs (lines 118-133) out of the `showMore` block and place them right after the title section (after line 102), so the hero section shows more meaningful text without needing to expand.

The "קרא עוד ↓" toggle and its expandable block will now only wrap the **features list** (lines 135-204), not the personal intro.

#### 2. Replace bottom "סגור ↑" with a sticky floating close button
Remove the current bottom-anchored close button (lines 206-214). Instead, add a **sticky floating close button** inside the expandable content block:
- Position: `sticky bottom-4` centered
- Style: semi-transparent dark background (`bg-black/40 backdrop-blur-sm`), small rounded pill shape, subtle text
- Text: "סגור ↑"
- Same onClick logic: `setShowMore(false)` + scroll to top
- Visible but not obtrusive — floats over content as user scrolls

#### Result
- Hero section shows logo + tagline + personal story — more substance before scrolling
- "קרא עוד" expands only the feature cards
- Close button is always reachable while scrolling through features, not buried at the bottom

### No other files modified.

