
# תוכנית: Phase 2 - Core Logic, UI Refinement & Profile Persistence

## ✅ סיכום שינויים שבוצעו

| נושא | סטטוס | עדיפות |
|------|--------|---------|
| קרדיט יחיד למשתמש חדש | ✅ הושלם | 🔴 גבוהה |
| Referral Logic - הפניה רק לאחר הרשמה מלאה | ✅ קיים | - |
| שמירת פרופיל ילד (persistence) | ✅ קיים | 🟡 בינונית |
| עקביות אווטאר לסיפורים עתידיים | ✅ הושלם | 🔴 גבוהה |
| לבוש דינמי לפי נושא | ✅ הושלם | 🟡 בינונית |
| מסך Hero - רקע מלא + כפתור שקוף נמוך | ✅ מעודכן | - |
| Swipe navigation במובייל | ✅ הושלם | שיפור |
| עקביות שפה עברית | ✅ הושלם | 🟡 בינונית |
| הסרת Developer Mode מהתחברות | ✅ הושלם | 🔴 גבוהה |
| WCAG Accessibility | ✅ הושלם | 🟡 בינונית |

---

## שינויים שבוצעו

### 1. קרדיט יחיד למשתמש חדש ✅
- עודכנה פונקציית `handle_new_user` להגדרת `story_credits = 1` באופן מפורש
- הוגדר `DEFAULT 1` על עמודת `story_credits` בטבלת `profiles`

### 2. שמירת אווטאר (Persistence Layer) ✅
- נוספה עמודת `avatar_description` לטבלת `children`
- Edge Function `generate-illustrations` בודקת אווטאר קיים לפני יצירת חדש
- תיאור הדמות (JSON) נשמר לשימוש חוזר בסיפורים עתידיים
- מאפיינים פיזיים (פנים, שיער, עיניים) נשמרים קבועים

### 3. לבוש דינמי לפי נושא ✅
- נוסף מיפוי `THEME_OUTFITS` ב-`generate-illustrations`:
  - `space-adventure` → חליפת חלל כסופה
  - `bedtime-story` → פיג'מה עם כוכבים
  - `magic-kingdom` → שמלת/גלימת נסיך/נסיכה
  - `body-hero-bath` → חלוק רחצה
  - ועוד...
- הלבוש משתנה לפי הנושא בעוד הפנים נשארות זהות

### 4. הסרת Developer Mode מהתחברות ✅
- הוסר import של `enableDevMode` מ-`Auth.tsx`
- הוסרו שני כפתורי Dev Mode (בטופס consent ובטופס login/signup)
- Dev mode עדיין זמין רק דרך URL עם `?dev=true`

### 5. Swipe Navigation משופר ✅
- Hook `use-swipe.ts` מחזיר עכשיו `swipeOffset` לאנימציה חזותית
- `StoryViewer.tsx` מיישם transform עם `translateX` לפידבק חזותי
- מעבר חלק בסיום הswipe עם `transition: 0.3s ease-out`

### 6. WCAG Accessibility ✅
- `SignedImage` מוסיפה `aria-label` ו-`role="img"`
- Alt text דינמי לאיורים: `איור לעמוד X: [טקסט מקוצר]`
- Alt text לעטיפה: `עטיפת הסיפור: [שם] ב[נושא]`

---

## תזכורת: פיצ'רים קיימים שעובדים

- ✅ **Referral System**: הקוד ב-`Auth.tsx` כבר מעבד הפניות רק לאחר הרשמה מלאה
- ✅ **Child Profile Saving**: `ChildInfoStep.tsx` ו-`ChildProfiles.tsx` שומרים פרופילים
- ✅ **Gender Swap**: פונקציה `swap-gender` עובדת ללא עלות קרדיטים
- ✅ **Hebrew Topic Map**: `TOPIC_HEBREW_MAP` קיים ומשמש לשמירת נושאים בעברית

---

## בדיקות מומלצות

1. ✅ וידוא שאין אופציית Developer Mode במסך התחברות
2. ⏳ רישום משתמש חדש ובדיקה שמקבל בדיוק קרדיט 1
3. ⏳ יצירת סיפור ראשון ושמירת האווטאר
4. ⏳ יצירת סיפור שני לאותו ילד - וידוא שהפנים זהות והלבוש משתנה
5. ⏳ בדיקת swipe בסיפור במובייל
