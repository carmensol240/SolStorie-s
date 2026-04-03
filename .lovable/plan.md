

## Plan: Make Child's Name More Prominent on Story Cover

### Overview
Split the dedication text on the first page into two lines — the message on one line and the child's name large and bold on a separate line — in both the regular StoryViewer and the combined layout variant.

### Changes — `src/pages/StoryViewer.tsx`

**Two locations** (lines ~1647-1649 and ~1771-1773) currently show:
```
הספר הזה נוצר במיוחד עבורך, {story.child_name} 💙
```

Replace each with two separate elements:
1. Line 1: `הספר הזה נוצר במיוחד עבורך` — keep current size (`text-base md:text-lg`)
2. Line 2: `{story.child_name} 💙` — larger and bolder (`text-2xl md:text-3xl font-black`), on its own line

The gradient overlay container and position remain unchanged.

### Files modified
1. `src/pages/StoryViewer.tsx` — two locations updated

