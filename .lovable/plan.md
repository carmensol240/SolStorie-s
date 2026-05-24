## תיקון: הגבלת גודל קנבס לרזולוציה הטבעית של התמונה

**קובץ:** `src/components/story/OnlineColoringCanvas.tsx`

**שינוי יחיד:**

בפונקציה `resizeCanvases`, לאחר חישוב `w` ו-`h` (fit-contain), להוסיף שתי שורות שמגבילות את הגודל ל-`img.naturalWidth` / `img.naturalHeight`:

```ts
w = Math.min(w, img.naturalWidth);
h = Math.min(h, img.naturalHeight);
```

כך הקנבס לא יעלה על הרזולוציה האמיתית של התמונה ולא יטשטש.

**לא נוגעים בשום דבר אחר.**