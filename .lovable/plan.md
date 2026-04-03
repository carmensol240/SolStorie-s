## Plan: Add Subtle Price Animation to Sale Prices

### Change — `src/pages/Upgrade.tsx`

Add a gentle pulse/glow animation to the sale price (`₪{pkg.price}`) on lines 364-366. The animation will be a soft, slow scale pulse (1.0 → 1.05 → 1.0) with a subtle glow effect, repeating every 3 seconds. 

Update line 364-366 from:
```tsx
<div className="text-xl font-black text-white">
  ₪{pkg.price}
</div>
```
to:
```tsx
<div className="text-xl font-black text-white animate-[subtle-price-pulse_3s_ease-in-out_infinite]">
  ₪{pkg.price}
</div>
```

### Change — `tailwind.config.ts`

Add the `subtle-price-pulse` keyframe:
```ts
"subtle-price-pulse": {
  "0%, 100%": { transform: "scale(1)", textShadow: "0 0 0px transparent" },
  "50%": { transform: "scale(1.05)", textShadow: "0 0 8px rgba(192,132,252,0.4)" },
},
```

This creates a barely-noticeable breathing effect with a faint purple glow — professional, not flashy.

### Files modified
1. `src/pages/Upgrade.tsx` — add animation class to sale price
2. `tailwind.config.ts` — add subtle-price-pulse keyframe