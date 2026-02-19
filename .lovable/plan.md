
# Two UI Fixes for TopicStep

## Fix 1 — Deselect a Topic (Toggle Off)

**Problem:** `handleTopicSelect` always sets `topic: topic.id`. Clicking an already-selected tile does nothing visible.

**Fix:** In `handleTopicSelect`, check if the clicked topic is already selected. If yes, clear the selection; if no, select it.

```ts
const handleTopicSelect = (topic: TopicItem) => {
  if (formData.topic === topic.id) {
    // Deselect
    updateFormData({ topic: "", customTopic: "", adventureLogic: undefined });
  } else {
    // Select
    updateFormData({ topic: topic.id, customTopic: topic.label, adventureLogic: undefined });
  }
};
```

This applies to both the main topic grid and the search results grid (both call `handleTopicSelect`).

---

## Fix 2 — Category Label Moves to Bottom-Center of Banner

**Problem:** The category name and topic count are currently on the right side, vertically centered, aligned to `items-start` with `pr-5`.

**Requested change:** Move the label to the **bottom-center** of each banner card, centered horizontally.

**Current layout (line 165–168):**
```tsx
<div className="absolute inset-0 flex flex-col justify-center items-start pr-5 gap-1" dir="rtl">
  <h3 className="text-white text-xl font-black drop-shadow-md">{section.categoryEmoji} {section.categoryLabel}</h3>
  <span className="text-white text-xs font-bold drop-shadow-md">{section.topics.length} נושאים</span>
</div>
```

**New layout:**
```tsx
<div className="absolute inset-0 flex flex-col justify-end items-center pb-3 gap-0.5">
  <h3 className="text-white text-xl font-black drop-shadow-md text-center">{section.categoryEmoji} {section.categoryLabel}</h3>
  <span className="text-white text-xs font-bold drop-shadow-md">{section.topics.length} נושאים</span>
</div>
```

The gradient overlay will also be updated to go from `bottom` (dark) to `top` (transparent) so it frames the text at the bottom:
```tsx
<div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
```

---

## Technical Details

**File:** `src/components/wizard/TopicStep.tsx`

**Lines changed:**
1. `handleTopicSelect` function (lines 54–60) — add toggle-off logic
2. Banner overlay gradient (line 164) — flip direction to `to top`
3. Banner text container (lines 165–168) — change to `justify-end items-center pb-3`
4. `h3` on line 166 — add `text-center`

No other files need changing. No backend changes. No new dependencies.
