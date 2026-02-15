

# Replace Sol Image & Enlarge by 30%

## Changes

### 1. Copy new image to project

Copy `user-uploads://REMOVE_BACKROUND-2.jpeg` to `src/assets/sol-princess-waving.png` (overwriting the previous version). This new version has a proper transparent/checkered background.

### 2. Enlarge Sol by 30%

**File: `src/pages/Auth.tsx` (line 1061)**

Current sizes: `w-24 h-24 sm:w-28 sm:h-28` (96px / 112px)

After 30% increase: `w-32 h-32 sm:w-36 sm:h-36` (128px / 144px)

**Current:**
```tsx
<img src={solWaving} alt="Sol waving hello" className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-lg" />
```

**New:**
```tsx
<img src={solWaving} alt="Sol waving hello" className="w-32 h-32 sm:w-36 sm:h-36 object-contain drop-shadow-lg" />
```

### 3. Adjust position for larger size

Since the character is now bigger, shift the container up slightly to maintain the "peeking" effect:

**Current (line 1060):**
```tsx
className="absolute -top-14 -left-6 z-20 ..."
```

**New:**
```tsx
className="absolute -top-20 -left-8 z-20 ..."
```

No other changes needed -- the import variable name stays `solWaving`.

