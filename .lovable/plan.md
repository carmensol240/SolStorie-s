

# Deploy Edge Functions + הגדלת טקסט "ספרו לנו על הילד/ה"

## משימה 1: Deploy כל ה-Edge Functions

אבצע Deploy לכל ה-Edge Functions הבאות:
- `generate-story`
- `generate-illustrations`
- `add-nikud`
- `enhance-text`
- `get-settings`
- `get-signed-photo-url`
- `get-signed-illustration-url`
- `preview-child-avatar`
- `send-contact-form`
- `send-password-reset`
- `send-purchase-confirmation`
- `track-event`

## משימה 2: הגדלת הטקסט

### קובץ: `src/components/wizard/TopicStep.tsx`

### שינוי בשורות 421-427:

**לפני:**
```tsx
<div className="flex items-center gap-2 justify-center">
  <Brain className="w-4 h-4 text-purple-500" />
  <Label className="text-xs font-bold text-purple-700">
    ספרו לנו מה עבר על הילד/ה
  </Label>
  <Sparkles className="w-4 h-4 text-pink-500" />
</div>
```

**אחרי:**
```tsx
<div className="flex items-center gap-2 justify-center">
  <Brain className="w-5 h-5 text-purple-500" />
  <Label className="text-sm font-bold text-purple-700">
    ספרו לנו מה עבר על הילד/ה
  </Label>
  <Sparkles className="w-5 h-5 text-pink-500" />
</div>
```

### סיכום השינויים:
| אלמנט | לפני | אחרי |
|-------|------|------|
| גודל טקסט | `text-xs` | `text-sm` |
| גודל אייקונים | `w-4 h-4` | `w-5 h-5` |

---

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `src/components/wizard/TopicStep.tsx` | הגדלת טקסט הכותרת |
| Edge Functions | Deploy לכולן |

