

## Plan: Add Post-Purchase Upsell Page

### Overview
Replace the current `PurchaseSuccessModal` (for non-subscription purchases) with a two-step flow: first show an upsell modal offering the edit kit, then proceed to the destination.

### Changes — `src/components/paywall/PurchaseSuccessModal.tsx`

Rewrite the non-subscription branch to show the upsell page instead of the simple success modal:

1. **Add state**: `showUpsell` (starts `true`), track if user accepted the upsell
2. **Remove auto-navigate timer** for non-subscription flow
3. **Add ConfettiCelebration** import for the celebration animation
4. **Close/skip button** in top-left corner (X icon)

**Upsell modal content** (dark purple gradient background matching `bg-gradient-to-b from-[#1a0533] to-[#2d1b69]`):
- Confetti animation at top
- "🎉 הרכישה הושלמה בהצלחה!" title
- "הסיפורים שלך מוכנים לקסם!" subtitle
- Divider
- "רוצה שכל סיפור יהיה מושלם? ✨" upsell heading
- "הוסיפי חבילת 5 עריכות מלאות" description
- "תיקון שגיאות כתיב + עריכת תוכן לכל סיפור" detail
- Price: "רק ₪19.9 לכל 5 עריכות" + "(₪4 לעריכה בלבד)"
- Primary button (green gradient): "כן! הוסיפי לי עריכות ✅" → opens PayPal for edit kit purchase
- Secondary button (text-only, small): "לא תודה, אני מסתדרת" → navigates to /create

5. **When user clicks the upsell CTA**: Show a PayPal button inline for the `EDIT_KIT_PACKAGE` (₪9.90 — note: the modal says ₪19.9 as the display price per the user's request). On success, add edit credits and navigate away.

6. **Skip/decline**: Navigate to `/create` as before.

### Files modified
1. `src/components/paywall/PurchaseSuccessModal.tsx` — replace simple success with upsell flow

