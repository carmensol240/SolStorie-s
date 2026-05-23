# תיקון באג בידוד פרופילי ילדים

## הבעיה

במסך "ספרו לנו על הילד" כל פרופיל מזוהה לפי **שם** (`formData.childName`) ולא לפי **id**, וקיים `useEffect` שטוען אוטומטית את הילד הראשון. שני אלה יחד גורמים למצבים שהמשתמש תיאר:

1. **בחירה בסול → קופץ לעומר**
   ה־`useEffect` בשורות ~121-185 ב־`src/components/wizard/ChildInfoStep.tsx` תלוי ב־`[user]` ובכל ריצה שלו טוען בכוח את `data[0]` ל־`formData`. כשמתרחש רענון auth (token refresh, חזרה מטאב), אובייקט ה־`user` משתנה — ה־effect רץ שוב — והבחירה הנוכחית נדרסת לטובת הילד הראשון ברשימה.

2. **החלפת תמונה → חוזרת לקודמת**
   אחרי שמעלים תמונה (`updateFormData({ childPhoto })`) אבל לפני שלוחצים "שמור", אם ה־effect הנ"ל רץ שוב הוא טוען מחדש את `photo_url` מה־DB/localStorage ודורס את התמונה החדשה.
   בנוסף, `generateAvatarInline` ו־`handleSaveChildProfile` (שורות 260, 282, 349, 419-420, 450) מאתרים את הפרופיל לעדכון ע"י `savedChildren.find(c => c.name === formData.childName)`. אם המשתמש החליף שם בשדה, או אם יש שני פרופילים עם דמיון, העדכון נכתב לפרופיל הלא נכון — ואז התמונה "מתערבבת" בין פרופילים.

3. **זיהוי פרופיל פעיל בכפתורים** (שורה 519, 553) משתמש גם הוא ב־`formData.childName === child.name` — שביר לאותן סיבות.

## הקבצים שישתנו

רק קובץ אחד: `src/components/wizard/ChildInfoStep.tsx`.

## התיקון

1. **state חדש**: `selectedChildId: string | null` שמחזיק את ה־id של הפרופיל הפעיל (מקור אמת יחיד).

2. **`loadChildProfile(child)`**: יקבע `setSelectedChildId(child.id)` בנוסף ל־`updateFormData`.

3. **כפתור "פרופיל חדש"**: יקבע `setSelectedChildId(null)` + `setIsCreatingNew(true)`.

4. **`useEffect` של טעינת ילדים (שורות 121-185)**:
   - יישאר תלוי ב־`[user?.id]` בלבד (במקום ב־`user` כאובייקט) כדי לא לרוץ על כל רענון טוקן.
   - יתווסף `hasLoadedRef = useRef(false)` כדי שטעינה ראשונית של ה־first child תקרה **פעם אחת בלבד** לכל user. אם כבר נטענו ילדים — לא דורסים בחירה קיימת.

5. **`generateAvatarInline`, `handleRegenerationCountChange`, `handleSaveChildProfile`, `handleDeleteChildProfile`**: יחפשו את הילד הנוכחי לפי `selectedChildId` במקום לפי `formData.childName`. שמירה של פרופיל קיים תזוהה ע"י id; שמירת פרופיל חדש (כש־`selectedChildId === null` או `isCreatingNew === true`) תיצור רשומה חדשה.

6. **תצוגת הכפתורים** (שורות 519, 553): השוואה לפי `selectedChildId === child.id` במקום לפי שם.

7. **אחרי insert מוצלח של פרופיל חדש**: נקרא `setSelectedChildId(data.id)` כדי שעריכות עוקבות יעדכנו את הרשומה הנכונה.

## סיכון

- שינוי ממוקד בקובץ אחד, ללא נגיעה ב־DB, RLS, edge functions או שאר ה־wizard.
- פרופילים קיימים נטענים כרגיל מה־DB/localStorage — רק מנגנון הבחירה הפנימי משתנה.
- אין שינוי בשמות שדות או בפורמט localStorage (`savedChildren` נשמר זהה).

## מה לא נכלל

לא משנים שום קובץ אחר, לא את אופן יצירת הכריכה/האיורים, לא את ה־DB ולא לוגיקה עסקית אחרת — רק את בידוד מצב הבחירה במסך הזה.
