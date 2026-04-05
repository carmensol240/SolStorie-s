

## Plan: Coloring Credits — Toast with Purchase Link, Instant Refresh, and Separate Display

### Overview
Three changes: (1) upsell toast with action button, (2) credits refresh after purchase, (3) separate coloring credits display.

---

### 1. Upsell toast with "לרכישה" button — `src/pages/StoryViewer.tsx`

Replace the 3 upsell toast calls (lines ~1929, ~2043, ~2083) from:
```ts
toast({ title: "נגמרו קרדיטים לצביעה 🎨" });
```
to using `sonner` toast with an action button:
```ts
import { toast } from "sonner";
// ...
toast.error("נגמרו קרדיטי הצביעה 🎨", {
  action: { label: "לרכישה", onClick: () => navigate("/upgrade") },
});
```

### 2. Instant credit refresh after purchase — `src/pages/Upgrade.tsx`

After the coloring kit purchase success (line ~598), broadcast a custom event so StoryViewer (or any open page) can pick up the new credits without a page reload:

```ts
window.dispatchEvent(new CustomEvent('coloring-credits-updated'));
```

In `src/pages/StoryViewer.tsx`, no special listener needed — the edge function re-checks credits server-side on each call, so the next coloring attempt will just work. The main issue is the **client-side display**. We'll handle that via the new hook (see item 3).

### 3. Separate coloring credits display — new hook + UI changes

**New file: `src/hooks/use-coloring-credits.ts`**
- Fetches `coloring_credits` from `profiles` table
- Listens for `coloring-credits-updated` window event to auto-refresh
- Exposes `{ coloringCredits, loading, refetch }`

**`src/components/home/LoggedInHome.tsx`**
- Import `useColoringCredits`
- Add a second pill next to the story credits pill showing coloring credits with a `Palette` icon in purple/pink color, e.g.:
```tsx
<button className="flex items-center gap-2 bg-white/20 ...">
  <Palette className="w-5 h-5 text-purple-400" />
  <span className="font-bold text-purple-900">{coloringCredits}</span>
</button>
```

**`src/components/home/UserDashboard.tsx`** (if still used)
- Add `coloringCredits` prop
- Add a third stat item with `Palette` icon in purple, showing coloring credits separately from story credits

**`src/pages/Upgrade.tsx`**
- After successful coloring kit purchase, dispatch `coloring-credits-updated` event

### What stays the same
- Edge function logic (server-side credit checks)
- All other pages, components, and flows
- Story credits display unchanged

