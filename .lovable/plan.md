

## Plan: Move CTA Button Right After Title in GuestLanding

### Change: `src/components/home/GuestLanding.tsx`

Restructure the layout so the content appears in this order above the fold (no scroll needed):

1. **Keep**: Logo "SolStorie's™"
2. **Keep**: "✨ סיפורים קסומים" + "הילד שלכם כגיבור הסיפור!"
3. **Add immediately after title**: The CTA button — large, prominent, with text "בואו נתחיל! סיפור ראשון חינם ✨" (for guests) / existing text for logged-in users
4. **Below the fold** (after scroll): Feature cards, device availability text, privacy link

Implementation:
- Remove the `flex-1 min-h-8` spacer that currently pushes features + button to the bottom
- Move the CTA button (`handleStart`) right after the title section (line 131)
- Keep feature cards and other content below, separated by spacing so they appear on scroll
- Update guest button text to "בואו נתחיל! סיפור ראשון חינם ✨"

Single file change, no database or structural changes.

