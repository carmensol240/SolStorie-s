# Longer stories, more pictures (minimal scope)

## Change
Only the age table that tells the writer how long the story is, plus the writer's output-length limit if needed. Nothing else on the site changes.

| Age | Pages | Pictures | Words per page | Total words (derived) |
|---|---|---|---|---|
| 0–2 | 8 | 8 (every page) | 5–8 (unchanged) | ~50–65 |
| 3–4 | 12 | 6 | 20–30 (unchanged) | ~300 |
| 5–6 | 12 | 6 | 20–30 (unchanged) | ~300 |
| 7–9 | 12 | 6 | 35–45 (unchanged) | ~480 |
| 10–12 | 14 | 7 | 40–50 (was 50–60) | ~630 |

The writer is told: more events and more picture moments, not more text per page. Pictures stay on odd pages (every page at 0–2); the picture list and odd-page checks already follow the page count automatically.

## Writer output limit
Today 8192 output tokens. 14 pages with picture descriptions fit, but with little margin; raise to 12000 only if the estimate is tight. Timeout and retries unchanged.

## Expected print length
Ages 3–9: 20 pages · ages 10–12: 20 pages · ages 0–2: 24 pages.

## Not touched
Payments, prices, credits (one story = one credit), free taste (still 4 pages, 3 at ages 0–2), reader, print layout, language editor, talk questions, sequels, existing stories. No new tests, no AGENTS.md change, no test stories. You test on the live site.

## Technical details
- `supabase/functions/generate-story/index.ts`: `getAgeLengthInstruction` — new `pages`, total words, per-page ranges, "more events" line; ages 3 and 4 both 12 pages.
- Same file: `maxOutputTokens` of the main writing call (8192 → 12000 if needed).
- Redeploy generate-story.
