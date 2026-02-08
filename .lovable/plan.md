
# תוכנית מקיפה: שיפורי אפליקציה ותיקוני באגים

## סיכום הבעיות שזוהו

| בעיה | סטטוס | קובץ רלוונטי |
|------|--------|--------------|
| עדכון חבילות תמחור | נדרש | `src/config/pricing.ts`, `src/pages/Upgrade.tsx` |
| Social Proof במסך טעינה - קרוסלה עם כרטיסיות | נדרש | `src/components/wizard/GeneratingStep.tsx` |
| הסרת תיבת ה-"טיפ" | נדרש | `src/components/wizard/GeneratingStep.tsx` |
| כותרות סיפורים באנגלית | נדרש | `src/components/wizard/TopicStep.tsx` + DB logic |
| מסך Hero (Sol/Tree) - תיבת פעולה נמוכה יותר | נדרש | `src/components/home/LoggedInHome.tsx` |
| הסרת DebugMenu מהמסך הראשי | נדרש | `src/pages/Home.tsx` |
| שמירת אווטאר לסיפורים עתידיים | נדרש | `supabase/functions/generate-story/index.ts` |
| עדכון לבוש דינמי לפי נושא | נדרש | `supabase/functions/generate-story/index.ts` |
| הקטנת פוטר במסך רכישה | נדרש | `src/pages/Upgrade.tsx` |

---

## 1. עדכון חבילות התמחור

### קובץ: `src/config/pricing.ts`

**לפני:**
```typescript
{ id: "basic", stories: 5, price: 39, freeEdits: 1, ... }
{ id: "popular", stories: 10, price: 59, freeEdits: 2, ... }
{ id: "premium", stories: 20, price: 99, freeEdits: 3, ... }
```

**אחרי:**
```typescript
{ id: "basic", stories: 5, price: 49, pricePerStory: "9.8₪", freeEdits: 5, ... }
{ id: "popular", stories: 10, price: 89, pricePerStory: "8.9₪", freeEdits: 12, badge: "⭐ מומלץ", ... }
{ id: "premium", stories: 15, price: 115, pricePerStory: "7.67₪", freeEdits: 20, ... }
```

### קובץ: `src/pages/Upgrade.tsx`

עדכון תצוגת "עריכות חינם" בכרטיסי החבילות:
- הצגת מספר העריכות החינמיות בצורה בולטת: `+{freeEdits} עריכות חינם`
- הקטנת הפוטר הקבוע (מ-py-3 ל-py-2)
- הסרת הרווח הריק בין הפסקאות

---

## 2. מסך טעינה - Social Proof מקצועי

### קובץ: `src/components/wizard/GeneratingStep.tsx`

**שינויים:**

1. **הסרת תיבת "טיפ"** (שורות 344-348)
   - מחיקת הקוד של התיבה הסגולה עם הטיפ

2. **החלפת ההמלצות הפשוטות בקרוסלת כרטיסיות מקצועית:**

```typescript
const PARENT_TESTIMONIALS = [
  { 
    name: "הורה מ.", 
    quote: "הילדה שלי מאושרת! כל לילה מבקשת לקרוא את הסיפור שלה שוב ושוב.",
    rating: 5 
  },
  { 
    name: "הורה י.", 
    quote: "הילדים שלי מתים על הסיפורים. הם מרגישים כמו גיבורים אמיתיים.",
    rating: 5 
  },
  { 
    name: "הורה ר.", 
    quote: "האיורים מדהימים והסיפורים מותאמים בצורה מושלמת לגיל.",
    rating: 5 
  },
  { 
    name: "הורה א.", 
    quote: "יצרנו סיפור על הפחד מהחושך והילד שלי התגבר על הפחד תוך שבוע!",
    rating: 5 
  },
];
```

**עיצוב הכרטיסיות:**
- רקע לבן עם border-radius
- שם ההורה בולט
- ציטוט באיטליק
- 5 כוכבים זהובים מתחת לכל ציטוט
- החלפה אוטומטית כל 4 שניות עם אפקט fade

---

## 3. תיקון כותרות סיפורים באנגלית

### בעיה:
הנושאים נשמרים באנגלית במסד הנתונים (למשל `clean-room` במקום `סדר בחדר`)

### פתרון:

#### א. קובץ: `src/components/wizard/TopicStep.tsx`
העברת ה-topic label בעברית לפונקציית ה-generate במקום ה-ID

#### ב. קובץ: `supabase/functions/generate-story/index.ts`
שמירת התרגום העברי של הנושא בטבלת `stories`:

```typescript
// Map English topic IDs to Hebrew
const TOPIC_HEBREW_MAP: Record<string, string> = {
  "clean-room": "סדר בחדר",
  "space-adventure": "הרפתקה בחלל",
  "magic-kingdom": "ממלכת הקסם",
  "bedtime-story": "סיפור לפני השינה",
  "body-hero-teeth": "צחצוח שיניים",
  "body-hero-bath": "אמבטיה",
  "friendship-courage": "חברות ואומץ",
  // ... all topics
};
```

---

## 4. מסך Hero (Sol/Tree) - תיבת פעולה מעודכנת

### קובץ: `src/components/home/LoggedInHome.tsx`

**שינויים:**

1. **הורדת התיבה נמוך יותר:**
   - שינוי מ-`pb-8` ל-`pb-24` (רחוק יותר מהתחתית)
   - הוספת `mb-20` לרווח מהניווט

