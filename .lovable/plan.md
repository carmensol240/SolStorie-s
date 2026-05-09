## Goal
On `/create`, stop the fixed "המשיכו" action bar from covering the SolStorie's logo and copyright, and trim the dead space under the photo upload area.

## Root cause
In `src/pages/CreateStory.tsx`:
- The action bar is `position: fixed; bottom: 4.5rem` (above `MobileNavigation`).
- The footer is rendered after `<main>` in normal flow inside `<div className="pb-24">`. It scrolls into the bottom of the viewport and the fixed button sits in front of it, hiding the logo/copyright.
- `<main>` content uses `paddingBottom: '180px'`, which on tablet/desktop leaves a large empty gap under the photo upload area before the footer.

## Changes

### 1. `src/pages/CreateStory.tsx` — render the footer inside the fixed action bar, above the button

Replace the current bottom-of-page block:

```tsx
{step !== 2 && (
  <div className="fixed bottom-[4.5rem] left-0 right-0 z-[50] bg-gradient-to-t from-background via-background to-transparent pt-6 pb-3 px-3 pb-safe">
    <div className="container max-w-lg mx-auto">
      <Button ...>...</Button>
    </div>
  </div>
)}

<div className="pb-24">
  <GlobalFooter />
</div>

<MobileNavigation />
```

With:

```tsx
{step !== 2 && (
  <div className="fixed bottom-[4.5rem] left-0 right-0 z-[50] bg-gradient-to-t from-background via-background to-transparent pt-6 pb-2 px-3 pb-safe">
    <div className="container max-w-lg mx-auto">
      <Button ...>...</Button>
      <GlobalFooter />
    </div>
  </div>
)}

{step === 2 && (
  <div className="pb-24">
    <GlobalFooter />
  </div>
)}

<MobileNavigation />
```

This guarantees the logo + copyright are always above the button (never covered) on steps 1 and 3, and keeps existing behavior on step 2 (no fixed bar on the auth step).

### 2. `src/pages/CreateStory.tsx` — trim the bottom padding under content

Same file, the `<main>` inner container:

- `style={{ paddingBottom: '180px' }}` → `style={{ paddingBottom: '120px' }}`

Rationale: the action bar + footer now occupy more vertical space, but on tablet/desktop the previous 180 px left a noticeable gap under the upload box. 120 px keeps the button comfortably clear of the last form element while removing the obvious empty stretch the user is seeing.

### 3. `src/components/wizard/ChildInfoStep.tsx` — reduce the empty area inside the upload dropzone on tablet

The dropzone label (line ~935) currently forces `md:min-h-[320px]`, which adds a lot of empty space below the camera/tips block on tablet.

- `min-h-[140px] sm:min-h-[260px] md:min-h-[320px]` → `min-h-[140px] sm:min-h-[200px] md:min-h-[220px]`

Mobile size unchanged.

## Out of scope
No changes to: the avatar block, the action button itself, `MobileNavigation`, `GlobalFooter` markup, copy, colors, or any logic. No changes outside `CreateStory.tsx` and the single line above in `ChildInfoStep.tsx`.
