
# תיקון פריסת PDF לפי לוגיקת "איור אחד לשני עמודים"

## הבעיה הנוכחית
ייצוא ה-PDF מייצר עמוד נפרד לכל עמוד סיפור, כולל placeholder של 📖 לעמודים ללא איור. זה לא תואם את מבנה ה-"Spread" בו איור אחד משרת שני עמודי טקסט.

## הפתרון

### שינוי מרכזי בקובץ `src/hooks/use-pdf-export.ts`

שתי פונקציות הייצוא (portrait ו-landscape-book) ישתנו כך שיעבדו על **spreads** במקום על עמודים בודדים:

### Portrait Layout (A4 לאורך)
במקום עמוד-לכל-עמוד, כל spread ייצור **עמוד PDF אחד** עם:
- איור בחלק העליון (כ-50% מגובה העמוד)
- שני בלוקי טקסט מתחתיו, אחד מעל השני, עם מפריד עדין ביניהם
- ללא placeholder אם אין איור - הטקסט ימלא את כל העמוד
- מספור: "1-2 / 10", "3-4 / 10" וכו'

### Landscape-Book Layout (A4 לרוחב)
כל spread ייצור **עמוד PDF אחד** עם:
- צד ימין (RTL): האיור
- צד שמאל: שני הטקסטים מופרדים בקו עדין
- ללא placeholder של 📖 כשאין איור - הטקסטים יתפרסו על כל רוחב העמוד
- מספור: "1-2 / 10", "3-4 / 10" וכו'

### לוגיקת בניית ה-Spreads (זהה ל-StoryViewer)
```text
pages = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10]
                    |
                    v
spreads = [
  { illustration: p1.illustration_url, texts: [p1.text, p2.text] },
  { illustration: p3.illustration_url, texts: [p3.text, p4.text] },
  { illustration: p5.illustration_url, texts: [p5.text, p6.text] },
  ...
]
```

### הסרת Placeholders
- כל התנאי שמציג את ה-`📖` ב-landscape-book יוסר לחלוטין
- כשאין איור, אזור הטקסט מתרחב לכל השטח הזמין

---

## סיכום

| קובץ | שינוי |
|-------|-------|
| `src/hooks/use-pdf-export.ts` | שכתוב `exportPortrait` ו-`exportLandscapeBook` לעבוד על spreads, הסרת placeholders, מספור זוגות |
