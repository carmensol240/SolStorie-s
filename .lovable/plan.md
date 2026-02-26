

## תוכנית: אפשור זום (הגדלת מסך) בניידים

### הבעיה
בשורה 5 של `index.html`, ה-viewport מוגדר עם `maximum-scale=1.0, user-scalable=no` — מה שחוסם לחלוטין את האפשרות לעשות זום (pinch-to-zoom) במכשירים ניידים.

### הפתרון
שינוי שורה אחת ב-`index.html` — הסרת ההגבלות על הזום:

```html
<!-- לפני -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

<!-- אחרי -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
```

- `maximum-scale=5.0` — מאפשר הגדלה עד פי 5
- `user-scalable=yes` — מאפשר למשתמש לעשות זום עם שתי אצבעות

### קובץ לעדכון
- `index.html` (שורה 5 בלבד)

