

## Plan: Functional PWA Install Button in Settings

### What Changes

Replace the current fallback "How to add to home screen?" button (which opens a manual instructions dialog) with a proper functional install button that triggers the browser's native PWA install prompt. When the prompt is unavailable (iOS or unsupported browsers), keep the instructional fallback.

### Changes

**File: `src/pages/Settings.tsx`**

1. **Update button label** from "הוסף קיצור דרך למסך הבית" to "התקנת אפליקציה על מסך הבית" when `canPrompt` is true
2. **Update section title** from "קיצור דרך למסך הבית" to "התקנת SoulStory"
3. **Update the fallback button** (when `!canPrompt && !isInstalled`): keep the install help dialog for iOS/unsupported browsers, but update the label to mention SoulStory
4. **Update the install help dialog title** to reference SoulStory instead of generic text

**File: `src/hooks/use-pwa-install.ts`** -- No changes needed. The existing hook already implements the exact `beforeinstallprompt` capture and `promptInstall()` logic requested.

**File: `src/components/pwa/PWAInstallPrompt.tsx`** -- No changes needed. The floating banner already works correctly.

### Technical Details

The existing `usePwaInstall` hook already:
- Listens for `beforeinstallprompt` and stores the deferred event
- Exposes `canPrompt` (true when native prompt is available)
- Exposes `promptInstall()` which calls `deferredPrompt.prompt()` and handles `userChoice`
- Detects iOS and standalone mode

The Settings page already uses this hook correctly. The main changes are cosmetic/branding:
- Rename labels to "התקנת SoulStory" and "התקנת אפליקציה על מסך הבית"
- Ensure the dialog mentions SoulStory
- Keep the fallback instructions dialog for browsers that don't support `beforeinstallprompt`

