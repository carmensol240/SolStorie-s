

## Plan: Fix PWA Banner + iPhone Coloring Toolbar

### Changes

#### 1. Remove PWA Install Banner — `src/App.tsx`
Remove the `<PWAInstallBanner />` component and its import. This removes the "הוסיפו אותנו למסך הבית" banner globally.

#### 2. Fix iPhone toolbar visibility — `src/components/story/OnlineColoringCanvas.tsx`
On iPhone, the bottom toolbar (colors + tools) is hidden behind the browser's bottom bar because `100dvh` still doesn't account for the safe area inset.

**Fix**: Add `pb-safe` (padding-bottom safe area) to the bottom toolbar, and add `env(safe-area-inset-bottom)` padding so the color palette stays above the iPhone browser chrome. Specifically:
- Add `pb-[env(safe-area-inset-bottom,12px)]` to the bottom toolbar container (line 533)
- This ensures the toolbar content is always visible above the iPhone Safari bottom bar

### What stays the same
- All drawing/coloring logic
- Canvas sizing and auto-trim
- Desktop behavior
- Everything else in the app

