

# הוספת אייקון ספר ליד "אורך" ודגלים ליד השפות

## מצב נוכחי
- **אורך**: הכותרת מופיעה ללא אייקון
- **שפה**: הדגלים כבר קיימים (🇮🇱 ליד עברית, 🇺🇸 ליד EN) - אין צורך בשינוי כאן

## שינוי נדרש

### קובץ: `src/components/wizard/ChildInfoStep.tsx`

**שורה 567** - הוספת אייקון ספר (BookOpen מ-lucide-react) ליד המילה "אורך":
- שינוי מ: `<Label className="text-[10px] font-medium text-center block">אורך</Label>`
- ל: `<Label className="text-[10px] font-medium text-center block flex items-center justify-center gap-1"><BookOpen className="w-3 h-3" />אורך</Label>`

**שורה 2** - הוספת `BookOpen` לרשימת ה-imports מ-lucide-react

## סיכום
- שינוי קטן של שתי שורות בלבד
- הדגלים כבר קיימים בכפתורי השפה, אז לא נדרש שינוי שם
