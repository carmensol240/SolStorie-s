

## Plan: Add 'Rainbow Power' (Fruits & Vegetables) Educational Topic

### What Changes

#### 1. New topic in `topic-data.ts`
Add `rainbow-power-edu` to the Educational Toolbox (`edu`) category:

```typescript
{ 
  id: "rainbow-power-edu", 
  label: "🌈 כוח הקשת – פירות וירקות קסומים", 
  description: "מדריך חברתי מובנה (Carol Gray): כל פרי וירק הוא כוח-על מיוחד! הצבעים של הקשת מחכים בצלחת – אדום נותן אנרגיה, כתום מחזק את העיניים וירוק בונה שרירים חזקים.",
  image: topicBraveTaster, // Reuse brave-taster image (closest match)
  ageRange: "0-8",
  keywords: ["פירות", "ירקות", "אכילה בריאה", "צבעים", "תזונה", "כוח על", "carol gray"]
}
```

#### 2. Translation in `topic-translations.ts`
Add mapping:
```typescript
'rainbow-power-edu': 'כוח הקשת – פירות וירקות קסומים',
```

#### 3. Sequel logic — already working
The existing sequel system (child_id + topic matching + summary injection) will automatically handle this. When Sol picks "Rainbow Power" again, the generate-story function will find the previous story's summary (e.g., "Sol discovered the red strawberry's energy power") and inject it as context for Part 2, ensuring the next chapter introduces a different "Power Fruit."

#### 4. Age adaptation — already handled
The `generate-story` edge function already adapts content based on `ageRange`:
- **0-2**: Short, sensory (colors, names)
- **3-6**: Cast adventures, "superpowers" framing
- **7-8**: Complex body science, nutritional info

No edge function changes needed — the topic description and NLP framing in the topic itself guide the AI appropriately.

### Files to Edit

| File | Change |
|------|--------|
| `src/components/wizard/topic-data.ts` | Add `rainbow-power-edu` topic to edu section |
| `src/lib/topic-translations.ts` | Add Hebrew translation mapping |

