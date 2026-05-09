# Demo CTA → /create Step 1, scroll to photo upload

## Goal
The CTA "צרו את הסיפור שלכם ✨" in `DemoStory.tsx` should land on `/create` at Step 1 (`ChildInfoStep`) and auto-scroll to the photo upload section.

## Change

### 1. `src/pages/DemoStory.tsx`
- Replace the CTA `onClick` to navigate to `/create#photo-upload-section` (was `/create?step=auth`).
- Nothing else in this file changes.

### 2. `src/components/wizard/ChildInfoStep.tsx`
The hash needs a real target and React Router doesn't auto-scroll to hashes, so two tiny additions:
- Add `id="photo-upload-section"` and `scroll-mt-24` to the existing wrapper `<div className="space-y-1.5">` at line 724 (the "Photo Upload - Enlarged" block). No other markup changes.
- Add one `useEffect` near the top of the component: on mount, if `window.location.hash === "#photo-upload-section"`, run `setTimeout(() => document.getElementById("photo-upload-section")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)`. No new imports.

No other logic, validation, copy, or styling in `ChildInfoStep.tsx` changes. `CreateStory.tsx`, `demo-story.ts`, and all other files are untouched.

## Why ChildInfoStep needs a tiny edit
Without an `id` target and a scroll effect, navigating to `/create#photo-upload-section` does nothing — Step 1 mounts after the route transition and the browser/router won't scroll to the hash on its own. This is the smallest change required to make "scroll to the photo upload section" actually work.

## Files touched
- `src/pages/DemoStory.tsx` — CTA URL only.
- `src/components/wizard/ChildInfoStep.tsx` — one `id` + `scroll-mt-24` on the photo wrapper, plus a 4-line scroll-on-mount effect.
