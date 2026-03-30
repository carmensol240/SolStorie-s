

## Plan: Merge Coloring + Learning Section in About Page

### Change — `src/pages/About.tsx` lines 183-188

Replace the coloring section with the combined content:

```tsx
<div className="flex flex-col items-center gap-1.5">
  <span className="text-3xl">🎨📚</span>
  <p className="text-base font-normal text-white leading-[1.6] text-right px-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
    <strong className="text-orange-200 font-black">למידה, יצירה וצביעה</strong> — כל סיפור מגיע עם דף צביעה מותאם אישית להדפסה בבית — ובחבילת הלמידה, הילד פוגש אותיות ומספרים בתוך הרפתקה קסומה משלו.
  </p>
</div>
```

No other sections or files touched.

