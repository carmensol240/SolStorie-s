
# Remove Duplicate Topic: "עזרה בבית"

## What Was Found

One true duplicate exists across two different categories:

| Category | Topic ID | Label |
|---|---|---|
| עולם הערכים (values) | `helping-home` | "עזרה בבית" |
| התמודדות ורגשות (emotions) | `helping-at-home` | "הקסם של עזרה בבית" |

Both topics use the same image (`topicHelpingAtHome`) and cover the same concept — helping at home as a family.

All other similar-sounding pairs (honesty, patience, cooperation, politeness, self-confidence, respecting-elders) are intentionally different: one version is a regular narrative story and the other is a Carol Gray educational social story for the "ארגז כלים חינוכי" category. These are kept as designed.

## What Gets Removed

**Remove `helping-at-home` from the `emotions` section** (line 120 in `topic-data.ts`).

The version in `values` (`helping-home`) has a richer, more values-focused description and belongs better in the "עולם הערכים" category, so it stays.

## File to Edit

### `src/components/wizard/topic-data.ts`
- Delete line 120: `{ id: "helping-at-home", label: "הקסם של עזרה בבית", ... }`
- No other changes needed — the import `topicHelpingAtHome` is still used by `helping-home` in values, so no unused import to clean up.

## Impact
- No backend changes
- No image changes
- No other components affected (the topic ID `helping-at-home` is not referenced anywhere else in the codebase)
- The gallery will show one fewer tile in the "התמודדות ורגשות" section
