
## Plan: Fix PWA Shortcut Button + Update Device Availability Text

### Task 1: Fix "Home Screen Shortcut" Button in Settings

**Problem**: When the app is not installed AND cannot trigger the native install prompt (common on many browsers), the PWA section shows nothing -- no button, no instructions. The user clicks and nothing happens.

**Solution**: Add a modal dialog that opens when the user taps the shortcut area, showing platform-specific installation instructions:

**Changes in `src/pages/Settings.tsx`**:
1. Add a new `installHelpOpen` state for the modal
2. Replace the current PWA section logic: instead of showing nothing when `!canPrompt && !isIOS && !isInstalled`, show a clickable button that opens the help modal
3. The modal will contain:
   - **iOS section**: Icon of Share button + text "לחצו על כפתור השיתוף (Share) ובחרו ב-'הוספה למסך הבית' (Add to Home Screen)"
   - **Android section**: Icon of three dots + text "לחצו על שלוש הנקודות בתפריט הדפדפן ובחרו ב-'התקן אפליקציה' או 'הוסף למסך הבית'"
   - Auto-detect platform to highlight the relevant instruction, but show both
4. Keep existing behavior: if `canPrompt` is true, the native install button still works; if `isInstalled`, show the green checkmark

### Task 2: Update Device Availability Text

**Changes in `src/pages/Auth.tsx`** (login screen):
- Update the existing text from "קראו בכל מקום: בנייד, בטאבלט או במחשב" to the requested text: "SoulStory זמינה עבורכם בכל מקום: בטלפון, בטאבלט ובמחשב האישי"
- Wrap "SoulStory" in `dir="ltr"` span per branding convention

**Changes in `src/pages/About.tsx`** (footer/landing):
- Update the existing footer text from "זמין בנייד, בטאבלט ובמחשב" to match: "SoulStory זמינה עבורכם בכל מקום: בטלפון, בטאבלט ובמחשב האישי"
- Same RTL branding treatment for "SoulStory"

### Technical Details

**Files to modify**:
1. `src/pages/Settings.tsx` -- Add install help Dialog with platform detection and visual instructions
2. `src/pages/Auth.tsx` -- Update device availability text (line ~1094)
3. `src/pages/About.tsx` -- Update footer device availability text (lines ~114-125)

**No new dependencies needed** -- uses existing Dialog component and lucide icons.

**All previous changes preserved** -- this plan only touches Settings PWA UI, Auth footer text, and About footer text. Story generation, illustration consistency, and book layout code are untouched.
