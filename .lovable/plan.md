

# Fix Auth Screen UI/UX -- Character, Bubble & Hierarchy

## File: `src/pages/Auth.tsx`

### 1. Sol Character Positioning (lines 1059-1061)

The Sol character image (`sol-waving-hello.png`) is already using a transparent PNG. The fix is adjusting its position so it sits more naturally in the top-left corner of the glassmorphism box, peeking from behind it.

**Current**: `className="absolute -top-8 -left-4"` with `style={{ transform: 'translate(-20%, -40%)' }}`

**New**: Change to `className="absolute -top-10 -left-6"` with `style={{ transform: 'translate(-10%, -35%)' }}` -- this shifts Sol slightly more to the left and higher, creating a cleaner "peeking" effect without the white-square look.

### 2. Speech Bubble Repositioning (lines 1064-1070)

Move the bubble down and right by ~15-20px to prevent it from overlapping the SolStorie's™ logo above.

**Current**: `className="absolute -top-14 left-16 sm:left-20"`

**New**: `className="absolute -top-10 left-20 sm:left-24"` -- shifts it ~16px down (from -top-14 to -top-10) and ~16px right (from left-16 to left-20).

### 3. Visual Hierarchy (lines 1138-1148)

Make the "ברוכים הבאים!" title more prominent and reduce the device-availability subtitle.

**Current**:
- Title: `text-xl font-black`
- Subtitle (device info): `text-black/50 text-xs font-bold`

**Changes**:
- Title: Increase to `text-2xl font-black` for more prominence
- Subtitle "התחברו כדי ליצור סיפורים מותאמים אישית": Keep as `text-sm`
- Device availability line: Reduce from `text-xs font-bold` to `text-[10px] font-medium text-black/40` to make it less visually dominant

