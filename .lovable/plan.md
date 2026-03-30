

## Plan: Add Grammar Agreement Rule to SYSTEM_PROMPT

### Change — `supabase/functions/generate-story/index.ts` line 54

After the existing line 54 (`4. **ללא ניקוד:**...`), insert a new numbered rule:

```
5. **דקדוק מוחלט:** כל פועל חייב להתאים במין ובמספר לנושא המשפט. לדוגמה: 'היא מחפשת' ולא 'היא מחפשה'. בדוק כל פועל לפני הכתיבה.
```

The subsequent numbered items (currently 5, 6, 7) will be renumbered to 6, 7, 8.

No other lines or files touched.

