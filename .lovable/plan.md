

## Plan: Fix Biblical Tab Filter — Character Mismatch

### Problem
The filter on line 74 uses `"תנ״כיים"` (with Unicode gershayim `״` U+05F4), but the actual `subCategory` values in `topic-data.ts` use `"תנ\"כיים"` (with a regular double-quote `"` escaped as `\"`). These are different characters, so `.includes()` never matches.

### Fix — `src/components/wizard/TopicStep.tsx` line 74

Replace:
```typescript
topics: s.topics.filter(t => t.subCategory?.includes("תנ״כיים")),
```

With:
```typescript
topics: s.topics.filter(t => t.subCategory?.includes('תנ"כיים')),
```

Single character fix. No other changes.

