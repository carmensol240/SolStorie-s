## Hebrew RTL QA Plan

Run a structured QA pass to verify the recent global Heebo typography + RTL changes render correctly across the main user flows on both mobile and desktop viewports.

### Scope (pages to check)

1. `/` Adventure (logged-in home) — hero header, coin counter, WelcomeGiftBanner, feature/category lists
2. `/` GuestLanding (logged-out) — hero title, subtitle, feature cards, CTA
3. `/auth` — form labels, terms checkbox, buttons
4. `/create` — wizard steps (TopicStep, ChildInfoStep) headings + body
5. `/library` — story cards, filters
6. `/profile` — section headers, rewards
7. `/upgrade` — package cards, prices, trust badges

### Checks per page

- **Direction**: container `dir="rtl"`, text aligned right, punctuation (.,!?) on left side of Hebrew lines
- **Font**: Heebo loaded (not fallback sans-serif) — inspect computed `font-family` on body + h1
- **Weight**: headings render at 800/900, body at 500 — visually bold, not thin
- **Sizing**: hero title scales via `clamp()` without overflow at 360px / 768px / 1280px
- **Wrapping**: no clipped text, no horizontal scroll, no overlap with icons/badges
- **Mixed LTR**: brand `SolStorie's™` stays LTR inside RTL paragraphs (footer, logo)
- **Punctuation bidi**: `unicode-bidi: plaintext` working — no stray dots on wrong side
- **Numbers/coins**: digits in coin counter and prices render correctly inside RTL

### Method

For each page:
1. `browser--navigate_to_sandbox` at desktop (1280×720)
2. `browser--screenshot` + visual review
3. `browser--set_viewport_size` to 375×812 (mobile)
4. `browser--screenshot` + visual review
5. `browser--extract` computed font-family/weight on hero h1 to confirm Heebo is active
6. Note any defects (overflow, wrong weight, fallback font, broken RTL)

### Deliverable

A QA report listing, per page + viewport:
- ✅ Pass items
- ⚠️ Issues found (with screenshot reference + suggested fix)
- Any follow-up code changes needed (e.g., add `hero-title-he` class to specific component, wrap brand name in `<span dir="ltr">`)

No code changes are made during the QA pass itself. After the report, you can approve specific fixes for me to implement.

### Out of scope

- Story viewer page (separate font-size accessibility system)
- Admin dashboard
- Email templates (server-rendered)
