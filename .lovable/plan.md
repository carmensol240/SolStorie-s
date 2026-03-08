

## Style the Original Photo Preview with Cartoon-Blending Frame

### Problem
The original photo in the side-by-side preview looks out of place next to the Pixar-style avatar — it's a raw photo with a plain border.

### Approach
Add a decorative cartoon-style frame around the original photo that visually blends it with the Pixar aesthetic. No AI conversion needed — a CSS-only solution with gradient borders, soft glow, and a subtle vignette overlay.

### Changes — `src/components/wizard/ChildInfoStep.tsx`

**Original photo circle (lines 704-713):**
- Replace the plain `border-2 border-muted` with a thick gradient border (purple-to-pink, matching the app's brand).
- Add a soft purple outer glow (`shadow-[0_0_12px_rgba(168,85,247,0.4)]`).
- Add a CSS `after` pseudo-element (via a div overlay) with a subtle radial vignette gradient that softens the photo edges, giving it an illustrated/painted feel.
- Slightly reduce opacity (`opacity-90`) to soften the photorealistic look.

**Arrow indicator between photos:**
- Replace the `Sparkles` separator with a right-to-left arrow (`→`) or keep Sparkles but add an animated pulse to draw attention to the transformation.

### Visual Result
The original photo will have a glowing gradient border and soft-edge vignette, making it feel like a "before" frame that naturally transitions to the avatar "after" — both fitting within the Pixar aesthetic.

