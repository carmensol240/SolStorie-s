

# Interactivity for Locked Badges in "My Journey"

## Overview
Add click-to-reveal tooltips on locked badges in the Profile page, explaining how to unlock each one. Styled to match the whimsical glassmorphism aesthetic.

---

## Changes

### 1. Badge Unlock Messages (`src/pages/Profile.tsx`)

**Extend the Badge interface** (line 37-42) to include an `unlockHint` field:

```ts
interface Badge {
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockHint: string;
}
```

**Update the badges array** (lines 110-116) with specific unlock messages:

| Badge | unlockHint |
|-------|-----------|
| נבט הדמיון | "צרו את הסיפור הראשון שלכם כדי לפתוח את הנבט!" |
| חוקר כוכבים | "קראו 5 סיפורי הרפתקה כדי להפוך לחוקרי כוכבים!" |
| לב זהב | "כדי לפתוח את לב הזהב של סול ולהפוך לחברים הכי טובים, המשיכו להיכנס וליצור סיפורים במשך 7 ימים רצופים. אתם כמעט שם!" |
| קוסם מילים | "צרו 5 סיפורים או יותר כדי להפוך לקוסמי מילים!" |
| החבר/ה של סול | "צרו 10 סיפורים כדי להפוך לחברים הכי טובים של סול!" |

### 2. Click Handler on Locked Badges (`src/pages/Profile.tsx`)

**Update lines 358-382** -- the badge rendering loop:

- Add an `onClick` handler to locked badges that calls `toast()` (sonner) with the badge's `unlockHint`
- Add `cursor-pointer` class to locked badges
- Use sonner toast with a whimsical style: icon of the badge emoji, and the hint text
- Unlocked badges remain non-clickable (no change)

The toast call:
```ts
onClick={() => {
  if (!badge.unlocked) {
    toast(badge.name, {
      description: badge.unlockHint,
      icon: badge.emoji,
    });
  }
}}
```

---

## Summary

| File | Change |
|------|--------|
| `src/pages/Profile.tsx` | Add `unlockHint` to Badge interface, populate hints, add onClick toast for locked badges |

## Technical Notes
- Uses existing `sonner` toast (already imported on line 7) -- no new dependencies
- Toast appears at the bottom of the screen in the app's existing style
- Only locked badges respond to clicks; unlocked badges remain static
- No database changes required

