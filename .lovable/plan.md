

## Plan: Add Design Changes Note to Terms of Service Page

### Summary
Add a new section titled "עדכונים ושינויי עיצוב" to the Terms of Service page, inserted as section 6 (before the existing contact section, which becomes section 7).

### Changes — `src/pages/TermsOfService.tsx` only

Insert a new `<section>` block after section 5 (מדיניות ביטולים) and before the current section 6 (יצירת קשר). Renumber the contact section from 6 to 7.

New section content:
```tsx
<section>
  <h2 className="text-lg font-bold text-foreground mb-2">6. עדכונים ושינויי עיצוב</h2>
  <p className="text-muted-foreground leading-relaxed">
    האפליקציה מתעדכנת באופן שוטף ומוסיפה תכנים ופיצ'רים חדשים. כתוצאה מכך, ייתכן שסגנון העיצוב, הממשק והתצוגה ישתנו מעת לעת ולא יהיו זהים למה שהוצג בפרסומים, צילומי מסך או חומרי שיווק. שינויים אלו נועדו לשפר את חוויית המשתמש ואינם מהווים עילה לתלונה או דרישה כלשהי.
  </p>
</section>
```

The existing "יצירת קשר" section number changes from `6.` to `7.`.

### No other files modified.

