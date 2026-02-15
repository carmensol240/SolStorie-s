

# Global Branding Update: SolStories → SolStorie's™

## Overview
Most of the app already uses the correct "SolStorie's™" branding. A few files still use "SolStories" (without apostrophe and trademark). No instances of "Noi" character were found -- all search hits were Hebrew words like "מנוי" (subscription).

---

## Files Requiring Changes

### 1. `index.html` (2 changes)
- Line 6: Update `<title>` from "SolStories" to "SolStorie's™"
- Line 30: Update `og:title` from "SolStorie's" to "SolStorie's™" (already has apostrophe, just missing in title tag)

### 2. `src/pages/Onboarding.tsx` (3 changes)
- Line 72: Toast message "ברוכים הבאים ל-SolStories!" → "ברוכים הבאים ל-SolStorie's™!"
- Line 127: Title span "SolStories" → "SolStorie's™"
- Line 135: Inline text "SolStories" → "SolStorie's™"
- Line 141: Inline text "SolStories" → "SolStorie's™"

### 3. `src/pages/TermsOfService.tsx` (2 changes)
- Line 33: "SolStories" → "SolStorie's™"
- Line 61: "SolStories" → "SolStorie's™"

### 4. `supabase/functions/generate-story/index.ts` (4 changes)
- Line 901: "עולם SolStories" → "עולם SolStorie's™"
- Line 903: "עולם SolStories" → "עולם SolStorie's™"
- All other occurrences of "SolStories" in the AI prompt text

## No Changes Needed

These files already use the correct "SolStorie's™" branding:

| File | Status |
|------|--------|
| `src/pages/About.tsx` | Correct |
| `src/pages/Settings.tsx` | Correct |
| `src/pages/PrivacyPolicy.tsx` | Correct |
| `src/pages/Profile.tsx` | Correct |
| `src/components/shared/GlobalFooter.tsx` | Correct |
| `src/components/shared/AboutSoulStoryContent.tsx` | Correct |
| `src/components/home/GuestLanding.tsx` | Correct |
| `src/hooks/use-pdf-export.ts` | Correct (footer: "SolStorie's™ | כל הזכויות שמורות") |

## Character Name "Noi"
No instances of "Noi" or "נוי" as a character name were found. All search hits were Hebrew words like "מנוי" (subscription) or "שינוי" (change). Zoe (זואי) is already correctly referenced throughout the codebase.

## Summary

| File | Changes |
|------|---------|
| `index.html` | Fix title tag to "SolStorie's™" |
| `src/pages/Onboarding.tsx` | Replace 4 instances of "SolStories" with "SolStorie's™" |
| `src/pages/TermsOfService.tsx` | Replace 2 instances of "SolStories" with "SolStorie's™" |
| `supabase/functions/generate-story/index.ts` | Replace ~4 instances in AI prompt text |

Total: 4 files, ~12 text replacements. No structural or layout changes needed.

