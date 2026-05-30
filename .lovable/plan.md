## Goal
Add a celebratory gift-card entry point on the Upgrade screen (`src/pages/Upgrade.tsx`) that navigates to `/gift`. No other files change.

## Placement
Insert a new section directly after the Coupon block (after line 253) and before the Terms paragraph (line 256). This keeps it below the packages but above the fixed bottom CTA, so it doesn't compete with the primary purchase action.

## Design
Festive, magical, on-brand with the existing purple/pink/orange gradient palette already used by the CTA:

- Container: rounded-2xl card, subtle gradient background (`from-pink-500/10 via-purple-500/10 to-orange-500/10`), soft border `border-white/10`, inner padding, `text-center`, `dir="rtl"`.
- Decorative floating emojis (🎈🎁✨🎉) positioned absolutely in the corners with low opacity and a slow `animate-bounce` / `animate-pulse` for a magical feel.
- Headline (h3): "רוצה לשמח מישהו? 🎁" — bold, white, text-lg.
- Sub-line: short warm sentence, e.g. "כרטיס מתנה דיגיטלי עם קוד אישי — מושלם ליום הולדת, חג או סתם ככה" — text-xs, white/70.
- Button: full-width, gradient `from-pink-500 via-purple-500 to-orange-500`, white bold text, rounded-xl, shadow-glow, label: `🎁 שלח כמתנה`. Hover lifts brightness. On click → `navigate("/gift")`.

Reuse the existing `Button` component and `navigate` hook already imported in the file. No new imports needed beyond what's already there.

## Technical notes
- Tailwind only; no new dependencies.
- Use semantic gradient utilities already proven in this file (lines 276–277 pattern).
- Tracking: fire `trackEvent({ eventType: "feature_used", metadata: { feature: "gift_entry_clicked" } })` before navigating, matching the existing tracking pattern on this page.
- No changes to packages, pricing logic, coupon, terms, CTA, or modals.

## Files
- `src/pages/Upgrade.tsx` — insert the new section only.
