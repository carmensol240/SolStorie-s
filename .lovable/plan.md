

## Plan: Remove Carol Gray / Social Stories Branding

All references to "Carol Gray" appear in two files. The structural logic (3:1 ratio, first/third person, positive tone, sensory strategies) stays intact — only the attribution label changes.

### Changes

#### 1. `src/components/wizard/topic-data.ts` — 16 topic descriptions
Replace every instance of `מדריך חברתי מובנה (Carol Gray):` with `סיפור העצמה חברתי:` across all `-edu` topics. Also remove `"carol gray"` from any `keywords` arrays.

#### 2. `supabase/functions/generate-story/index.ts` — line 1040
Replace `מנוע סיפורים מקצועי (Carol Gray Method)` with `מנוע סיפורי העצמה חברתיים` in the educational prompt section. The methodology rules beneath it remain unchanged.

### What stays the same
- The 3:1 descriptive-to-directive ratio
- First/third person rule (no second person)
- Positive, non-authoritative tone
- Sensory awareness and coping strategies
- All topic IDs, labels, images, and age ranges

### Files to Edit

| File | Change |
|------|--------|
| `src/components/wizard/topic-data.ts` | Replace "מדריך חברתי מובנה (Carol Gray):" with "סיפור העצמה חברתי:" in all 16 edu descriptions; remove "carol gray" from keywords |
| `supabase/functions/generate-story/index.ts` | Replace "Carol Gray Method" header with "מנוע סיפורי העצמה חברתיים" on line 1040 |

Edge function deployment required after the change.

