
## Plan: Add Subtle Price Animation to Sale Prices

### Change — `src/pages/Upgrade.tsx`

Add a gentle breathing animation to the sale price element (line 364). The price will softly pulse with a faint purple glow every 3 seconds — elegant and professional.

```tsx
// Line 364-366: add animation class
<div className="text-xl font-black text-white animate-[subtle-price-pulse_3s_ease-in-out_infinite]">
  ₪{pkg.price}
</div>
```

### Change — `tailwind.config.ts`

Add the `subtle-price-pulse` keyframe in the `keyframes` section:

```ts
"subtle-price-pulse": {
  "0%, 100%": { transform: "scale(1)", textShadow: "0 0 0px transparent" },
  "50%": { transform: "scale(1.05)", textShadow: "0 0 8px rgba(192,132,252,0.4)" },
},
```

Scale goes from 1.0 to 1.05 — barely noticeable breathing. The purple glow (rgba matching `#c084fc`) fades in and out softly. Professional, not distracting.

### Files modified
1. `tailwind.config.ts` — add keyframe
2. `src/pages/Upgrade.tsx` — apply animation class to sale price
