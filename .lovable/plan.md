# שיפורי אפליקציה - סטטוס יישום

## ✅ הושלם

| משימה | קובץ |
|-------|------|
| עדכון חבילות תמחור (5/49₪, 10/89₪, 15/115₪) | `src/config/pricing.ts` |
| הצגת עריכות חינם בולטות (+5, +12, +20) | `src/pages/Upgrade.tsx` |
| הקטנת פוטר במסך רכישה | `src/pages/Upgrade.tsx` |
| קרוסלת המלצות הורים מקצועית עם כוכבים | `src/components/wizard/GeneratingStep.tsx` |
| הסרת תיבת "טיפ" | `src/components/wizard/GeneratingStep.tsx` |
| מסך Hero עם אפקט זכוכית ומיקום נמוך | `src/components/home/LoggedInHome.tsx` |
| הסרת DebugMenu מהמסך הראשי | `src/pages/Home.tsx` |
| תרגום נושאים לעברית בספרייה | `supabase/functions/generate-story/index.ts` |
| כפתור החלפת מגדר חינמי | `supabase/functions/swap-gender/index.ts` |

## 📋 להמשך

- שמירת אווטאר persistent (לבדיקה בסיפור הבא)
- התאמת לבוש דינמי לפי נושא

## 🧪 בדיקות נדרשות

1. בדוק מסך התמחור עם החבילות החדשות
2. בדוק מסך הטעינה עם קרוסלת ההמלצות
3. בדוק שה-DebugMenu לא מופיע בדף הבית
4. בדוק שהכפתור במסך Hero שקוף ונמוך
5. צור סיפור חדש ובדוק שהנושא בעברית בספרייה
