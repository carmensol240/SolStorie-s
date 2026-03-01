

## Urgent Fix: Illustration Rendering, Read-Aloud Relocation, Privacy & Subscription

### 1. Fix Illustration Prompt Logic (Full Body / No Cropping)

**Files to update:**
- `supabase/functions/generate-illustrations/index.ts` (main generation)
- `supabase/functions/retry-illustration/index.ts` (retry generation)
- `supabase/functions/generate-cover/index.ts` (cover generation)

**Changes:**
- Add explicit "Sole of the Foot" rule and grounding instructions to the style prefix and negative prompt in all three edge functions
- Update the `stylePrefix` in `generate-illustrations/index.ts` (line ~213) and `retry-illustration/index.ts` (line ~117) to include:
  - "ALWAYS show characters FULL BODY from head to toe with feet VISIBLE and GROUNDED on the surface (grass, floor, path). The character's full body including shoes/feet MUST be visible."
  - "Frame the character with generous margin from all edges -- at least 10% padding on each side. Character must be FULLY CONTAINED within the frame, never cropped."
- Expand the NEGATIVE PROMPT to include: "cropped feet, cut off legs, floating character, character not touching ground, half-body, missing feet, legs cut off at frame edge"
- Apply the same updates to the `retry-illustration` edge function's `stylePrefix` block

### 2. Remove Read-Aloud from Story Screen, Keep in Accessibility Menu

**File: `src/pages/StoryViewer.tsx`**

The read-aloud button was already removed from the main UI (line 877 shows a comment "Read Aloud button removed per user request"). However, there are still leftover imports and state:
- Remove `isReadAloudDismissed` state (line 101)
- Remove `useTextToSpeech` hook usage (line 121) and its import (line 32)
- Clean up any remaining TTS-related code in StoryViewer

The "Read Aloud" toggle already exists in the Accessibility Menu (`AccessibilityMenu.tsx`, lines 105-118) as "Audio Support" which enables/disables the read-aloud button. This will remain as-is -- it's the correct location for this feature.

### 3. Privacy & COPPA/GDPR Compliance

The app already has:
- Privacy Policy page (`src/pages/PrivacyPolicy.tsx`) 
- Terms of Service page (`src/pages/TermsOfService.tsx`)
- Legal consent flow (`src/pages/LegalConsent.tsx`)
- Privacy safeguards (generic placeholders instead of real names)
- PII masking in edge function logs

**Additional hardening:**
- Add a brief privacy disclosure note in the Settings page (`src/pages/Settings.tsx`) linking to the Privacy Policy, with text like "All data handled per child privacy regulations"
- Verify the About page (`src/components/shared/AboutSolStoriesContent.tsx`) includes the existing professional disclaimer

### 4. Subscription Plan Verification Reminder

**File: `src/pages/Settings.tsx`** (or a dev-only component)

- Add a dev-mode-only visual banner (using existing `isDevModeEnabled()`) at the top of the Settings page reminding to verify the subscription plan before launch
- This will only be visible when dev mode is enabled and will not appear in production for real users

### Technical Summary

| Task | Files Changed | Deploy Needed |
|------|--------------|---------------|
| Fix illustration prompts | `generate-illustrations/index.ts`, `retry-illustration/index.ts` | Yes (edge functions) |
| Clean up TTS remnants | `StoryViewer.tsx` | No |
| Privacy disclosure | `Settings.tsx` | No |
| Subscription reminder | `Settings.tsx` (dev-only) | No |

