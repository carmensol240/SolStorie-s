

## Plan: SolStories Master Update — Summary-Based Sequels + New Topic

### Already Implemented (No Changes Needed)
- **Visual Style**: Cinematic 3D Pixar STYLE_BLOCK already applied across all 3 edge functions
- **IndexedDB**: Already implemented in `use-offline-storage.ts`
- **PDF Sharing via navigator.share**: Already implemented
- **"What Happens Next?" button**: Already in `BookHeader.tsx` with Sparkles icon and Popover
- **Sequel logic (basic)**: Already queries previous stories by `child_name` + `topic` and injects Part N instruction
- **Cast & Age settings**: Already defined in edge functions
- **child_id isolation**: Already passed from `GeneratingStep.tsx` and saved in `stories` table

### What Changes

#### 1. Add `summary` column to `stories` table
The current sequel logic only counts previous stories — it doesn't know what happened in them. Adding a `summary` column allows the AI to reference previous plot points when generating sequels.

**Database migration:**
```sql
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS summary text;
```

#### 2. Auto-generate and save summary after story creation
After the AI generates story text, add a short follow-up call to generate a 1-sentence Hebrew summary of the plot, then save it to the new `summary` column.

**In `generate-story/index.ts`** (after story pages are inserted, ~line 1252):
- Call the AI with the full story text asking for a single-sentence Hebrew summary
- Update the story row with the summary in a background task (fire-and-forget, like nikud)

#### 3. Enhance sequel logic to use previous summaries
**In `generate-story/index.ts`** (~line 1175-1192):
- Change the query from `select("id")` to `select("id, summary")` 
- Include previous story summaries in the sequel instruction so the AI knows what happened before

#### 4. Use `child_id` instead of `child_name` for sequel matching
Currently matches on `child_name` which could collide across children with the same name. Switch to `child_id` when available for proper multi-child isolation.

#### 5. Add new topic: "לאכול עם סכו״ם" (Eating with Cutlery)
**In `topic-data.ts`** — add to the Educational Toolbox category:
```
{ id: "eating-with-cutlery-edu", label: "🍴 לאכול עם סכו״ם – הכלים המבריקים שלי", description: "מדריך חברתי מובנה (Carol Gray): ..." }
```

**In `topic-translations.ts`** and **`generate-story/index.ts` TOPIC_HEBREW_MAP** — add the Hebrew mapping.

### Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/generate-story/index.ts` | Add summary generation (background), enhance sequel query to include summaries, use `child_id` for matching |
| `src/components/wizard/topic-data.ts` | Add "eating-with-cutlery-edu" topic |
| `src/lib/topic-translations.ts` | Add translation mapping |
| Database migration | Add `summary` column to `stories` table |

### Technical Details

**Summary generation** (background, after page insert):
```typescript
// Fire-and-forget summary generation
(async () => {
  const fullText = storyData.pages.map(p => p.text).join("\n");
  const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: `סכם את הסיפור הבא במשפט אחד בעברית:\n${fullText}` }],
    }),
  });
  const summary = (await summaryResponse.json()).choices?.[0]?.message?.content;
  if (summary) {
    await supabase.from("stories").update({ summary }).eq("id", story.id);
  }
})();
```

**Enhanced sequel instruction** with summaries:
```typescript
const previousSummaries = previousStories
  .filter(s => s.summary)
  .map((s, i) => `חלק ${i + 1}: ${s.summary}`)
  .join("\n");

sequelInstruction = `## 🔄 המשך הרפתקה (חלק ${partNumber})
${previousSummaries ? `סיכום ההרפתקאות הקודמות:\n${previousSummaries}\n` : ""}
צור המשך חדש ומרתק באותו עולם...`;
```

