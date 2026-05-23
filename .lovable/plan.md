## תיקון כיוון תמונות בסיפור

### הבעיה
תמונות שנוצרות ב-fal.ai מגיעות לפעמים עם EXIF orientation metadata שגורם להן להופיע מסובבות 90° בדפדפן.

### הפתרון (CSS-only, מינימלי)
הוספת `image-orientation: from-image` גלובלית לכל ה-`<img>` בפרויקט. זה אוכף על הדפדפן לכבד את ה-EXIF orientation ולהציג את התמונה זקופה.

### קובץ שישתנה
**`src/index.css`** — הוספת כלל גלובלי:
```css
img {
  image-orientation: from-image;
}
```

זה יחול אוטומטית על:
- `SignedImage` (איורי הסיפור)
- תמונות בכרטיסי ספרייה
- תמונת הדמויות במסך הסיום
- כל שאר התמונות בפרויקט

### למה לא לתקן בצד השרת
תיקון server-side (sharp/ImageMagick ב-edge function) ידרוש שינוי pipeline של generate-illustrations + retry-illustration + תלות חדשה. הפתרון הזה רק ל-presentation layer, ללא שינוי לוגיקה או backend — כפי שביקשת.

### לא ישתנה
- אין שינוי ב-edge functions
- אין שינוי ב-storage
- אין שינוי בלוגיקה של הסיפור
