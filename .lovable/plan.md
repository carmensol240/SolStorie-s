# Old paid stories must never lock — findings and fix

## What I found (checked in the database now)

- **Test and Live share one database.** This project has a single backend that serves both the preview and soulstory.co.il. So there is only one count to check, and it is the same count for both.
- **Stories that belong to a parent and are not a taste:** 302. **Stories among them with no open-record:** 0. The one-time marking ran today (18/10, 09:56 UTC) and wrote 300 "legacy_digital" records. The other 2 already had records (1 bought by a single purchase, 1 opened by admin).
- **Another 28 stories have no owner at all** (old guest/test stories). They have no open-record either. Nobody can open them from a library, so no parent is blocked by them.
- **Does Publish matter for the marking?** No. The marking is data, not code, and it's already in the shared database, so the live site sees it now. Publish only matters for the new code, which reads these records.
- **So is the warning true today?** Not right now: every old paid story has a record. But the warning points at a real weakness. The story screen and coloring pages depend only on that record. If one ever goes missing (a record deleted by mistake, a story added later, a failed write during creation), a paying parent gets locked out. That's why the fix below doesn't depend on the marking.
- **The shared story link** (get_public_story) never checks open-records. It locks only taste stories, so old stories are not affected there.
- **New stories:** creation already writes the open-record right after the credit is charged (also when a taste is opened and when a purchase opens a story). There's no automatic test for this yet.

## The fix (after approval)

1. **One "is this story open" rule, the same everywhere.** A story counts as open if any of these is true:
   - it has an open-record, or
   - it is not a taste and was created before the cut-off date (18/10/2026 09:00 UTC, before the new rules went live). It then counts as a digital story: it opens in full and coloring pages open, but there's no print file unless it already had one.

   A taste that wasn't opened stays locked, whatever its date.
2. **Apply the rule in:**
   - the story screen (no lock after page 4, no payment request)
   - the library (no "open with a credit" button and no lock)
   - the server function for coloring pages (old stories get coloring pages)
   - the shared link: no change needed, it already follows this rule. I'll add a note there.
3. **New stories:** if writing the open-record fails during creation, retry once. If it still fails, cancel the story and refund the credit, so a charged story without a record can't exist.
4. **Automatic tests:**
   - an old non-taste story with no record is open in full, including coloring pages
   - an old taste that wasn't opened stays locked
   - a new story with no record is locked
   - creating a story with a credit always writes the open-record together with the charge
5. **Manual check:** temporarily take one old test story of yours with no record, open it as its owner, and confirm all pages and coloring pages open with no payment request. Then put its record back.

No prices, packages, Grow or story text change.

## Technical details

- Shared helper `isStoryOpen({ isTaste, createdAt, hasUnlock })` with a `LEGACY_CUTOFF` constant. One copy for the browser and one for the server functions, with a test that keeps them identical.
- StoryViewer: `isSingleStoryUnlock || isLegacyOpen(story)`. Library: same check when building the locked set. generate-coloring-page: falls back to `stories.is_taste` + `created_at` when there's no unlock row.
- generate-story: check the upsert error in `grantStoryAccess` and return it. On failure, retry, then go down the existing delete + `refundCredit` path.
- Tests go in `src/__tests__/story-access.test.ts`.
