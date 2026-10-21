# Longer stories, more pictures

## What changes
New page counts per age (pictures on every odd page, every page at ages 0–2):

| Age | Pages today → new | Pictures today → new | Words per page (unchanged) |
|---|---|---|---|
| 0–2 | 6 → 8 | 6 → 8 | 5–8 |
| 3 | 7 → 10 | 4 → 5 | 20–30 |
| 4 | 7 → 10 | 4 → 5 | 20–30 |
| 5 | 8 → 12 | 4 → 6 | 20–30 |
| 6 | 8 → 12 | 4 → 6 | 20–30 |
| 7–9 | 10 → 12 | 5 → 6 | 35–45 |
| 10 | 12 → 14 | 6 → 7 | 50–60 → see fix |
| 11–12 | 12 → 14 | 6 → 7 | 50–60 → see fix |

The story writer is asked for more events and more picture moments, not more text per page.

## Two things you should decide

**A. The word totals clash with the words-per-page rule.** Example: age 4 = 10 pages × 20–30 words = 200–300 words, but the total you wrote is 500. Age 9 = 12 × 35–45 = 420–540, not 800. If we keep words-per-page fixed (your main rule), the real totals will be:
0–2 ≈ 50–65 · 3–4 ≈ 250 · 5–6 ≈ 300 · 7–9 ≈ 480 · 10–12 ≈ 600–650.
Proposal: write these totals into the instruction so the writer isn't pulled in two directions (today the same clash already exists, e.g. age 5 asks for 450 words in 8 pages of 20–30). If you'd rather keep your totals, words per page must grow.

**B. Ages 10–12 can break the 300-character limit.** 50–60 Hebrew words ≈ 300–360 characters. Today those pages already get split into an extra page with no picture. Proposal: 40–50 words per page for ages 10–12 (≈ 240–290 characters). Ages 7–9 (35–45 words ≈ 210–270) are fine.

## Print book length (honest numbers)
With the existing layout rules (text page facing its picture, a picture-less page joins the previous text page, ending pages, multiple of 4):
- Ages 3–4: 16 pages (same as today — 5 spreads only)
- Ages 5–9: 20 pages
- Ages 10–12: 20 pages
- Ages 0–2: 24 pages

So the picture count rises, but no age reaches 24–32 except toddlers. Reaching 24 for ages 3–9 would need 7–8 pictures. Tell me if you want that; otherwise I build the numbers as you wrote them.

## Answers to your questions
1. **Extra creation time:** about +15–30 seconds per story. Pictures are drawn in parallel (one request per page), so more pictures add little; the longer text and language-editor pass add most of it.
2. **AI cost per story (estimate, before → after):** pictures are most of the cost.
   - Age 3: ~4 → ~5 pictures, roughly +20–25%
   - Age 5: ~4 → ~6 pictures, roughly +45–50%
   - Age 9: ~5 → ~6 pictures, roughly +20%
   First build step: pull the project's real usage records for recent stories and replace these percentages with shekel figures before changing anything.
3. **Free taste:** today it shows 4 pages (3 at ages 0–2). With 10–14 pages that's a third or less of the story — reasonable as a teaser, and it now contains 2 pictures. Recommendation: keep it. (Ages 0–2: 3 of 8, fine.) No change unless you want one.
4. **Timeout risk:** the writing call has a 120-second limit and the longest stories (14 pages + picture prompts) produce more text. Prevention: raise the output-length cap for the writing call to match, keep the existing retries, check the page count the writer returns (too few pages → one targeted retry, not a failure), and test-create one story per age group before finishing. Pictures are separate requests, so they don't add timeout risk to the story itself. Existing safety net (charge only after the story is saved, refund on failure) stays.
5. **Lovable credits for the build:** about 3–6 messages' worth.

## What gets checked
- Language editor and talk questions: they read the whole story; check the longest (14 pages) fits their limits.
- Print file: new tests for 10, 12, 14 pages (multiple of 4, joins, back cover last).
- Reader, story continuations (sequels), free taste limit: test with a 12-page story.
- Payments, prices, credits: untouched. One story = one credit.

## Technical details
- `generate-story/index.ts` `getAgeLengthInstruction`: new `pages`, totals and per-page ranges; `illustrationPageNumbers` and the two parity checks already derive from `pages` / page number, so they follow automatically — verify only.
- Raise `maxOutputTokens` for the main writing call; add page-count validation.
- `_shared/taste.ts` `tastePageLimit` unchanged unless you ask.
- Add a small test asserting pages/pictures per age from the table above.
- Existing stories are not changed.
