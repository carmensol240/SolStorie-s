## Global Hebrew typography polish — bold, friendly Heebo everywhere

Make Hebrew text render consistently bold and friendly across the entire app, with proper responsive sizing for hero headers and feature lists on desktop and mobile.

### Changes

**1. `index.html`** — strengthen font loading
- Keep the existing Google Fonts `<link>` (Heebo 400-900 already loaded).
- Add `rel="preload"` for the Heebo woff2 to prioritize it over Assistant.
- Reorder so Heebo loads first.

**2. `tailwind.config.ts`** — make Heebo the default sans
- Set `fontFamily.sans` to `['Heebo', 'Assistant', 'system-ui', 'sans-serif']` so every Tailwind class (`font-sans`, default body) resolves to Heebo.
- Keep `heebo` and `assistant` aliases for any explicit usage.

**3. `src/index.css`** — global Hebrew rules
- Change `body` `font-family` from `'Assistant', 'Heebo'` to `'Heebo', 'Assistant', sans-serif`.
- Set base body weight to `500` (friendlier than 400 for Hebrew).
- Add a global heading rule:
  ```css
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Heebo', sans-serif;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  h1 { font-weight: 900; }
  ```
- Add responsive hero clamp utility:
  ```css
  .hero-title-he { font-size: clamp(1.75rem, 6vw, 3.5rem); font-weight: 900; line-height: 1.15; }
  .hero-subtitle-he { font-size: clamp(1rem, 2.5vw, 1.375rem); font-weight: 600; line-height: 1.5; }
  .feature-item-he { font-weight: 600; line-height: 1.6; }
  ```
- Improve Hebrew rendering:
  ```css
  html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
  ```
- Add a mobile breakpoint tightening tracking for Hebrew at small sizes.

**4. Verify hero/feature components pick up the new defaults**
- Spot-check `src/components/home/GuestLanding.tsx`, `src/pages/Welcome.tsx`, `src/pages/Adventure.tsx` — no JSX changes needed since global CSS + Tailwind defaults cascade. Only adjust if a component hardcodes `font-light` or similar (will grep and remove if found).

### Out of scope
- Logo styling (`logo-3d-bubble` / Baloo 2) stays untouched — already correct.
- Story-viewer book typography stays untouched — has its own font-size accessibility system.
- No content/copy changes.

### How to revert
Restore original `body` font-family in `index.css`, remove the new `h1-h6` and `.hero-title-he` rules, revert `tailwind.config.ts` `fontFamily.sans`, remove the preload link in `index.html`.
