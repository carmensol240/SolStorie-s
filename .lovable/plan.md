## שינוי לוגו במסך הסיום

**קובץ:** `src/pages/StoryViewer.tsx` בלבד, שורות 1418–1432.

**מצב נוכחי:** הקישור מכיל אייקון 🔗 + לוגו צבעוני "SolStorie's™" + טקסט לבן נפרד עם קו תחתון "soulstory.co.il".

**שינוי:** להסיר את ה-`<span>` הלבן הנפרד עם הקו התחתון, ולשלב הכל בשורה אחת בסגנון הלוגו הצבעוני:

```tsx
<a href="https://soulstory.co.il" target="_blank" rel="noopener noreferrer"
   className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
   aria-label="SolStorie's - פתח באתר soulstory.co.il">
  <Link2 className="w-5 h-5 text-white drop-shadow" />
  <span className="text-xl md:text-2xl font-black logo-3d-bubble">
    <span className="logo-rainbow">SolStorie's™ | soulstory.co.il</span>
  </span>
</a>
```

**לא משתנה:** שום אלמנט אחר במסך, שום קובץ אחר, שום לוגיקה.