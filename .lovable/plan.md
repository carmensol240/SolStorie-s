

## Plan: Hide Learning Topics Until Category Is Selected

### Problem
When the learning section is collapsed, the `else` branch (line 275) still renders the first 2 topics as `SimpleTile` cards. These should be hidden — learning topics should only appear after expanding the section AND selecting a sub-category.

### Change — `src/components/wizard/TopicStep.tsx` line 232

Replace:
```typescript
{section.id === "learning" && isExpanded ? (
```

With:
```typescript
{section.id === "learning" ? (
  isExpanded ? (
```

And adjust the closing to add an extra `)` and render nothing when learning is collapsed — wrapping the existing learning block so the `else` (flat topic list) is never reached for the learning section.

Specifically, replace lines 232–300 structure so that:
- `section.id === "learning"` → if expanded, show the two-step UI (existing code); if not expanded, render nothing (no topics shown)
- `section.id !== "learning"` → existing flat list behavior unchanged

### Single condition change. No other files touched.

