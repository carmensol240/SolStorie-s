

## Final Brand Refinement

### Changes Required

Only **1 file** needs updating. Everything else is already correctly implemented.

### 1. PDF Watermark Domain Update

**File: `src/hooks/use-pdf-export.ts` (line 63)**

Update the watermark text:
- **Current**: `"SoulStory™ – כרמית כהן | סיפורים עם נשמה ברוח ה-NLP | © 2026 | www.soulstory.org.il"`
- **New**: `"SoulStory™ – כרמית כהן | סיפורים עם נשמה | © 2026 | www.soulstory.co.il"`

Changes: shortened tagline (removed "ברוח ה-NLP" for cleaner footer), domain changed from `.org.il` to `.co.il`.

### 2. Items Already Complete (No Changes Needed)

| Item | Status |
|------|--------|
| Brand name "SoulStory™" across all screens | Done -- 16 files updated in previous migration |
| `index.html` title and OG tags | Done -- uses "SoulStory™" |
| PWA manifest name/short_name | Done -- "SoulStory" |
| Child profile frames 160px+ with object-cover | Done -- `w-40 h-40` in Profile.tsx |
| Sparkly "ערכת הכלים של כרמית" box | Done -- subscriber/locked states with shimmer animation |
| Home Screen single CTA (redundant button hidden) | Done -- conditional in LoggedInHome.tsx |
| TTS/Read Aloud icons | Already hidden by default -- only shown when user explicitly enables audio in Settings accessibility menu |
| "כרמית כהן" expert branding | Done -- consistent across About, Profile, tips |
| 19.90 ILS yearly subscription | Done -- TOOLKIT_SUBSCRIPTION in pricing.ts, card in Upgrade.tsx |
| RTL-compatible brand display | Done -- `dir="ltr"` spans for English text |

### Summary

Only the PDF watermark line needs a minor text update (shorter tagline + `.co.il` domain). All other requested items are already implemented.

