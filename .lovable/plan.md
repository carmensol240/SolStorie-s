

## Analysis: Story Generation Pipeline Performance

### Current Pipeline (Sequential)
The `generate-story` edge function makes **3 sequential AI calls** before returning:

1. **Story generation** — `gemini-2.5-flash` with JSON output (~10-20s)
2. **Text quality rewrite** — `gemini-2.5-flash` processes the full story text again (~10-20s)
3. **Dispatch phase** — fires off nikud, summary, illustrations, cover in parallel, then waits up to 15s for dispatch confirmation

Total: ~30-50s before the user gets a response.

### Root Cause
The **text quality rewrite step** (lines 1621-1750) is a full second AI call using `gemini-2.5-flash` that rewrites the entire story. This doubles the text generation time. The same model (`gemini-2.5-flash`) is used for both the initial generation and the rewrite — the rewrite could use the lighter, faster `gemini-2.5-flash-lite` model since it's just polishing language, not generating new content.

### Proposed Fix — `supabase/functions/generate-story/index.ts`

1. **Switch rewrite model to `gemini-2.5-flash-lite`** (line 1707): This model is 2-3x faster for simple text polishing tasks, cutting the rewrite from ~15s to ~5s
2. **Add a timeout to the rewrite call**: If the rewrite takes too long (>12s), skip it and use the original text — the initial generation prompt already has extensive quality instructions

### Files modified
1. `supabase/functions/generate-story/index.ts` — faster model for rewrite step + timeout guard

