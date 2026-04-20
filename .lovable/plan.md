

## Update shared Onboarding page (Onboarding.tsx)

Single file change: `src/pages/Onboarding.tsx`. No layout, color, or font changes — only text content and emoji swaps within the existing feature blocks.

### Changes

**1. Topic count (line 158)**
- "34 נושאים מובנים" → "מעל 100 נושאים מובנים"

**2. Replace fragile emojis with text-safe alternatives**
- Line 187 (`סיפורים מעצימים` block): `🪄` → `⭐` (star — universally rendered)
   - Note: line 178 already uses `⭐` for the hero block. To avoid two identical emojis, use `🌟` (glowing star) for `סיפורים מעצימים` instead — also universally supported.
- Line 195 (English stories block): `🇺🇸` (flag, breaks on Windows/older Android) → `🌍` (globe — text-safe)

**3. Add 3 new feature items** in the same exact style as existing ones (the `flex flex-col items-center gap-1.5` block with `text-3xl` emoji + `text-sm text-white/80 leading-snug px-4` paragraph). Inserted after the English-stories block (line 199), before the "Invitation" paragraph (line 204):

- 🖨️ **הדפסה לספר פיזי** — הדפיסו את הסיפור של הילד כספר אמיתי לקחת הביתה
- 🎙️ **הקלטה בקול אדם** — הסיפור מוקלט בקול אדם חם ומרגש
- 🎨 **דפי צביעה** — דפי צביעה מהסיפור להדפסה או לצביעה אונליין

Each new item uses the same wrapper, the same `text-3xl` emoji, the same `<strong className="text-amber-200">` (or rotating amber/pink/purple/green like existing items) for the bolded label, and the same paragraph classes. To match the existing color rotation, the three new strong-tag colors will be: `text-amber-200` (printer), `text-pink-200` (mic), `text-purple-200` (coloring).

### Files NOT changed
- `src/components/shared/AboutSolStoriesContent.tsx` (separate About content shown in Settings dialog — out of scope)
- `src/pages/About.tsx` (separate About route — out of scope)
- All other onboarding logic, terms checkboxes, buttons, background, navigation, role-based logic — untouched.

### Memory
No memory updates required (no architectural rules change).

### How to revert
Restore the original "34 נושאים מובנים" text, restore `🪄` and `🇺🇸`, and remove the 3 new feature blocks.

