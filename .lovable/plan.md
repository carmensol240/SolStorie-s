

## Plan: Add "✡️ תנ״כי" Filter Tab to TopicStep

### Change — `src/components/wizard/TopicStep.tsx`

**Between the "🌟 הכל" tab and the `CHARACTER_SECTIONS.map(...)` tabs (lines 139-153), insert a new tab button:**

```tsx
<button
  onClick={() => setActiveTab("biblical")}
  className={cn(
    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all flex-shrink-0",
    activeTab === "biblical"
      ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-transparent shadow-md"
      : "border-border bg-card text-foreground hover:border-purple-300"
  )}
>
  ✡️ תנ״כי
</button>
```

**Update `filteredSections` logic (lines 68-70) to handle the new "biblical" tab:**

```typescript
const filteredSections = useMemo(() => {
  if (activeTab === "all") return CHARACTER_SECTIONS;
  if (activeTab === "biblical") {
    // Return only sections that have biblical topics, with topics filtered
    return CHARACTER_SECTIONS
      .map(s => ({
        ...s,
        topics: s.topics.filter(t => t.subCategory?.includes("תנ״כיים")),
      }))
      .filter(s => s.topics.length > 0);
  }
  return CHARACTER_SECTIONS.filter((s) => s.id === activeTab);
}, [activeTab]);
```

This filters across all sections to find topics with `subCategory` containing "תנ״כיים", showing only the matching topics grouped under their parent section.

### What stays the same
- All other tabs, sections, search, topic selection logic untouched
- `topic-data.ts` untouched

