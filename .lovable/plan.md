
# תוכנית: Phase 2 - Core Logic, UI Refinement & Profile Persistence

## סיכום הבעיות והבקשות

| נושא | סטטוס | עדיפות |
|------|--------|---------|
| קרדיט יחיד למשתמש חדש | נדרש תיקון | 🔴 גבוהה |
| Referral Logic - הפניה רק לאחר הרשמה מלאה | ✅ קיים | - |
| שמירת פרופיל ילד (persistence) | ✅ קיים חלקית | 🟡 בינונית |
| עקביות אווטאר לסיפורים עתידיים | נדרש שיפור | 🔴 גבוהה |
| לבוש דינמי לפי נושא | נדרש הוספה | 🟡 בינונית |
| מסך Hero - רקע מלא + כפתור שקוף נמוך | ✅ מעודכן | - |
| Swipe navigation במובייל | ✅ קיים | שיפור |
| עקביות שפה עברית | חלקית | 🟡 בינונית |
| הסרת Developer Mode מהתחברות | נדרש | 🔴 גבוהה |
| WCAG Accessibility | נדרש בדיקה | 🟡 בינונית |

---

## 1. קרדיט יחיד למשתמש חדש

### בעיה נוכחית
הטריגר `handle_new_user` יוצר פרופיל אבל לא מגדיר קרדיט התחלתי. הקוד ב-`use-credits.ts` מחזיר `1` כברירת מחדל:
```typescript
setCredits(data?.story_credits ?? 1);
```

### פתרון
עדכון פונקציית המסד `handle_new_user` להגדרת קרדיט התחלתי מפורש:

```sql
-- Migration: Set explicit initial credit for new users
ALTER TABLE public.profiles 
ALTER COLUMN story_credits SET DEFAULT 1;

-- Update the handle_new_user function to set initial credit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  safe_display_name text;
BEGIN
  -- ... existing sanitization code ...
  
  INSERT INTO public.profiles (id, display_name, story_credits)
  VALUES (new.id, safe_display_name, 1);  -- Explicitly set 1 credit
  RETURN new;
END;
$function$
```

### קובץ לעדכון
- מיגרציה SQL חדשה

---

## 2. שמירת פרופיל ילד ואווטאר (Persistence Layer)

### מצב נוכחי
- ✅ טבלת `children` קיימת עם שדות: `avatar_url`, `photo_url`
- ✅ הקומפוננטה `ChildInfoStep` שומרת פרופילים
- ⚠️ חסר שדה `avatar_description` לתיאור הדמות המילולי

### שינויים נדרשים

#### א. הוספת שדה לשמירת תיאור הדמות
```sql
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS avatar_description TEXT;
```

#### ב. עדכון Edge Function `generate-story/index.ts`
לוגיקה לבדיקת אווטאר קיים ושימוש חוזר:

```typescript
// Check for existing child avatar and description
const { data: existingChild } = await supabaseAdmin
  .from('children')
  .select('avatar_url, avatar_description, photo_url')
  .eq('user_id', userId)
  .eq('name', childName)
  .maybeSingle();

let characterProfile: CharacterProfile;

if (existingChild?.avatar_description) {
  // REUSE existing character description for visual consistency
  console.log('Reusing saved avatar profile for', childName);
  characterProfile = JSON.parse(existingChild.avatar_description);
} else {
  // Generate new character profile and save it
  characterProfile = await extractCharacterProfile(...);
  
  // Save the description for future stories
  await supabaseAdmin
    .from('children')
    .update({ avatar_description: JSON.stringify(characterProfile) })
    .eq('user_id', userId)
    .eq('name', childName);
}
```

---

## 3. לבוש דינמי לפי נושא

### לוגיקה חדשה
שמירה על מאפיינים פיזיים קבועים עם התאמת לבוש:

