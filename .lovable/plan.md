
# Two Targeted Improvements

## Problem 1 — Descriptions Are Truncated in the UI
Each topic tile clips its description at 2 lines (`line-clamp-2`). Parents and educators cannot read the full topic description before selecting a story topic.

**Fix:** Add a small **"קרא עוד"** expand toggle on each tile so the full description is readable inline — no modal needed, no route change.

## Problem 2 — AI Does Not Receive the Topic Description
When a topic is selected (e.g. `"honesty"`), the `generate-story` edge function receives only the topic **ID** string. The detailed Hebrew description written in `topic-data.ts` (e.g. *"סיפור על כוחה של האמת: כשמישהו אמר דבר שלא היה נכון, הוא גילה שהלב שלו כבד מאוד – עד שהאמת יצאה החוצה ואיתה גם הקלה."*) is **never sent to the AI**. This means the AI generates a generic honesty story, not the specific narrative described.

**Fix (two parts):**

### Part A — Frontend: Pass description to edge function
In `CreateStory.tsx` → `GeneratingStep.tsx`, when a structured topic is selected, also pass `topicDescription` (the full Hebrew description from `topic-data.ts`). This requires:
- Looking up the selected topic's `description` from `CHARACTER_SECTIONS` at generation time
- Adding `topicDescription` to the payload sent to `generate-story`

### Part B — Edge function: Inject description into prompt
In `generate-story/index.ts`, receive `topicDescription` from the request body and inject it into the Hebrew user prompt as a **mandatory narrative anchor**:

```
## 📖 תיאור הנושא המדויק (חובה לעקוב אחריו!):
${topicDescription}

**הנרטיב חייב לשקף בדיוק את התיאור הזה.** אל תסטה ממנו לטובת עלילה גנרית.
```

This change ensures every topic produces a story that faithfully follows the specific narrative premise written by the content team.

---

## Files to Edit

### 1. `src/components/wizard/TopicStep.tsx`
- Replace `line-clamp-2` with a stateful expand/collapse per tile
- Add a small `"קרא עוד ▾"` / `"הסתר ▴"` toggle button
- Keep the collapsed state as default (2 lines) so the grid layout stays compact

### 2. `src/components/wizard/GeneratingStep.tsx` (or wherever the API call is made)
- Look up the selected `topic` ID in `CHARACTER_SECTIONS` to find its `description`
- Pass `topicDescription` in the request body to the edge function

### 3. `src/pages/CreateStory.tsx`
- Pass `formData.topic` lookup result as `topicDescription` via `StoryFormData` OR pass it directly in the generation call — whichever is simpler given the existing call site

### 4. `supabase/functions/generate-story/index.ts`
- Destructure `topicDescription` from `req.json()`
- Add validation (optional string, max 1000 chars)
- Inject into the Hebrew prompt with a strong mandatory instruction block just before the `## דיוק לנושא` section

---

## What Stays Unchanged
- Topic IDs, images, labels — no data changes
- Story generation model, nikud pipeline, illustration system
- Navigation, credits, auth flow
- Educational Toolbox and Carol Gray method sections
- English story generation path (description is Hebrew-specific)

---

## Technical Detail: Topic lookup in GeneratingStep

```typescript
import { CHARACTER_SECTIONS } from "@/components/wizard/topic-data";

// In the generation call:
const allTopics = CHARACTER_SECTIONS.flatMap(s => s.topics);
const selectedTopic = allTopics.find(t => t.id === formData.topic);
const topicDescription = selectedTopic?.description ?? "";
```

This is a pure in-memory lookup — no network call, no database query.
