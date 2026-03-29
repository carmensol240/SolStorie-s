

## Plan: Force `object-contain` for Learning Topic Illustrations

### Summary
For stories where `story.topic` starts with `letter-` or `number-`, all illustration `<img>` tags will use `object-contain` with a dark background instead of `object-cover`. Other story types remain unchanged.

### Technical Details — `src/pages/StoryViewer.tsx` only

**1. Add a derived boolean** near line ~1005 (where `isToddler` is defined):
```typescript
const isLearningTopic = story?.topic?.startsWith('letter-') || story?.topic?.startsWith('number-');
```

**2. Update 3 illustration `<img>` tags:**

- **Cover image (~line 1247)**: Add `isLearningTopic` to the contain condition:
  ```
  coverIsLandscape || isLearningTopic ? "object-contain bg-black/