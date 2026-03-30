

## Plan: Hide Preview Cards Below Collapsed Category Banners

### Problem
Line 279 renders `visibleTopics` (first 2 topics) even when a category is collapsed. These preview cards should be hidden — only the banner and featured topics should show when collapsed.

### Change — `src/components/wizard/TopicStep.tsx` line 278

Replace the non-learning branch to only render topics when expanded:

```tsx
) : (
  isExpanded ? (
    (() => {
      const topicsToShow = visibleTopics.filter(t => !t.featured);
      // ... rest of existing rendering logic unchanged
    })()
  ) : null
)}
```

Specifically, wrap lines 278-302 so the topic grid only renders when `isExpanded` is true. When collapsed, render nothing (featured topics are already handled separately above in lines 197-229).

### No other files touched.

