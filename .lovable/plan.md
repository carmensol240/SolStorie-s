

# Redesign Auth Screen -- "Adventure Sky" Theme

## Overview

Transform the login screen from the current tree background to a magical "gateway to another world" experience with pastel skies, rainbow, and dreamy elements.

## Changes

### 1. New Background -- Pastel Adventure Sky

**File: `src/pages/Auth.tsx` (lines 1042-1048)**

Replace the current `soli-tree-background.png` dark overlay with a CSS-only dreamy sky using layered gradients:
- Base: soft pastel gradient (lilac to sky blue to pale pink)
- Decorative rainbow arc using a CSS radial-gradient (blurred, semi-transparent)
- Soft cotton-cloud shapes using CSS pseudo-elements or additional gradient layers
- Green hill silhouettes at the bottom via a gradient or SVG path

Remove the dark gradient overlay (`from-black/30 via-transparent to-black/50`) and replace with a lighter one that keeps text readable.

### 2. Hero Logo Redesign

**File: `src/pages/Auth.tsx` (lines 1052-1054)**

Replace the current `logo-rainbow` class with a larger, more prominent logo:
- Increase size to `text-3xl sm:text-4xl`
- Apply a purple-to-gold gradient (`from-purple-600 via-pink-500 to-amber-400`) instead of the full rainbow
- Add a white glow effect via `drop-shadow` and a subtle text-shadow for separation from background
- Keep the `dir="ltr"` wrapper

### 3. Remove Beta Banner

**File: `src/pages/Auth.tsx`**

Ensure the BetaBanner component is not rendered on the Auth page (check if it's imported/used -- it's not currently in the Auth page render, so no change needed here).

### 4. Device Icons at Bottom

**File: `src/pages/Auth.tsx` (around line 1358)**

Replace the inline text "זמינה עבורכם בכל מקום: בטלפון, בטאבלט ובמחשב האישי" from inside the modal (line 1145-1147) and move it to the bottom of the screen as a standalone row with Lucide icons:
- `Smartphone`, `Tablet`, `Monitor` icons in a row
- Text: "זמינה עבורכם בכל מקום" below icons
- Styled with `text-white/60` and small icon size for subtlety
- Positioned above MobileNavigation

### 5. Modal Box Adjustments

**File: `src/pages/Auth.tsx` (lines 1073, 1138-1148)**

- Remove the device availability text from inside the modal (line 1145-1147) since it moves to the bottom
- Keep the glassmorphism styling, Sol character, and speech bubble exactly as they are now
- Keep "ברוכים הבאים!" at `text-2xl font-black`

### 6. Background CSS Classes

**File: `src/index.css`**

Add new utility classes for the dreamy background:

```css
.bg-adventure-sky {
  background: linear-gradient(
    180deg,
    hsl(270 60% 85%) 0%,      /* lilac top */
    hsl(200 70% 88%) 30%,     /* sky blue */
    hsl(330 50% 90%) 60%,     /* pale pink */
    hsl(140 40% 75%) 90%,     /* green hills */
    hsl(140 45% 55%) 100%     /* darker green base */
  );
}

.rainbow-arc {
  background: radial-gradient(
    ellipse 120% 60% at 50% 80%,
    transparent 55%,
    hsla(0, 80%, 70%, 0.15) 56%,
    hsla(30, 80%, 70%, 0.15) 58%,
    hsla(60, 80%, 70%, 0.15) 60%,
    hsla(120, 60%, 60%, 0.12) 62%,
    hsla(200, 70%, 65%, 0.12) 64%,
    hsla(270, 60%, 65%, 0.12) 66%,
    transparent 68%
  );
}
```

### 7. Import Cleanup

Remove the `soliBackground` import (line 17) since we'll use CSS gradients instead.

## Summary of Visual Result

- Dreamy pastel sky background with subtle rainbow arc (no heavy image file needed)
- Larger, more prominent SolStorie's logo with purple-gold gradient and glow
- Clean white modal with Sol peeking (unchanged from current)
- Device icons elegantly placed at the bottom of the screen
- Calming, accessible color palette with good contrast
- No beta banner

