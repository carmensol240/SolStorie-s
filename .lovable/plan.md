
# Rainbow Logo, Scaling & Layout Fixes

## Overview
Update the GuestLanding logo to use a vibrant rainbow gradient with a glowing contrast effect, scale it down to fit comfortably, and fix padding/spacing on both the GuestLanding and Adventure (logged-in) screens.

---

## Changes

### 1. Rainbow Logo CSS (`src/index.css`)

**Replace** the existing `.logo-story`, `.logo-time`, and `.logo-3d-bubble` styles (lines 416-439) with a unified rainbow gradient approach:

- Remove the separate `.logo-story` / `.logo-time` color classes
- Add a new `.logo-rainbow` class that uses `background: linear-gradient(90deg, #ff0000, #ff8c00, #ffd700, #00c853, #2196f3, #9c27b0, #e91e63)` with `-webkit-background-clip: text` and `color: transparent`
- Add a bright outer glow via `filter: drop-shadow(0 0 12px rgba(255,255,255,0.8)) drop-shadow(0 0 24px rgba(255,255,255,0.4))` for contrast against the busy background
- Keep `.logo-3d-bubble` font-family as-is

### 2. GuestLanding Logo Markup (`src/components/home/GuestLanding.tsx`)

**Update lines 116-119** -- the logo `<h1>`:

- Replace `text-5xl sm:text-6xl` with `text-3xl sm:text-4xl` to scale down
- Remove `logo-3d-bubble` and individual `logo-story`/`logo-time` spans
- Use a single `<span>` with the new `logo-rainbow` class wrapping `SolStorie's™`
- Wrap in `dir="ltr"` for RTL compatibility
- Keep `text-center` and add `px-6` for side margins

### 3. Adventure Header Padding (`src/pages/Adventure.tsx`)

**Update line 85** -- the header:

- Change `px-4 pt-4` to `px-5 pt-6` to add more breathing room from screen edges

### 4. GuestLanding General Padding

**Update line 114** -- content container:

- Change `px-3 pb-16` to `px-5 pb-16` for more side padding

### 5. Background Image Positioning (GuestLanding)

**Update lines 98-101** -- background style:

- Change `backgroundPosition` from `'center center'` to `'center top'` so the tree/characters are less cropped at edges
- Add `backgroundSize: 'contain'` as a fallback consideration (keep `cover` but adjust position)

---

## Summary

| File | Change |
|------|--------|
| `src/index.css` | Replace `.logo-story`/`.logo-time` with unified `.logo-rainbow` gradient + glow |
| `src/components/home/GuestLanding.tsx` | Scale down logo, apply rainbow class, add side padding |
| `src/pages/Adventure.tsx` | Increase header padding (px-5 pt-6) |

## Technical Notes
- Rainbow gradient uses `-webkit-background-clip: text` (widely supported in all modern browsers)
- White drop-shadow via `filter: drop-shadow()` creates the contrast glow behind the text
- Logo text remains wrapped in `dir="ltr"` for correct rendering in RTL layout
- No database changes required
