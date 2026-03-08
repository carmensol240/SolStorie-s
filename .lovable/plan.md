

## תכנון: עיצוב מחדש של כרטיסיות הספרים כספר פיזי עבה

### מבנה נדרש
המשתמש רוצה עיצוב ספציפי עם מידות קבועות:
- **כריכה**: 155px רוחב × 230px גובה, border-radius: 2px 6px 6px 2px
- **דפים**: 36px רוחב × 224px גובה, margin-top: 3px, border-radius: 4px 0 0 4px
- **מבנה**: flex row — כריכה מימין, דפים משמאל

### שינויים ב-`StoryBookCard`

1. **הסרת aspect-ratio** — מעבר למידות קבועות (155+36=191px רוחב, 230px גובה)

2. **מבנה Flex חדש**:
   - Container עם `flex-direction: row`
   - כריכה בצד ימין (155×230px)
   - דפים בצד שמאל (36×224px עם margin-top: 3px)

3. **CSS לדפים** (לפי הספציפיקציה):
```css
background: repeating-linear-gradient(
  to left,
  #faf3e0 0px, #faf3e0 3px,
  #d4a056 3px, #d4a056 4.5px,
  #f5e8c8 4.5px, #f5e8c8 7.5px,
  #b07830 7.5px, #b07830 9px,
  #f0deb0 9px, #f0deb0 12px,
  #c88c40 12px, #c88c40 13.5px
);
box-shadow: inset 4px 0 8px rgba(255,255,255,0.4), 
            inset -2px 0 6px rgba(0,0,0,0.25);
```

4. **אפקט Hover**:
```css
transform: translateY(-10px) rotate(1deg);
filter: drop-shadow(6px 18px 24px rgba(0,0,0,0.35));
```

5. **Border-radius**:
   - כריכה: `2px 6px 6px 2px`
   - דפים: `4px 0 0 4px`

### פרטים טכניים

- שימוש ב-`dir="ltr"` כדי להבטיח שהדפים יהיו משמאל והכריכה מימין
- מעבר מ-`onMouseEnter/Leave` לטיפול ב-hover עם CSS transition
- שמירה על כל הפונקציונליות הקיימת (תפריט, badges, לחיצה)

