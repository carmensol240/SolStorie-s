

## Plan: Add Skin/Earth Tone Color Row + Tablet Size Increase

### Single file: `src/components/story/OnlineColoringCanvas.tsx`

### 1. Add new color array (after line 22)
```ts
const SKIN_EARTH_COLORS = [
  '#F5C594', '#C68642', '#8D5524', '#6B8F71', '#FFD700',
  '#C0C0C0', '#D3D3D3', '#8B4513', '#A0522D', '#D2691E',
];
```

### 2. Add new row ABOVE existing colors (before line 602)
Insert a new `<div>` with the same layout as the existing color row, mapping `SKIN_EARTH_COLORS` with identical button styling — but add `md:w-14 md:h-14` for tablet size:

```tsx
{/* Skin & earth tones */}
<div className="flex items-center justify-center gap-1.5 flex-wrap">
  {SKIN_EARTH_COLORS.map((c) => (
    <button key={c}
      onPointerDown={(e) => { e.stopPropagation(); selectColor(c); }}
      className={`w-9 h-9 md:w-14 md:h-14 rounded-full border-2 transition-all active:scale-95 touch-manipulation ${
        color === c && tool !== 'eraser'
          ? 'scale-110 shadow-lg border-gray-700'
          : 'border-white shadow-md hover:scale-105'
      }`}
      style={{ backgroundColor: c }}
    />
  ))}
</div>
```

### 3. Update existing color circles (line 606)
Add `md:w-14 md:h-14` to the existing button className:
```
w-9 h-9 md:w-14 md:h-14 rounded-full ...
```

### What stays the same
- All existing colors, tools, layout, design
- Mobile size stays at `w-9 h-9` (36px)
- No other files changed

