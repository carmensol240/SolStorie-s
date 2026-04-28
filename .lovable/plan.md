

## Remove caption text + bottom CTA from Adventure page (keep gold coin)

Single file change: `src/pages/Adventure.tsx`. Two precise removals — gold coin animation stays.

### Changes

**1. Remove the caption line below the gold coin** (line ~158):
```tsx
<p className="text-white/90 text-xs font-bold drop-shadow-md">הסיפור הראשון שלכם במתנה 🎁</p>
```
The wrapping `<div className="flex flex-col items-center gap-1">` stays so the spinning gold coin keeps its centered layout.

**2. Remove the orange/pink "יוצאים להרפתקה ✨" CTA button** (the entire `<button onClick={handleAdventureCTA}>...</button>` block at the bottom of the hero section, including its `Wand2` icon and label).

**3. Clean up dead code only** (no behavior change):
- Remove the `handleAdventureCTA` callback (only used by the removed button).
- Remove `Wand2` from the `lucide-react` import (only used by the removed button). Keep `Coins`.
- Keep `useNavigate` — still used by the coin counter (`navigate("/upgrade")`).

### What stays exactly as-is

- Spinning **gold coin animation** with "סיפור חינם! ✨" label — untouched.
- Top-right glassmorphism **coin counter** — untouched.
- Purple **`WelcomeGiftBanner`** — untouched.
- `SolStorie's™` rainbow logo, hero video, gradient overlays, sparkle particles, `MobileNavigation` — all untouched.

### Memory

No memory updates required (visual cleanup only).

### How to revert

Restore the caption `<p>`, restore the CTA `<button>` with its `handleAdventureCTA` callback, and re-add `Wand2` to the import.

