

## Plan: Disable Gift Button + Add "Coming Soon" Tag

### Single file: `src/pages/Upgrade.tsx`

### Changes (lines 758-765)

Replace the `<Link>` with a `<div>` (non-clickable), remove the `Gift` icon (keep only the emoji 🎁), and add a "בקרוב" badge:

```tsx
<div
  className="relative flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-pink-400/20 rounded-xl p-3 mb-4 opacity-60 cursor-not-allowed"
>
  <span className="absolute -top-2 -left-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow">בקרוב</span>
  <span className="text-sm font-bold text-white/90">🎁 רוצה לשלוח סיפורים במתנה?</span>
</div>
```

- Removes `Gift` icon (pink hollow) — keeps only the 🎁 emoji
- Changes `Link` → `div` with `cursor-not-allowed` and `opacity-60`
- Adds a small "בקרוב" badge positioned on the top-left corner
- Remove `Gift` from the import if no longer used elsewhere in this file

### What stays the same
- All other buttons, layout, design, purchase flows
- No other files changed

