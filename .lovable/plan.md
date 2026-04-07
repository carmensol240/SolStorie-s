

## Plan: Update Color Palette in Coloring Canvas

### Single file changed: `src/components/story/OnlineColoringCanvas.tsx`

### Current palette analysis

**SKIN_EARTH_COLORS** (top row):
`#F5C594` (light beige), `#C68642` (medium brown), `#8D5524` (dark brown), `#6B8F71` (sage green), `#FFD700` (gold), `#C0C0C0` (silver/light gray), `#D3D3D3` (lighter gray), `#8B4513` (saddle brown), `#A0522D` (sienna), `#D2691E` (chocolate)

**COLORS** (bottom row):
`#FF6B6B`, `#FF9F43`, `#FECA57`, `#48DBFB`, `#0ABDE3`, `#5F27CD`, `#FF6FF2`, `#EE5A24`, `#A3CB38`, `#1DD1A1`, `#C4A35A`, `#2C3E50`, `#FFFFFF`, `#000000`

### Changes

**Remove from SKIN_EARTH_COLORS:**
- `#D3D3D3` (lighter gray — keep `#C0C0C0` dark gray) → actually user says remove light gray, keep dark gray. `#D3D3D3` is lighter, `#C0C0C0` is darker → remove `#D3D3D3`
- One duplicate dark brown — `#8B4513` and `#A0522D` are very close; remove `#A0522D` (sienna, lighter of the two)
- Lighter beige/skin — remove `#F5C594` (lightest), keep `#C68642` (darker skin tone)

**Add to palette:**
- `#FFB6C1` — light pink / pastel pink
- `#BFFF00` — lime yellow-green
- `#1B2A4A` — dark navy blue
- `#C4B5E0` — light lavender purple
- `#D4AF37` — gold/champagne

**Move black to top:** Put `#000000` as first item in SKIN_EARTH_COLORS (top row) so it's visible without scrolling.

### Updated arrays

```ts
const SKIN_EARTH_COLORS = [
  '#000000', '#C68642', '#8D5524', '#6B8F71', '#FFD700',
  '#C0C0C0', '#8B4513', '#D2691E', '#D4AF37', '#FFB6C1',
];

const COLORS = [
  '#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB',
  '#0ABDE3', '#1B2A4A', '#5F27CD', '#C4B5E0', '#FF6FF2', '#EE5A24',
  '#A3CB38', '#BFFF00', '#1DD1A1', '#C4A35A', '#2C3E50',
  '#FFFFFF',
];
```

### What stays the same
- All drawing logic, tools, canvas sizing, save/print
- Palette layout (two rows, same rendering code)
- No other files changed

