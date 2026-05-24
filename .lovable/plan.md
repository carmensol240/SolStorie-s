## מטרה
להחזיר את הקנבס לחישוב לפי יחס תמונה (contain) כדי שהאיור לא ייחתך, אבל לשמור על מילוי מקסימלי של אזור הציור.

## קובץ יחיד
`src/components/story/OnlineColoringCanvas.tsx`

## שינוי
בתוך `resizeCanvases`, להחליף את החישוב הנוכחי (`w = canvasMaxW; h = canvasMaxH`) בחישוב fit-contain לפי יחס התמונה המקוצצת (`bounds.sw / bounds.sh`):

```ts
const imgRatio = bounds.sw / bounds.sh;
const areaRatio = canvasMaxW / canvasMaxH;
let w: number, h: number;
if (imgRatio > areaRatio) {
  // התמונה רחבה יחסית — מלא לפי רוחב
  w = canvasMaxW;
  h = Math.round(canvasMaxW / imgRatio);
} else {
  // התמונה גבוהה יחסית — מלא לפי גובה
  h = canvasMaxH;
  w = Math.round(canvasMaxH * imgRatio);
}
```

## עדכון משלים ב-JSX
בעטיפת הקנבס הפנימית (`<div className="relative w-full h-full">`) — כיום ה-canvases משתמשים ב-`style={{ width: '100%', height: '100%' }}`, שמותח אותם מעבר ליחס שחישבנו. נסיר את ה-`width/height: 100%` מה-style של שני ה-canvases ונחזיר אותם להצגה בגודל הפיקסלי הטבעי שלהם (canvas.width/canvas.height ב-CSS pixels). את העטיפה הפנימית נחזיר ל-`flex items-center justify-center` ברמת ה-canvas area כדי שהקנבס יתמרכז באזור הציור.

שינויים מדויקים:
- בעטיפה החיצונית (`canvasAreaRef`): להחזיר `flex items-center justify-center` (תוך שמירה על `flex-1 min-h-0 w-full overflow-hidden bg-white relative`).
- בעטיפה הפנימית: להסיר `w-full h-full` ולהשאיר רק `relative` + `lineHeight: 0`.
- ב-`<canvas>` (שניהם): להסיר את `width: '100%', height: '100%'` מה-style.

## תוצאה
- הקנבס יהיה הכי גדול שאפשר באזור הציור בלי לחתוך ובלי לעוות.
- האיור יישמר ביחס המקורי שלו (אחרי trim).
- ה-`ResizeObserver` על `canvasAreaRef` ממשיך לעבוד כפי שהוא.

## מה לא נוגעים בו
- חישוב `canvasMaxW`/`canvasMaxH`, ה-refs, ה-print CSS, הצבעים, הכפתורים, מובייל, ושאר הלוגיקה.
