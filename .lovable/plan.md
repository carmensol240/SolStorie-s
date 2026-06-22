## מה קורה היום ב-FLOW (לפני שינוי)

לחיצה על אייקון 🎨 דפי הצביעה ב-`BookHeader` ב-`StoryViewer.tsx`:

1. אם המשתמש לא מחובר או חסרים קרדיטים של צביעה (ולא קיבל את הצביעה הראשונה החינמית) → נפתח `ColoringPurchaseModal` (אפסייל לרכישה).
2. אחרת נפתח דיאלוג בחירת איור (`coloringPickerOpen`).
3. אחרי בחירת איור עוברים למסך `choose-action` עם **שני כפתורים**:
   - **כפתור 1 (סגול-אינדיגו):** `🖨️ הדפיסו דף צביעה` — מייצר PNG, חותך שוליים לבנים ומוריד קובץ.
   - **כפתור 2 (outline סגול):** **התווית ריקה** (`'​'` — zero-width space, שורה 2501 ב-`StoryViewer.tsx`). הלוגיקה שלו תקינה לחלוטין — הוא מייצר את אותו דף צביעה ופותח אותו ב-`OnlineColoringCanvas` (קנבס צביעה אונליין מלא — מברשות, מילוי, מחק, סיבוב landscape, הורדה).

**כלומר** — אפשרות הצביעה האונליין כבר ממומשת בקוד ועובדת, רק שהכפתור עצמו ללא טקסט ולכן נראה למשתמש שיש רק "הדפסה". זו טעות UI נקודתית, לא בעיה ב-flow או בהרשאות.

שני הכפתורים משתמשים באותו endpoint `generate-coloring-page` ובאותה לוגיקת קרדיטים — מי שיש לו זכאות יקבל את שני המסלולים, ללא תלות בסוג החבילה.

## איזו חבילה מקבלת דפי צביעה? (לפי `supabase/functions/_shared/purchase-credits.ts`)

| חבילה | דפי צביעה נוספים |
|---|---|
| `basic` (2 סיפורים, 79₪) | 2 |
| `popular` (סיפור + PDF, 109.90₪) | **1 (יוחלף לדינמי — דף לכל ציור)** |
| `premium` (10 סיפורים, 279₪) | 10 |
| `educator_basic` (2) | 2 |
| `educator_popular` (6, 199₪) | 6 |
| `educator_premium` (10, 249₪) | 10 |
| `single_story_digital` (39.90₪) | 1 |
| `single_story_full` (109.90₪) | 1 |
| `coloring_kit` (24.90₪) | 5 |
| `coloring_single` (9.90₪) | 1 |
| `coloring_bundle` / `coloring_story` (24.90₪) | דינמי — דף לכל איור |
| `single_story` בסיס | 0 (מסתמך על דף ראשון חינם) |
| `pdf` (59.90₪) | 0 |
| `edit_kit`, `toolkit_yearly` | 0 |

בנוסף — לפי `mem://features/billing/coloring-credits-logic`: **הדף הראשון של כל סיפור חינם** לכל משתמש; הדפים הבאים שורפים `coloring_credit` אחד.

## השינויים המוצעים

### 1. תיקון אייקון דפי הצביעה — חשיפת כפתור "צביעה אונליין"
קובץ: `src/pages/StoryViewer.tsx` שורה 2501.
החלפת התווית הריקה של הכפתור השני בטקסט ברור:
- כפתור 1: `🖨️ הורידו להדפסה`
- כפתור 2: `🎨 צבעו אונליין באפליקציה`

תוצאה: המשתמש רואה שתי אפשרויות שוות מעמד. כל מי שיש לו זכאות (חינמי-ראשון או קרדיט בתשלום, לפי הטבלה) יכול לבחור בכל אחת מהשתיים — באותה עלות בקרדיטים.

### 2. חבילת "פופולרי" (109.90₪) — דף צביעה לכל ציור בסיפור
קובץ: `supabase/functions/_shared/purchase-credits.ts`.
שינוי ההגדרה של `popular`:
```ts
// לפני
popular: { stories: 1, freeEdits: 1, coloringPages: 1, pdfDownload: true },
// אחרי
popular: { stories: 1, freeEdits: 1, coloringPages: 0, pdfDownload: true, dynamicColoringFromStory: true },
```

`dynamicColoringFromStory` כבר נתמך בקוד (שורות 60-80 ב-`purchase-credits.ts`) — הוא סופר את כל האיורים של הסיפור שמועבר ב-`storyId` ומזכה את המשתמש בקרדיט צביעה לכל איור (מינימום 1, ברירת מחדל 5 אם אין `storyId`). זה אותו מנגנון של `coloring_story` / `coloring_bundle`.

**הערה חשובה:** כדי שזה יעבוד נכון, רכישת `popular` חייבת לכלול את ה-`storyId` של הסיפור הספציפי שנרכש (cField3 ב-Grow). הקוד הקיים כבר שולח את זה כי `popular` נמצאת ב-`SINGLE_STORY_PACKAGES` (שורה 200 ב-`purchase-credits.ts`). אם רכישת popular בלי `storyId` תקרה — המשתמש יקבל 5 קרדיטי צביעה כברירת מחדל.

## מה לא משתנה
- מחירים, כמות סיפורים, עריכות, או זכאות PDF של חבילת `popular`.
- לוגיקת קרדיטי הצביעה, ה-Edge Function `generate-coloring-page`, ה-cache, ו-`OnlineColoringCanvas`.
- `ColoringPurchaseModal` ושאר החבילות.
- מסך הרכישה והפופ-אפים (הטקסט של "סיפור + קובץ הדפסה" לא משתנה, רק ההטבה האחורית גדלה).