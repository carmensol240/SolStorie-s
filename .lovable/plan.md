
# Adding Sol Character to Login Screen

## Overview
Add Sol (the main SolStorie's character) peeking from behind the login container with a speech bubble greeting, plus ensure the rainbow logo is visible at the top.

---

## Changes

### 1. Copy Character Image (`user-uploads://image.png`)
- Copy the uploaded Sol image to `src/assets/sol-waving-hello.png`
- This image will be used as the "peeking" character on the login screen

### 2. Auth Screen Updates (`src/pages/Auth.tsx`)

**a. Import the Sol character image**
- Add import for the new Sol waving image

**b. Rainbow Logo at Top**
- Add a logo header **above** the glassmorphism login container (line ~1049)
- Use the same `logo-3d-bubble` + `logo-rainbow` class pattern from GuestLanding:
  ```
  <h1 dir="ltr" class="text-3xl font-black text-center logo-3d-bubble mb-2">
    <span class="logo-rainbow">SolStorie's(TM)</span>
  </h1>
  ```

**c. Sol Character Peeking Effect**
- Position Sol's image using `absolute` positioning relative to the login container
- Place her at the **top-right** corner, slightly overlapping the container edge (peeking from behind)
- Use `transform: translate(30%, -40%)` to create the "peeking out" illusion
- Size: ~100px wide, with `z-index: 20` to layer correctly
- Add a subtle bounce/float animation

**d. Speech Bubble Greeting**
- Add a small speech bubble near Sol with Hebrew text:
  `"!שלום! בואו נתחיל בהרפתקה"`
- Style as a white rounded bubble with a small triangle pointer toward Sol
- Use `absolute` positioning adjacent to the character
- Subtle fade-in animation with delay

**e. Container Wrapper**
- Wrap the login container in a `relative` div to enable absolute positioning of Sol and the speech bubble relative to the card

---

## Summary

| File | Change |
|------|--------|
| `src/assets/sol-waving-hello.png` | New file -- copied from user upload |
| `src/pages/Auth.tsx` | Add rainbow logo header, Sol peeking character with speech bubble |

## Technical Notes
- The character uses `pointer-events-none` so it doesn't interfere with form interactions
- Speech bubble uses CSS triangle (border trick) for the pointer
- On very small screens (< 380px), the character scales down via responsive classes
- The rainbow logo reuses the existing `.logo-rainbow` CSS class from `index.css`
- No database changes required