```typescript
// Theme-based outfit mapping
const THEME_OUTFITS: Record<string, { outfit: string; background: string; theme: string }> = {
  "space-adventure": {
    outfit: "silver space suit with transparent helmet",
    background: "cosmic space station with stars",
    theme: "exciting space exploration"
  },
  "bedtime-story": {
    outfit: "cozy pajamas with star patterns",
    background: "warm bedroom with soft moonlight",
    theme: "peaceful nighttime"
  },
  "magic-kingdom": {
    outfit: "royal prince/princess gown with crown",
    background: "magical castle with glowing towers",
    theme: "enchanted fairy tale"
  },
  "body-hero-bath": {
    outfit: "white fluffy bathrobe",
    background: "colorful bathroom with bubbles",
    theme: "fun bath time adventure"
  },
  "clean-room": {
    outfit: "comfortable play clothes",
    background: "child's bedroom with toys",
    theme: "organizing adventure"
  },
  // ... more themes
};

// Usage in illustration generation
const themeLogic = THEME_OUTFITS[topic] || {
  outfit: characterProfile.clothingDescription,
  background: "magical setting",
  theme: "exciting adventure"
};
```

### אילוץ ויזואלי
```typescript
const illustrationPrompt = `
${stylePrefix}

=== 🔒 LOCKED CHARACTER - NEVER CHANGE ===
FACE: ${characterProfile.skinTone} skin, ${characterProfile.eyeColor} eyes
HAIR: ${characterProfile.hairDescription} (EXACT - never change!)
=== END LOCKED FEATURES ===

=== DYNAMIC OUTFIT FOR THIS STORY ===
CLOTHING: ${themeLogic.outfit}
SETTING: ${themeLogic.background}
=== END OUTFIT ===

SCENE: ${pageIllustrationPrompt}
`;
```

---

## 4. מסך Hero (Sol/Tree) - תיקון סופי

### מצב נוכחי (`LoggedInHome.tsx`)
הרקע כבר מכסה full-screen, הכפתור נמוך ושקוף.

### שינוי נדרש
הקובץ `LoggedInHome.tsx` אינו בשימוש! דף הבית משתמש ב-`GuestLanding.tsx` לכל המשתמשים.

### פתרון
עדכון `GuestLanding.tsx` להציג ממשק שונה למשתמשים מחוברים:

```typescript
// GuestLanding.tsx - add logged-in user mode
{isLoggedIn && user && (
  <div className="absolute bottom-28 left-4 right-4 z-20">
    <button
      onClick={handleStart}
      className="max-w-xs mx-auto flex items-center justify-center gap-3 
                 bg-white/25 backdrop-blur-lg border border-white/30 
                 rounded-2xl p-4 shadow-2xl 
                 hover:bg-white/35 hover:scale-[1.02] transition-all"
    >
      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
        <Wand2 className="w-5 h-5 text-white" />
      </div>
      <div className="text-right">
        <h3 className="font-black text-lg bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 bg-clip-text text-transparent">יוצאים להרפתקה</h3>
        <p className="text-xs text-purple-800/80">סיפור מותאם אישית ✨</p>
      </div>
    </button>
  </div>
)}
```

---

## 5. שיפור Swipe Navigation במובייל

### מצב נוכחי
`useSwipe` hook קיים ומשולב ב-`StoryViewer.tsx`:
```typescript
const swipeHandlers = useSwipe({
  onSwipeLeft: () => handlePageChange('next'),
  onSwipeRight: () => handlePageChange('prev'),
  threshold: 50,
});
```

### שיפור נדרש - אנימציה חלקה יותר
הוספת visual feedback בזמן הswipe:

```typescript
// Enhanced swipe with visual feedback
const [swipeOffset, setSwipeOffset] = useState(0);

const onTouchMove = useCallback((e: React.TouchEvent) => {
  if (!isSwiping) return;
  const currentX = e.touches[0].clientX;
  const diff = currentX - touchStartX.current;
  
  // Apply visual offset during swipe (clamped)
  const clampedOffset = Math.max(-100, Math.min(100, diff * 0.3));
  setSwipeOffset(clampedOffset);
  
  touchEndX.current = currentX;
}, [isSwiping]);

const onTouchEnd = useCallback(() => {
  setSwipeOffset(0); // Reset visual offset
  // ... rest of logic
}, []);
```

