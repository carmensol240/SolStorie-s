
## Coloring memory stability (Oct 2026)
- [x] Small serialized previews; full pages only for print/PDF/online; release canvases and blob URLs
- [x] Verify 30 pages at 390px (browser-only duplication of existing records, no saved changes), full-resolution print/PDF and online; gang previews; 11 tests passed

## Coloring footer (Oct 2026)
- [x] Keep free character/app captions; use child's profile name on paid pages
- [x] Add shared copyright to screen, PDF/image downloads and print; verify existing flows

## Coloring pages: thin outlines, no solid black (Oct 2026)
- [x] Two checks (color >1%; solid black area >2%), up to 2 retries, edge-detection fallback from original
- [x] Print/PDF/online coloring: clean page untouched, otherwise thin-line conversion (no threshold blobs)
- [x] Scan 37 saved files (no changes)
- [x] Existing files: cancelled by user — no regeneration or conversion

## Empty coloring page repair (Oct 2026) — superseded by the section above
- [x] Enforce server color detection, one retry, and binary output
- [x] Safeguard empty-page A4 exports without changing child artwork
- [x] Scan 36 files and repair 5 in place; temporary maintenance function removed
- [x] Generate a new page in requesting account; capture both pages; verify binary saved pixels and one-page A4 PDF

## Illustration reliability (Oct 2026)
- [x] Main picture service: 3 tries for temporary errors, no repeat after a safety block
- [x] Backup with same style/character/reference pictures; Flux only with no page-1 picture and no photo
- [x] Mismatched backup pictures not saved; page held for admin
- [x] Admin list of pages needing a picture
- [x] Full prompt saved in logs

## Story creation jump fix (Oct 2026)
- [x] No auto-reload during creation; sign-up guard only at entry; one-time request ID; safety net screen; library hides unfinished stories
- [x] End-to-end browser test (wait, tab switch, reload)

## Value packs (Oct 2026)
- [x] 3 full (179) + 3 digital (99) in catalog, credits, purchase screen only; exact amount match
- [x] Grow links for both packs connected

## Pricing audit (Oct 2026) — report only, wait for approval
- [ ] List every place a price is shown/calculated + current value
- [ ] List all other packages/products with current prices
- [ ] Propose single price source (incl. lock screen + server amount check), unique amounts, delete unused price screens, guard test
- [ ] List Grow links with the price each should charge
- [ ] Accessibility audit (IS 5568 / WCAG AA): report findings per section, no changes until approval
- [ ] Shared story links (/s/...) show generic title/image in WhatsApp/Facebook since leaving Netlify — needs a new preview solution (separate task)
- [x] Remove spectrum claims and result promises from public texts; topic count unified to 140+ (NLP mentions kept)

## NLP in stories (Oct 2026)
- [x] Fixed list of 13 techniques incl. gang modeling; 7 topic types; sensitive-topic and safety rules
- [x] Check after writing → targeted fix → niqqud on final text → re-check; report saved per story
- [x] Control panel: coverage + marked stories with quotes per technique

## Clothing & religious items (Oct 2026)
- [x] No religious items on the hero unless a religious style is chosen (none exists); holiday = festive colors, symbols as scene objects; story text too
- [x] Dress only for girls (form + server); swimsuit/superhero per gender
- [x] Topic outfit only on explicit change pages, back to chosen clothes next page; fixed default outfit saved per story (story_outfit) for retries/coloring
- [x] Character core (face/skin/eyes/hair/glasses/body) separate from clothes; photo description no longer reads clothes
- [x] Kippah checkbox for boys only; form value decides; story-only for redraws/coloring; girl never; tzitzit/sidelocks never

## Auto-update + reader (Oct 2026)
- [x] New version takes control automatically; HTML network-first with offline shell fallback; sign-in never cached; illustrations kept
- [x] Reader: picture ≥40% on phone, accessibility in top bar, page 1 not repeating cover, readable dedication

## Storage rules (Oct 2026)
- [x] Report each of the 3 flagged rules (role, actions, real users)
- [x] Remove/limit illustration + topic-image write rules; stop anonymous listing; check child-photos privacy
- [x] Tests + re-run security scan

## Live update fix + offline auto-save (Oct 2026)
- [x] Navigation preload + cookie-free static downloads in the service worker
- [x] Emergency release (crash / missing file) with anti-loop flag
- [x] Leaked-password protection on
- [x] Book opened once saved for offline (Safari-safe timing)
- [x] iPhone/WebKit check on built version (no console errors)
- [ ] Live test on soulstory.co.il (publish, second publish, same browser updates) — waits on user publishing

## Create form history + tab draft (Oct 2026)
- [x] Steps in browser history, answers kept per tab/user, cleared on success/sign-out/new profile

## Hebrew language editor (Oct 2026)
- [x] Editor step after writing, before saving (story creation, gender swap, text enhance); nikud retry once; failure keeps original
- [x] Ran on "אבא במילואים" only and saved

## Reserves uniform (Oct 2026)
- [x] IDF uniform lock for a family member in the reserves/army; no weapons/helmet; home scenes may be casual
- [x] Redrew page 7 of "אבא במילואים" only

## Realistic / back-view pages (Nov 2026)
- [x] Diagnose page 5 of test story (redraw was saved unchecked; behind-camera angle)
- [x] Check for realistic style + hero face visible; recheck every redraw, max 2; keep best if only hero hidden, else hold; admin alert + email
- [x] Report last month's saved pictures (read-only)
- [x] Test story in test account; screenshot of a held page

- [x] Redraw Adel story 3a2d5c15 (all 8 pages passed)

## Nov 4 2026 — sound button, stale redraws, book design
- [x] A: big orange sound button + pause on the video
- [x] B: version on redrawn picture addresses; Adel's 8 pages updated
- [x] C: mockups + square sample (screenshots delivered)
- [ ] C: build chosen design — waiting for approval of screenshots
- [x] C2: new book design for all stories (reader paper page, big text, 0–4 band, open book, print text pages)
- [x] C3: square pictures behind switch (SQUARE_ILLUSTRATIONS=test → admin accounts only)
- [ ] C3: 3 square test stories (boy, girl, age 0–4) — waiting for user to pick test account/children
- [ ] Turn square on for everyone — only after user approves test stories

## Square pictures test + branding (Nov 2026)
- [x] 3 square test stories in carmit1901+test (Noam copy, Shuga, new AI toddler "Mika"), all pages face+check passed, credits returned
- [x] Small brand on text pages (reader + print), no logo on pictures, rights page before back cover
- [ ] Turn square pictures on for everyone — waits for owner approval

## New official Leo (Nov 2026)
- [ ] Homepage thumb, coloring page, studio picture (4 places), storage reference from new brown-eyed pictures
- [ ] One Leo description (brown eyes) + Leo reference image in illustrations/redraws
- [ ] Screenshots: homepage gang row, /coloring-gang, coloring page full size, 4 places