2. **הצרת הכפתור:**
   - שינוי מ-`w-full` ל-`max-w-xs mx-auto`

3. **אפקט זכוכית:**
   - הוספת `bg-white/30 backdrop-blur-md`
   - `border border-white/20`
   - `shadow-lg`

```typescript
<div className="pb-24 px-4">
  <button
    onClick={() => navigate("/create")}
    className="max-w-xs mx-auto flex items-center justify-center gap-4 
               bg-white/30 backdrop-blur-md border border-white/20
               rounded-2xl p-4 shadow-lg hover:bg-white/40 transition-all"
  >
    {/* ... content ... */}
  </button>
</div>
```

---

## 5. הסרת DebugMenu מהמסך הראשי

### קובץ: `src/pages/Home.tsx`

**לפני:**
```typescript
import DebugMenu from "@/components/DebugMenu";
// ...
<DebugMenu />
```

**אחרי:**
- הסרת ה-import של `DebugMenu`
- מחיקת `<DebugMenu />` מה-JSX

**הערה:** ה-DebugMenu עדיין קיים בקוד אבל לא יופיע - רק בסביבות פיתוח ספציפיות עם `?dev=true`

---

## 6. שמירת אווטאר והתאמת לבוש דינמית

### קובץ: `supabase/functions/generate-story/index.ts`

**לוגיקת האווטאר:**

1. **בדיקה אם קיים אווטאר שמור לילד:**
```typescript
// Check for existing avatar in children table
const { data: existingChild } = await supabaseAdmin
  .from('children')
  .select('avatar_url, avatar_description')
  .eq('user_id', userId)
  .eq('name', childName)
  .maybeSingle();
```

2. **שימוש חוזר באווטאר קיים:**
```typescript
if (existingChild?.avatar_url) {
  // Use existing character visual description
  characterDescription = existingChild.avatar_description;
  console.log('Using saved avatar for', childName);
} else {
  // Generate new avatar and save it
  // ...
}
```

3. **התאמת לבוש לפי נושא:**
```typescript
const THEME_OUTFITS: Record<string, string> = {
  "space-adventure": "חליפת חלל כסופה עם קסדה שקופה",
  "bedtime-story": "פיג'מה נעימה עם כוכבים",
  "magic-kingdom": "שמלת/גלימת נסיך/נסיכה מלכותית",
  "body-hero-bath": "חלוק רחצה לבן רך",
  "clean-room": "בגדים יומיומיים צבעוניים",
  // ... more themes
};

// In illustration prompt:
const outfit = THEME_OUTFITS[topic] || "בגדים יומיומיים צבעוניים";
const illustrationPrompt = `
  ${characterDescription}
  לבוש: ${outfit}
  (הפנים, השיער והעיניים חייבים להישאר זהים לתיאור המקורי)
`;
```

---

## 7. הקטנת פוטר במסך רכישה

### קובץ: `src/pages/Upgrade.tsx`

**שינויים בפוטר הקבוע (שורות 357-374):**

```typescript
// Before
<div className="fixed bottom-0 ... py-3 ...">

// After
<div className="fixed bottom-0 ... py-2 ...">
  <div className="container max-w-md mx-auto flex flex-col items-center gap-0.5">
```

- שינוי `py-3` ל-`py-2`
- שינוי `gap-1` ל-`gap-0.5`
- הקטנת כפתור "אולי מאוחר יותר" מ-`text-xs` ל-`text-[10px]`

---

## 8. עריכות חינם בולטות יותר

### קובץ: `src/pages/Upgrade.tsx`

עדכון הצגת העריכות החינמיות בכרטיסיות:

```typescript
{/* Free edits badge - MORE PROMINENT */}
<div className="bg-green-100 border border-green-300 rounded-lg px-2 py-1 mt-2">
  <span className="text-sm text-green-700 font-black">
    +{pkg.freeEdits} עריכות חינם
  </span>
</div>
```

---

## סיכום הקבצים לשינוי

| קובץ | סוג שינוי |
|------|-----------|
| `src/config/pricing.ts` | עדכון מחירים וכמויות |
| `src/pages/Upgrade.tsx` | UI - פוטר, עריכות חינם |
| `src/components/wizard/GeneratingStep.tsx` | קרוסלת המלצות, הסרת טיפ |
| `src/components/home/LoggedInHome.tsx` | תיבת פעולה שקופה ונמוכה |
| `src/pages/Home.tsx` | הסרת DebugMenu |
| `supabase/functions/generate-story/index.ts` | אווטאר persistent + לבוש דינמי + תרגום נושאים |
| `src/components/wizard/TopicStep.tsx` | העברת שם נושא בעברית |

---

## תזכורת: כפתור החלפת מגדר ✅

הפיצ'ר כבר מיושם ועובד:
- כפתור "התבלבלתם במגדר?" בסוף הסיפור
- Edge Function `swap-gender` שמחליפה פעלים וכינויים
- ללא עלות קרדיטים

---

## בדיקות נדרשות לאחר היישום

1. יצירת סיפור חדש ובדיקת שמירת האווטאר
2. יצירת סיפור שני לאותו ילד - וידוא שהאווטאר זהה
3. בדיקת מסך הטעינה עם הקרוסלה החדשה
4. בדיקת מסך התמחור עם המחירים החדשים
5. וידוא שה-DebugMenu לא מופיע בדף הבית
6. בדיקת מסך Hero שהכפתור שקוף ונמוך יותר
7. בדיקה שכותרות הסיפורים בספרייה מופיעות בעברית
