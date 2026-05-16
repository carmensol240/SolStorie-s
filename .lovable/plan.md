## מטרה

במסך "ספרו לנו על הילד":
1. להסיר לחלוטין את עמודת "אורך" (קצר 4-5 / ארוך 6-8 / ארוך במיוחד 10-12).
2. להחליף את כפתורי טווח הגיל (0-2 / 3-6 / 7-8) בשדה קלט מספרי קטן: "גיל הילד/ה: [ ] שנים" (1-12).
3. אורך הסיפור ייקבע אוטומטית בבקאנד לפי הגיל המדויק שהוזן.

## שינויים

### 1. `src/pages/CreateStory.tsx`
- להוסיף ל-`StoryFormData` שדה `childAge: number` (כדי להעביר את הגיל המדויק לבקאנד).
- ב-`INITIAL_DATA`: `childAge: 4` (ברירת מחדל סבירה). `storyLength` נשאר במבנה לצורך תאימות לאחור אבל לא ייערך יותר ב-UI.

### 2. `src/components/wizard/ChildInfoStep.tsx`
- להסיר את `AGE_BUTTONS` (לא בשימוש יותר), `selectedAgeButton` state, `handleAgeButtonSelect`.
- להחליף את ה-grid הקיים `grid-cols-3` (גיל / אורך / שפה) ב-`grid-cols-2` (גיל / שפה). בלוק "Story Length" כולו נמחק.
- בעמודת הגיל: `<Label>גיל הילד/ה</Label>` + `<Input type="number" min={1} max={12} />` קטן, ולידו טקסט "שנים".
- ב-`onChange` של הקלט: לעדכן `childAge` (number) וגם להמיר אוטומטית ל-`ageRange` באמצעות `ageToRange()` הקיים (נשאר כי הקוד הפנימי משתמש בו לטעינת/שמירת פרופילים).
- בטעינת פרופיל קיים (`loadChildProfile`, `useEffect` הראשוני, ה-localStorage path): להעביר גם `childAge: child.age` ל-`updateFormData`, ולא לעדכן יותר `selectedAgeButton`.
- ב-reset לפרופיל חדש (שורות 490, 554): להסיר `storyLength` ולהוסיף `childAge: 4`.
- חישוב `selectedAge` ב-`handleSaveChildProfile` יישאר על בסיס `formData.childAge` (במקום `rangeToAge(formData.ageRange)`).

### 3. `src/components/wizard/GeneratingStep.tsx` ו-`src/components/wizard/AuthStep.tsx`
- בקריאות ה-invoke ל-`generate-story`: להוסיף `childAge: formData.childAge` לתוך ה-body. השדה `storyLength` יישאר מועבר (לתאימות) אבל אינו משפיע יותר.

### 4. `supabase/functions/generate-story/index.ts`
- ב-destructuring של `reqBody` להוסיף `childAge` (number, אופציונלי – fallback ל-`rangeToAge(ageRange)` שיוגדר באותו קובץ או לפי מיפוי פשוט).
- לשכתב את `getAgeLengthInstruction` כך שיקבל `(exactAge: number)` בלבד, ויחזיר `{ pages, instruction }` יחיד לכל גיל (ללא בחירת אורך). מיפוי מוצע:

```text
1-2  → 6 עמודים, ~130 מילים, משפטים 3-5 מילים, חוויות חושיות
3    → 7 עמודים, ~300 מילים, 2 משפטים בעמוד
4    → 7 עמודים, ~400 מילים, 2-3 משפטים בעמוד
5    → 8 עמודים, ~450 מילים, 3 משפטים בעמוד
6    → 8 עמודים, ~500 מילים, 3 משפטים בעמוד
7    → 10 עמודים, ~550 מילים, 3-4 משפטים בעמוד
8    → 10 עמודים, ~600 מילים, 4 משפטים בעמוד
9    → 10 עמודים, ~650 מילים, 4-5 משפטים בעמוד
10   → 12 עמודים, ~750 מילים, 5 משפטים בעמוד
11-12 → 12 עמודים, ~850 מילים, 5-6 משפטים בעמוד, אוצר מילים מורכב
```

- הקריאה בשורה ~1147 הופכת ל-`getAgeLengthInstruction(childAge ?? rangeToAge(ageRange))`. שאר השימושים ב-`ageLengthConfig.pages` / `.instruction` (שורות 1356, 1455 וכו') לא משתנים.
- אזכורי `storyLength` בפרומפט/לוגים יישארו לצורך תאימות אבל לא ישפיעו על הפלט.

## מחוץ לסקופ

- אין שינוי ב-DB, RLS, שמירת פרופילים (ה-`age` כבר נשמר כמספר), קומפוננטות אחרות, פרומפט הגיל המספרי בסיפור (כבר תוקן), קרדיטים, איורים או UI אחר.
- שדה השפה, המגדר, התמונה, האישיות והפרטים הקבועים – ללא שינוי.
