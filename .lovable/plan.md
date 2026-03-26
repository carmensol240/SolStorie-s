

## Plan: Dynamic Child Name in Custom Topic Placeholder

### Change

**File: `src/components/wizard/TopicStep.tsx`**, line 82

Replace the static placeholder with a dynamic one using `formData.childName` and `formData.childGender`:

```typescript
const genderSuffix = formData.childGender === "female" ? "ת" : "";
const childNameForPlaceholder = formData.childName.trim() || "הילד/ה שלך";
const customPlaceholder = `למשל: ${childNameForPlaceholder} אוהב${genderSuffix} חיות ויוצא${genderSuffix} להרפתקה בממלכת הדמיון...`;
```

Then use `customPlaceholder` in the `<Textarea placeholder={...}>`.

The `formData` already contains `childName` and `childGender` from step 1, so no prop changes needed.

### What stays the same
Everything else in TopicStep — search, topic selection, sections, tabs.

