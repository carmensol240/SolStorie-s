

## Plan: Custom Card Visuals for Color and Shape Topics

### What changes
In `src/components/wizard/topic-data.ts`, create two new SVG generator functions (similar to the existing `letterImage`) and update the `image` property for all color and shape topics.

### Changes — `src/components/wizard/topic-data.ts` only

#### 1. Add `colorImage` function (after line 110)

Generates an SVG with:
- Background: rich gradient in the specific color (darker → lighter shade)
- Center: a large soft paint blob/splash shape using an SVG path with a slightly lighter shade + blur filter for glow
- Hebrew color name in large white bold text at the bottom

```typescript
const colorImage = (name: string, baseColor: string, lightColor: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${baseColor}"/><stop offset="100%" stop-color="${lightColor}"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="12" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <ellipse cx="200" cy="175" rx="110" ry="95" fill="${lightColor}" opacity="0.45" filter="url(#glow)"/>
    <text x="50%" y="82%" font-size="48" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${name}</text>
  </svg>`)}`;
```

#### 2. Add `shapeImage` function (after `colorImage`)

Generates an SVG with:
- Background: fun colorful gradient (unique per shape)
- Center: large white SVG shape with soft glow filter
- Hebrew shape name in large white bold text at the bottom

```typescript
const shapeImage = (name: string, gradFrom: string, gradTo: string, shapeSvg: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${gradFrom}"/><stop offset="100%" stop-color="${gradTo}"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="10" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    ${shapeSvg}
    <text x="50%" y="82%" font-size="48" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${name}</text>
  </svg>`)}`;
```

#### 3. Update color topic `image` values (lines 337-345)

Each color topic gets `colorImage(hebrewName, darkShade, lightShade)`:
- `color-red`: `colorImage("אדום", "#DC2626", "#F87171")`
- `color-blue`: `colorImage("כחול", "#2563EB", "#60A5FA")`
- `color-yellow`: `colorImage("צהוב", "#CA8A04", "#FDE047")`
- `color-green`: `colorImage("ירוק", "#16A34A", "#4ADE80")`
- `color-orange`: `colorImage("כתום", "#EA580C", "#FB923C")`
- `color-purple`: `colorImage("סגול", "#7C3AED", "#A78BFA")`
- `color-pink`: `colorImage("ורוד", "#DB2777", "#F9A8D4")`
- `color-white`: `colorImage("לבן", "#94A3B8", "#E2E8F0")`
- `color-black`: `colorImage("שחור", "#1E293B", "#475569")`

#### 4. Update shape topic `image` values (lines 346-351)

Each shape gets `shapeImage(hebrewName, gradFrom, gradTo, whiteSvgShape)`:
- `shape-circle`: circle SVG, purple-to-blue gradient
- `shape-square`: rect SVG, green-to-teal gradient
- `shape-triangle`: polygon SVG, orange-to-amber gradient
- `shape-rectangle`: rect SVG, pink-to-rose gradient
- `shape-heart`: heart path SVG, red-to-pink gradient
- `shape-star`: star polygon SVG, amber-to-yellow gradient

### No other files touched.

