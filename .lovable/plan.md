

# Fix Login Screen -- Sol Character & Speech Bubble

## File: `src/pages/Auth.tsx`

### 1. Enlarge Sol Character (line 1060)

Increase the character size by ~20% to make her more prominent and clear.

**Current**: `className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-lg"`

**New**: `className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-lg"` (from 80px to 96px on mobile, 96px to 112px on desktop)

### 2. Reposition Sol Higher to Create "Peeking" Effect (line 1059)

Shift the character further up so her lower body is hidden behind the white login box, creating a natural "peeking from behind" look.

**Current**: `className="absolute -top-10 -left-6"` with `style={{ transform: 'translate(-10%, -35%)' }}`

**New**: `className="absolute -top-14 -left-6"` with `style={{ transform: 'translate(-10%, -30%)' }}` -- moves her higher so the box edge cuts across her midsection naturally.

### 3. Reposition Speech Bubble to Avoid Logo Overlap (line 1064)

Move the bubble further right and slightly down so it sits clearly to the right of Sol and below the SolStorie's™ logo.

**Current**: `className="absolute -top-10 left-20 sm:left-24"`

**New**: `className="absolute -top-6 left-24 sm:left-28"` -- shifts it ~16px down and ~16px right, ensuring no overlap with the logo above.

Also move the triangle pointer from `left-4` to `left-2` so it points more toward Sol's position.

### Summary of Visual Result

- Sol is larger (20% increase) and positioned higher, so the login box naturally "clips" her lower body -- creating a peeking effect
- The speech bubble sits clearly to the right of Sol and below the logo line
- No changes to the login form content, glassmorphism styling, or visual hierarchy (those were already fixed in the previous edit)

