

## Plan: Separate & Enlarge Credit Pills on Home Screen

### Single file: `src/components/home/LoggedInHome.tsx`

### Current state
- Story credits pill: `px-4 py-2`, icon `w-5 h-5`, text `text-lg`
- Coloring credits pill: only shown when `coloringCredits > 0`, smaller (`px-3 py-2`, icon `w-4 h-4`, text `text-sm`)

### Changes

**1. Always show coloring credits pill** (remove `coloringCredits > 0` condition on line 104)
Show it even when 0 so the user always sees both pills side by side.

**2. Make both pills slightly larger and visually consistent**
Both pills get the same styling:
```
px-5 py-2.5, icon w-6 h-6, text text-lg font-bold
```

**3. Update coloring pill styling**
- Icon: `Palette` with `text-purple-400` (keep existing)
- Text: `text-purple-100` for better contrast on the glass background
- Same `bg-white/20 backdrop-blur-xl border border-white/30 rounded-full shadow-lg` as story pill

### Result
Two equally-sized glass pills side by side:
- Left (in RTL): Story credits with Coins icon (amber)
- Right next to it: Coloring credits with Palette icon (purple)

### What stays the same
- All other design, layout, colors, buttons, navigation
- Avatar thumbnail position
- Greeting pill on the opposite side
- No other files changed

