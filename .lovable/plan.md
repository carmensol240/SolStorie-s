

## Plan: Redesign Story Page Layout

### What changes

**1. Pages with illustration (types: `illustration` and `combined`)**
- Image fills the entire page (`object-cover`, absolute inset-0)
- Dark gradient overlay from bottom (`from-black/70 via-black/30 to-transparent`)
- White text centered at bottom over the gradient
- Page number in subtle white at very bottom center

**2. Pages without illustration (type: `text`)**
- Themed background gradient based on story topic category:
  - Torah/biblical topics → warm golden/brown (`#8B6914`, `#D4A843`)
  - Magic/fantasy → purple (`#4a2080`, `#2d1a6e`)
  - Nature/animals → green (`#1a4a2d`, `#2d6e3a`)
  - Sea/adventure → blue (`#1a2d6e`, `#2d4a8e`)
  - Default → soft purple
- Small themed emoji icon centered above the text
- Dark readable text (matching theme) on semi-transparent card
- Page number at bottom center in muted tone

### Files to edit

**`src/pages/StoryViewer.tsx`** (single file, ~3 areas):

1. **Update `getTopicTheme` function** (lines 91-113): Change background colors to match the new warm/green/blue/purple scheme instead of all-dark-purple variants. Add Torah-specific detection (`תנ"ך`, `משה`, `נח`, `אברהם`, `דוד`, `אסתר`, `יונה`, `שמשון`, `יוסף`, `חנוכה`, `יציאת מצרים`).

2. **Update illustration page rendering** (lines 1426-1497): For `type === 'illustration'`, add the story text as a white overlay at the bottom with a dark gradient, matching the combined page pattern. Currently illustration pages show only the image with no text.

3. **Update text page rendering** (lines 1498-1543): Replace the dark purple background with the themed gradient. Show the topic emoji icon centered above the text. Change text color from dark purple to a theme-appropriate dark color. Keep the glassmorphism card style but adjust colors.

4. **Update combined page rendering** (lines 1354-1425): Already mostly correct (fullscreen image + text overlay). Minor adjustments to ensure gradient consistency.

No logic changes — only visual/styling modifications.

