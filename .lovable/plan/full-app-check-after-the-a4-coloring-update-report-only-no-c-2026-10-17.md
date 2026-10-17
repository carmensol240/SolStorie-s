# Full app check after the A4 coloring update (report only, no changes)

No code, design, text or settings will be changed. The result is a written report with ✅ / ⚠️ for each step. Nothing gets fixed until you approve.

## What I will check

1. **Story creation**: run the wizard as a signed-in test account (child details, photo, topic). Confirm the Hebrew story text is created and saved, and only one credit is used.
2. **Illustrations**: confirm all pages and the cover get pictures. Compare style, size and layout with stories made before the update. Confirm the picture code was not touched.
3. **Coloring pages**: create one from a story. Check the A4 frame, the print preview (one page, nothing cut off) and the PDF (one A4 page). Also check the button names. Right now they say "Print A4" / "Download PDF (A4)" in English, not "הדפסה A4" / "הורדת PDF", so I'll report that.
4. **Library**: open saved stories and saved coloring pages, including ones made before the update.
5. **Purchase**: run the 18 purchase tests, check that every Grow payment link opens with the right price, and check the confirmation email setup and recent purchase records. I won't make a real payment. A test purchase happens only if you say yes.
6. **Login / sign up and Hebrew right-to-left layout**: check the login and sign-up pages, then take screenshots of the main pages on mobile (390 px) and desktop (1280+ px).

## List of what the A4 update changed

- Compare every file the update touched against the version before it.
- Expected: the coloring page picture function, the new A4 frame and its helpers, the Library coloring grid, the story's coloring step, a print section in the global styles, and one small test.
- Confirm the print styles only apply while printing a coloring page and change nothing else.

## Technical details

- Before/after comparison of the A4 change, plus a search for every place that uses the new frame and helpers.
- Read-only database checks on the newest stories, story pages, coloring pages, purchases and error logs.
- Browser screenshots run with a test session made just for this check.
- Running the check creates one test story and one coloring page on the test account, which uses credits from that account only.
