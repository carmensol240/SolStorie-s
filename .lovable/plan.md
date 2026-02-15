

# עדכון מערכתי ל-SolStorie's™ -- פרופיל, מיתוג ושיפורים

## סקירה
בקשה זו כוללת מספר חלקים. חלקם **כבר מומשו** בשיחות קודמות (PDF footer, PWA banner, הסרת Read Aloud מה-StoryViewer). התוכנית מתמקדת בשינויים שטרם בוצעו.

---

## מה כבר מומש (לא נדרש שינוי)
- **PDF Footer**: כבר מעודכן ל-`"SolStorie's™ | כל הזכויות שמורות"` (use-pdf-export.ts)
- **PWA Install Banner**: כבר גלובלי ב-App.tsx, מופיע בכל מסך עד התקנה
- **Read Aloud**: כבר הוסר מה-StoryViewer (שורה 1012: "Read Aloud removed per brand requirements")
- **Age-Appropriate Logic**: כבר קיים במנוע יצירת הסיפורים
- **Payments**: כבר תומך בכרטיס אשראי ללא PayPal (מצוין בטקסט ב-About, GuestLanding, PrivacyPolicy)
- **Educator Access**: חבילת מחנכים כבר מוגבלת ל-`userRole === 'educator'` ב-Upgrade.tsx

---

## שינויים נדרשים

### 1. פרופיל -- שדרוג מקיף (`src/pages/Profile.tsx`)

**א. בחירת אווטאר מדמויות הסיפור**
- הוספת 5 דמויות לבחירה: סול, בן, מיה, ליאו, זואי (תמונות מ-`src/assets/cast-*.jpg`)
- שמירת הבחירה ב-`profiles.avatar_emoji` (נשתמש בשדה קיים לשמור מזהה דמות: `sol`, `ben`, `mia`, `leo`, `zoe`)
- הצגת הדמות שנבחרה כאווטאר ראשי (מעל השם)

**ב. ארון תגים "המסע שלי" (Badge Case)**
- 5 תגים עם אייקונים ושמות בעברית:
  - 🌱 **נבט הדמיון** -- יצירת סיפור ראשון (storyCount >= 1)
  - ⭐ **חוקר כוכבים** -- סיפורי הרפתקה (theme === 'adventure')
  - 💛 **לב זהב** -- סיפורים רגשיים (theme === 'emotional')
  - 📖 **קוסם מילים** -- 5+ סיפורים (storyCount >= 5)
  - 🤝 **החבר/ה של סול** -- 10+ סיפורים (storyCount >= 10)
- תגים שלא הושגו מוצגים באפור (נעולים)
- שאילתת נתונים מטבלת `stories` לבדיקת תנאים

**ג. מחברת ההורה -- שדרוג ויזואלי**
- שמירת העיצוב הנוכחי (כבר נראה כמחברת עם שורות וגוון קרם) עם שיפורים:
  - הוספת אימוג'י עט בפינה
  - אנימציית "שמירה מוצלחת" עדינה
  - הרחבת שורות הטקסט

**ד. קרוסלת 3 סיפורים אהובים**
- שליפת 3 הסיפורים עם הכי הרבה קריאות מ-`user_story_stats` (עם JOIN ל-`stories` לקבלת `cover_url`)
- תצוגה אופקית עם כריכות מעוצבות
- לחיצה מנווטת לסיפור

**ה. Footer ממותג**
- הוספת `"SolStorie's™"` בתחתית העמוד

### 2. מיתוג -- הוספת TM לכל הופעה של SolStories

**קבצים לעדכון (החלפת `SolStories` ב-`SolStorie's™` או `SolStorie's`):**

| קובץ | שינוי |
|-------|-------|
| `src/components/shared/GlobalFooter.tsx` | `SolStories` -> `SolStorie's™` |
| `src/pages/About.tsx` | כל הופעה של `SolStories` -> `SolStorie's™` (6 מקומות) |
| `src/pages/PrivacyPolicy.tsx` | `SolStories` -> `SolStorie's™` (3 מקומות) |
| `src/pages/Auth.tsx` | `SolStories` -> `SolStorie's™` (3 מקומות) |
| `src/components/shared/AboutSoulStoryContent.tsx` | `SolStories` -> `SolStorie's™` (2 מקומות) |
| `src/components/home/GuestLanding.tsx` | `SolStories` -> `SolStorie's™` (לוגו + טקסט) |
| `src/pages/Profile.tsx` | `SolStories` -> `SolStorie's™` בכפתור ארגז הכלים |

### 3. הצהרת אי-אחריות (Disclaimer)

**About.tsx** -- הוספת הצהרה לפני ה-IP Statement:
```
השימוש באפליקציה הינו כלי עזר טכנולוגי בלבד ואינו מהווה
תחליף לייעוץ מקצועי, חינוכי או רפואי.
```

**Welcome.tsx** -- הוספת שורת disclaimer קטנה מתחת לכפתור:
```
כלי עזר טכנולוגי בלבד · אינו תחליף לייעוץ מקצועי
```

### 4. מדיניות פרטיות -- סעיף קניין רוחני והגבלת אחריות

**PrivacyPolicy.tsx** -- הוספת 2 סעיפים חדשים לפני כפתור "חזרה":

**א. קניין רוחני:**
```
כל התכנים, הדמויות (סול וחבריה), האיורים והטקסטים באפליקציה הם
קניין רוחני מוגן ובלעדי של SolStorie's™. אין לעשות שימוש מסחרי
בנכסים ללא אישור בכתב.
```

**ב. הגבלת אחריות מקצועית:**
```
השימוש באפליקציה הינו כלי עזר טכנולוגי בלבד ואינו מהווה תחליף
לייעוץ מקצועי, חינוכי או רפואי. התוכן שנוצר באמצעות המערכת
אינו מהווה המלצה טיפולית או חינוכית.
```

---

## סיכום קבצים

| קובץ | סוג שינוי |
|-------|-----------|
| `src/pages/Profile.tsx` | שכתוב מקיף -- אווטאר, תגים, קרוסלה, footer |
| `src/components/shared/GlobalFooter.tsx` | עדכון שם מותג ל-SolStorie's™ |
| `src/pages/About.tsx` | TM + disclaimer |
| `src/pages/Welcome.tsx` | disclaimer |
| `src/pages/PrivacyPolicy.tsx` | TM + IP clause + disclaimer |
| `src/pages/Auth.tsx` | TM |
| `src/components/shared/AboutSoulStoryContent.tsx` | TM |
| `src/components/home/GuestLanding.tsx` | TM |

## הערות טכניות
- לא נדרשת מיגרציית DB -- נשתמש בשדה `profiles.avatar_emoji` הקיים לשמור בחירת דמות
- תגים מחושבים בצד הלקוח מנתוני `stories` שכבר נשלפים
- הקרוסלה תשתמש ב-`embla-carousel-react` שכבר מותקן בפרויקט
- כל הופעה של SolStories ב-RTL תישאר עטופה ב-`dir="ltr"` למניעת היפוך