### עדכון StoryViewer.tsx
```typescript
<div 
  className="book-page-container" 
  style={{ 
    transform: `translateX(${swipeOffset}px)`,
    transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
  }}
  {...swipeHandlers}
>
```

---

## 6. הסרת Developer Mode ממסך ההתחברות

### קובץ: `src/pages/Auth.tsx`

**לפני (שורות 17, וקוד קשור):**
```typescript
import { enableDevMode } from "@/hooks/use-dev-mode";
// ... dev mode toggle code
```

**אחרי:**
- הסרת ה-import של `enableDevMode`
- הסרת כל הקוד והUI הקשורים ל-Developer Mode מדף ההתחברות
- השארת הפונקציונליות רק ב-URL עם `?dev=true`

---

## 7. עקביות שפה עברית

### מצב נוכחי
- ✅ `TOPIC_HEBREW_MAP` קיים ב-`generate-story/index.ts`
- ⚠️ צריך לוודא שימוש בכותרות הספרייה

### בדיקה נדרשת
וידוא ש-`topic` נשמר בעברית ומוצג בעברית ב:
- `src/pages/Library.tsx` (כותרות סיפורים)
- `src/components/ui/story-card.tsx` (כרטיסי סיפורים)

---

## 8. Accessibility (WCAG)

### בדיקות נדרשות

| רכיב | בדיקה | סטטוס |
|------|-------|--------|
| ARIA Labels | `aria-label` על כפתורים | ✅ נמצא ברוב הכפתורים |
| ניגודיות טקסט | יחס 4.5:1 לטקסט רגיל | בדיקה נדרשת |
| Alt Text לתמונות | תיאור מילולי | ⚠️ חלקי |
| Focus indicators | Ring styles | ✅ קיים |

### שיפורים נדרשים

```typescript
// Example: Add missing aria-labels
<button 
  onClick={handleShare}
  aria-label="שיתוף הסיפור"
  className="..."
>
  <ShareIcon />
</button>

// Example: Add alt text to illustrations
<SignedImage 
  path={illustration_url}
  alt={`איור עמוד ${page_number}: ${pageText.substring(0, 50)}...`}
/>
```

---

## סיכום הקבצים לשינוי

| קובץ | סוג שינוי | עדיפות |
|------|-----------|---------|
| מיגרציה SQL | הוספת שדה `avatar_description` + עדכון `handle_new_user` | 🔴 |
| `supabase/functions/generate-story/index.ts` | לוגיקת avatar persistence + לבוש דינמי | 🔴 |
| `src/pages/Auth.tsx` | הסרת Developer Mode toggle | 🔴 |
| `src/components/home/GuestLanding.tsx` | UI מותאם למשתמשים מחוברים | 🟡 |
| `src/hooks/use-swipe.ts` | הוספת visual feedback | 🟢 |
| `src/pages/StoryViewer.tsx` | swipe animation + A11y | 🟡 |
| `src/components/ui/signed-image.tsx` | הוספת alt text דינמי | 🟢 |

---

## תזכורת: פיצ'רים קיימים שעובדים

- ✅ **Referral System**: הקוד ב-`Auth.tsx` (שורות 198-243) כבר מעבד הפניות רק לאחר הרשמה מלאה
- ✅ **Child Profile Saving**: `ChildInfoStep.tsx` ו-`ChildProfiles.tsx` שומרים פרופילים
- ✅ **Gender Swap**: פונקציה `swap-gender` עובדת ללא עלות קרדיטים
- ✅ **Hebrew Topic Map**: `TOPIC_HEBREW_MAP` קיים ב-generate-story

---

## בדיקות לאחר היישום

1. רישום משתמש חדש ובדיקה שמקבל בדיוק קרדיט 1
2. יצירת סיפור ראשון ושמירת האווטאר
3. יצירת סיפור שני לאותו ילד - וידוא שהפנים זהות והלבוש משתנה
4. בדיקת swipe בסיפור במובייל
5. וידוא שאין אופציית Developer Mode במסך התחברות
6. בדיקת ניגודיות וקריאות טקסט
