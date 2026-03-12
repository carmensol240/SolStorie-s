

## Plan: Hide PWA Install Section When Running as Installed App

### Current Behavior
The Settings screen (lines 183–215) always shows the PWA install section. It already uses `isInstalled` from `usePwaInstall()` to show "✅ האפליקציה כבר מותקנת" — but the entire section remains visible.

### Change
Wrap the entire PWA install `<div>` (lines 183–215) in a conditional: `{!isInstalled && ( ... )}`. The `isInstalled` flag from `usePwaInstall()` already checks `window.matchMedia('(display-mode: standalone)')`, so no new detection logic is needed.

**Single edit in `src/pages/Settings.tsx`:**
- Line 183: Add `{!isInstalled && (`
- Line 215: Close with `)}`
- Remove the inner `isInstalled` green checkmark branch (lines 194–197) since it will never render

