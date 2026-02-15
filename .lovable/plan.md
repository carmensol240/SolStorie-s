
# Final Launch Configuration for SolStorie's™

## Status Check - What's Already Done

Most items from the previous branding update are already in place:
- Domain set to soulstory.co.il in index.html
- SolStorie's™ branding across most files
- Character already named Zoe (no "Noi" found anywhere)
- Logo sized for mobile
- Footer updated correctly
- Read-aloud removed from standard story UI
- Privacy policy has all required regulatory content with the correct brand name and domain

## Remaining Fixes (3 files)

### 1. Fix export name in AboutSolStoriesContent.tsx
The file was renamed but the exported function is still called `AboutSoulStoryContent`. Rename to `AboutSolStoriesContent`.

### 2. Fix import + comment in Settings.tsx
- Line 17: Update import from `AboutSoulStoryContent` to `AboutSolStoriesContent`
- Line 112: Change comment from "SoulStory App" to "SolStorie's App"
- Line 211: Update component usage `<AboutSoulStoryContent />` to `<AboutSolStoriesContent />`

### 3. Remove "read-aloud" marketing text from GuestLanding.tsx
Line 51 says "סיפורים והקראה קולית איכותית של ילדה ללמידת שפה בצורה חווייתית" -- the "הקראה קולית" mention should be replaced since read-aloud was removed. Suggested replacement: "סיפורים באנגלית עם ניקוד ותרגום ללמידת שפה בצורה חווייתית."

## New Feature: Golden Heart Rewards (PDF Coloring Page + Certificate)

When the "לב זהב" (Golden Heart) badge is unlocked in the Profile page, two new downloadable items become available:

### What gets added:
1. **Coloring Page PDF** -- A printable coloring page featuring the Sol character, generated client-side using jspdf (already installed)
2. **"Official Friend" Certificate** -- A branded certificate with the child's name, date, and the footer "SolStorie's™ | כל הזכויות שמורות"

### Implementation Details:

**New file: `src/components/profile/GoldenHeartRewards.tsx`**
- A component that renders two download buttons (coloring page + certificate) when the badge is unlocked
- Uses jspdf to generate both PDFs client-side
- Certificate includes: child name, date, Sol character branding, and the required footer
- Coloring page includes: simple line-art layout with "SolStorie's™" header and branded footer

**Modified file: `src/pages/Profile.tsx`**
- Import and render `GoldenHeartRewards` component below the badge grid
- Pass `childName`, `isUnlocked` (from the "לב זהב" badge state), and the badge data
- Only visible when the Golden Heart badge is unlocked
- Styled consistently with the existing glassmorphism card design

### Technical Notes
- jspdf is already installed -- no new dependencies needed
- PDFs are generated entirely client-side (no backend calls)
- Hebrew text in jspdf requires embedding the Heebo font (already available at `src/assets/fonts/Heebo-Regular.woff2`) -- it will be loaded as base64 for PDF rendering
- Both PDFs include the branded footer: "SolStorie's™ | כל הזכויות שמורות"
- The coloring page uses simple geometric shapes and line art (no external images needed)
- The certificate uses a decorative border with gradient-inspired colors rendered as PDF drawing commands

### Story Length Logic
Already correctly implemented in the `generate-story` edge function per the saved project memory. No changes needed -- ages 0-2 get short stories, 3-6 medium, 7-8 complex with full vocalization.
