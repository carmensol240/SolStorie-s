

## Plan: Dynamic AI-Based Outfit Generation

### Problem
Currently, outfit selection uses a hardcoded `THEME_OUTFITS` map (lines 597-663) covering only ~13 topics. The remaining ~70+ topics fall back to the child's original clothing from their photo. The user wants ALL topics to get contextually appropriate outfits.

### Solution
Add a Gemini Flash call before illustration generation that takes the story topic and returns a one-line outfit description. This replaces the hardcoded map with intelligent, dynamic outfit selection.

### Changes — Single File: `supabase/functions/generate-illustrations/index.ts`

**1. Add new function `generateOutfitForTopic` (~lines 595-596, before THEME_OUTFITS)**

A new async function that calls Gemini 2.5 Flash with the topic name and asks for a one-line outfit description suitable for a child character in that story. For neutral topics (emotions, friendship, family), it returns `null` to keep the original clothing.

```typescript
async function generateOutfitForTopic(topic: string, apiKey: string): Promise<string | null> {
  // Call Gemini Flash with topic → get one-line outfit description
  // System prompt instructs: if neutral topic, return "KEEP_ORIGINAL"
  // Timeout: 8 seconds, fallback to null on error
}
```

**2. Replace hardcoded THEME_OUTFITS usage (lines 820-833)**

Instead of looking up `THEME_OUTFITS[topic]`, call `generateOutfitForTopic(topic, LOVABLE_API_KEY)`. If it returns a description, use it as `storyOutfit`. If it returns `null` (neutral topic or error), fall back to the character profile's clothing or "colorful casual clothes".

Keep `THEME_OUTFITS` as a fast-path cache — check it first, only call AI if topic isn't in the map.

**3. No other changes** — the `storyOutfit` variable is already threaded through all illustration functions (`buildVisualAnchor`, `generateIllustrationWithFace`, `generateIllustrationGeminiNoFace`, `generateIllustration`).

### Flow
```text
Topic ("חנוכה") 
  → Check THEME_OUTFITS cache → miss
  → Gemini Flash: "Describe outfit for child in story about חנוכה"
  → "traditional Jewish festive clothing with a blue and white tunic"
  → storyOutfit = AI result
  → Injected into all illustration prompts
```

### Risk Mitigation
- 8-second timeout on the AI call
- Fallback to original clothing on any error
- THEME_OUTFITS kept as fast-path for known topics (no AI call needed)
- Single AI call per story (not per page), minimal latency impact (~1-2s)

