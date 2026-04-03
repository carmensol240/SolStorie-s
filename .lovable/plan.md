

## Plan: Add Spinning Gold Coin Animation to Adventure Screen

### Changes

#### 1. `src/index.css` — Add coin CSS animations
Add at the end of the file:
- `@keyframes coin-spin` — 3D Y-axis rotation (0→360deg)
- `@keyframes coin-glow` — pulsing golden box-shadow
- `@keyframes coin-shimmer` — moving gradient highlight across the coin
- `.gold-coin` class combining all three animations

#### 2. `src/pages/Adventure.tsx` — Add coin element above CTA
Inside the bottom section div (line 149), before `WelcomeGiftBanner`, add:
- A gold coin div (~80px) with circular shape, golden gradient background, border, and the `.gold-coin` class
- Text inside the coin: `סיפור חינם! ✨` (bold, white, text-shadow)
- Below the coin: `<p>` with text `הסיפור הראשון שלכם במתנה 🎁` (small, white, drop-shadow)

The coin uses `perspective` on a wrapper for 3D effect, with continuous Y-axis rotation (~3s), glowing gold shadow pulse, and a shimmer highlight sweep.

### Files modified
1. `src/index.css` — coin animation keyframes and class
2. `src/pages/Adventure.tsx` — coin element in bottom section

