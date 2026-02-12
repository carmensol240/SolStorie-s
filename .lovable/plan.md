

## Plan: Make Topic Handling Flexible (No Hardcoded List)

### Problem

The current prompt says "השתמש בנושא שההורה בחר **מתוך הרשימה**" which implies a fixed list. Since topics are added dynamically to the database, the prompt should treat any topic sent from the app as valid.

### Change

**File: `supabase/functions/generate-story/index.ts`** (line 883)

Replace:
```
- השתמש בנושא שההורה בחר מתוך הרשימה כ**עוגן המרכזי** של הסיפור.
```

With:
```
- השתמש בנושא שנשלח אליך מהאפליקציה כ**עוגן המרכזי** של הסיפור - התייחס אליו כאל הנושא המחייב, ללא קשר לרשימה קבועה.
```

### Technical Notes

| Area | Detail |
|------|--------|
| File | `supabase/functions/generate-story/index.ts`, line 883 |
| Scope | 1 line text change |
| Deployment | `generate-story` edge function redeployed automatically |

No other files or database changes needed.

