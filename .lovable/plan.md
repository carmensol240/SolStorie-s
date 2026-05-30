## Goal
On mobile, the "דפי צביעה" item in the BookHeader dropdown menu should visually indicate it's locked (matching the desktop icon's lock badge) for users without coloring entitlement, and tapping it should trigger the upsell flow directly (no tooltip, since mobile has no hover).

## Scope
Single file: `src/components/story/book-frame/BookHeader.tsx` — the mobile-only `DropdownMenuItem` for coloring (around the `md:hidden` block that currently renders just `<Palette/>` + "דפי צביעה").

## Changes

1. **Add lock badge to the mobile dropdown item** when `coloringLocked` is true:
   - Wrap the `<Palette>` icon in a `relative inline-flex` span and overlay a small `<Lock>` icon (`w-3 h-3`, white rounded background, slate-700) at `-top-1 -left-1`, mirroring the desktop button's badge.
   - Append a short locked hint to the label (e.g. " 🔒" suffix or change label to "דפי צביעה (נעול)") so the locked state is clear in the text as well — final wording TBD, will match the desktop tooltip phrasing "שדרגו לחבילת דפי הצביעה" only if it fits; otherwise keep label "דפי צביעה" with just the badge.

2. **Click behavior**: keep `onClick={onColoring}`. The existing `onColoring` handler (passed from `StoryViewer`) is already responsible for opening the coloring upsell modal when the user lacks entitlement — same handler the desktop button uses — so no new callback wiring is needed. No tooltip is added (dropdown items don't use tooltips anyway).

## Out of scope
- Desktop header button (already shows the lock badge).
- Any change to `onColoring` logic, entitlement checks, or the upsell modal itself.
- PDF lock badge or any other menu items.
