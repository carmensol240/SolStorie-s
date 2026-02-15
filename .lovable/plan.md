

# Comprehensive Master Prompt -- SolStorie's™ Launch

## Already Done (No Changes Needed)

- Domain set to soulstory.co.il in index.html
- Brand name SolStorie's™ applied globally
- Character "Noi" already renamed to Zoe everywhere
- Footer already correct: "SolStorie's™ | כל הזכויות שמורות"
- Logo scaled for mobile (text-2xl sm:text-3xl)
- Read-aloud button removed
- Age-based story length logic implemented in generate-story edge function
- Privacy policy updated with new domain
- Golden Heart rewards (certificate + coloring page) already implemented
- PDF footer branding correct

## Changes Required (3 items)

### 1. Update Educator Package: 30 stories -> 25 stories

**File:** `src/config/pricing.ts`

Change the EDUCATOR_PACKAGE from 30 stories to 25 stories, and update the price-per-story calculation accordingly (199/25 = 7.96, displayed as "8₪").

### 2. Update Educator Welcome Banner Text

**File:** `src/components/home/LoggedInHome.tsx`

Replace the current generic educator banner text with the specific festive message in singular feminine Hebrew:

Current: "ברוכים הבאים צוות החינוך היקר! כאן תמצאו כלים ליצירת קסם לימודי וערכי עבור הילדים."

New: "ברוכה הבאה לנבחרת המחנכות של SolStorie's™! כפי שהובטח, 3 סיפורים במתנה מחכים לך בחשבון. אל תשכחי לבדוק את החבילה המיוחדת עבורך: 25 סיפורים ב-199 ש״ח בלבד."

The banner already has the correct behavior: shows only after login for educators, dismissible, saved in localStorage.

### 3. Update Certificate Text to Feature Zoe

**File:** `src/components/profile/GoldenHeartRewards.tsx`

Update the certificate content to match the requested text:

- Change subtitle from "תעודת חברות רשמית" to "תעודת חבר/ה רשמי/ת בנבחרת של זואי!"
- Change body text from "החבר/ה הרשמי/ת של סול" to a multi-line message:
  - "בזכות הסקרנות והדמיון שלך, פתחת את לב הזהב."
  - "מעכשיו, את/ה חלק מהעולם הקסום שלנו."
- Change signature line to: "על החתום: זואי (Zoe)"
- Add a golden heart shape to the coloring page (Zoe holding the Golden Heart) as a lead illustration element

---

## Technical Details

### pricing.ts (line 33-35)
- `stories: 30` -> `stories: 25`
- `pricePerStory: "6.6₪"` -> `pricePerStory: "8₪"`

### LoggedInHome.tsx (line 128-129)
- Replace banner paragraph text with the new singular feminine message
- Wrap "SolStorie's™" in `<span dir="ltr" className="inline-block">` for correct RTL rendering

### GoldenHeartRewards.tsx
- Update `generateCertificate()` function: change subtitle text (line 59), body text (line 73), and add signature line
- Update `generateColoringPage()` function: add a heart shape in Zoe's hands as the lead coloring element

