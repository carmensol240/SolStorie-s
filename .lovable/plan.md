

## Plan: Always Show Featured Topics Regardless of Category State

### Problem
Featured topics ("שהייה בממ״ד ואזעקות" and "אבא במילואים") are hidden when their category is expanded because line 198 includes `!isExpanded`.

### Change — `src/components/wizard/TopicStep.tsx` line 198

Replace:
```tsx
{featuredTopics.length > 0 && !isExpanded && section.id !== "learning" && (
```

With:
```tsx
{featuredTopics.length > 0 && section.id !== "learning" && (
```

Single condition removal. No other files touched.

