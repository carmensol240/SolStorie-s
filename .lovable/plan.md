

## Analysis

The cover generation code (`generate-cover/index.ts`) already has good foundations — it fetches the child's photo, extracts a character profile, uses avatar_description, and applies the same Pixar 3D CGI style. However, there are gaps causing inconsistencies:

### Issues Found

1. **Incomplete topic-to-setting mapping**: `TOPIC_SETTINGS` only covers ~20 topics out of 60+. Unmapped topics fall back to a generic "enchanted forest" — so a zoo story or space story may get wrong backgrounds.

2. **Weak `storyContext`**: The scene context is built from `summary → illustration_prompt → first page text → title`. The summary is often null, and the first page text may not represent the overall story theme well.

3. **No topic description injection**: The `topic-data.ts` file has Hebrew descriptions for each topic that describe the story concept. These aren't used in cover generation.

4. **Character profile extraction sometimes fails silently**: Falls back to hardcoded defaults that may not match the child at all.

---

## Plan

### 1. Expand TOPIC_SETTINGS to cover all topics
Add mapping entries for every topic defined in `topic-data.ts` (~60+ topics). This ensures the background always matches the theme.

### 2. Improve storyContext with richer scene data
- Fetch **all page illustration_prompts** (not just first page) and pick the most visually rich one
- Include the topic name itself in the prompt so Gemini understands the story theme
- Add a `topicDescription` field derived from the topic slug (e.g., "space-adventure" → "A space adventure story")

### 3. Strengthen the cover prompt
Update `buildPersonalizedPrompt` to explicitly state:
- The story topic/theme
- "The character must look IDENTICAL to the story illustrations"
- Use the avatar_description more prominently

### 4. Files to modify
- `supabase/functions/generate-cover/index.ts` — expand TOPIC_SETTINGS, improve storyContext fetching, strengthen prompt

### Technical Details

**Enhanced storyContext building:**
```typescript
// Fetch all illustration prompts for richer context
const { data: allPages } = await supabase
  .from("story_pages")
  .select("illustration_prompt")
  .eq("story_id", storyId)
  .order("page_number", { ascending: true });

// Use topic + summary + best illustration prompt
const topicLabel = (topic || "").replace(/-/g, " ");
const bestPrompt = allPages?.find(p => p.illustration_prompt)?.illustration_prompt || "";
const storyContext = `A "${topicLabel}" themed story. ${story?.summary || bestPrompt || title || ""}`;
```

**Expanded TOPIC_SETTINGS** — add entries for all missing topics (anger, apologize, barber-visit, bath-shower, body-safety, brave-taster, clean-room, crying-is-ok, divorce, emotion-regulation, environment, fear-of-dark, find-a-friend, first-day-kindergarten, flying-vacation, grandparents-night, hand-washing, helping-others, how-body-works, independence, just-be-me, lost-tooth, making-mistakes, mom-dont-go, my-special-family, nail-trimming, nature-secrets, new-house, patience, play-rules, pocket-kiss, politeness, road-safety, screen-time, seatbelt-safety, self-confidence, sharing, sibling-love, sick-grandparent, stranger-danger, teeth-brushing, trying-again, waiting-in-line, we-are-special, etc.)

