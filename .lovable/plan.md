

## Plan: Revert Both Edge Functions to Lovable AI Gateway

### Problem
The direct Google Gemini API calls are failing with `RESOURCE_EXHAUSTED` / `limit: 0` errors despite having a paid-tier key. The functions need to go back to using the Lovable AI Gateway (`ai.gateway.lovable.dev/v1/chat/completions`) which was working before.

### Changes — `supabase/functions/generate-story/index.ts`

**6 changes:**

1. **Replace `GEMINI_API_KEY` with `LOVABLE_API_KEY`** (line ~910): Change env var name and log message

2. **Replace `callGeminiWithRetry` helper** (lines ~510-573): Replace the entire Gemini-specific retry helper with an equivalent that calls `https://ai.gateway.lovable.dev/v1/chat/completions` using OpenAI-compatible format (`Authorization: Bearer`, `messages` array, `response_format`)

3. **Update all 5 call sites** to use OpenAI-compatible request format:
   - **Main generation** (line ~1474): Convert `systemInstruction`/`contents` to `messages` array with `system`+`user` roles; `responseMimeType` → `response_format: { type: "json_object" }`
   - **Retry on parse failure** (line ~1606): Same conversion
   - **Nikud** (line ~578): Convert to `messages` format
   - **Rewrite** (line ~1759): Convert to `messages` format
   - **Summary** (line ~1894): Convert to `messages` format

4. **Update all 5 response parsing sites**: Change from `candidates[0].content.parts[0].text` to `choices[0].message.content`

5. **Keep the retry logic** (exponential backoff, billing detection) — just change the URL and request format

6. **Keep credit protection** — deferred credit deduction stays as-is

### Changes — `supabase/functions/generate-coloring-page/index.ts`

**Note:** The coloring page function uses Gemini's native image generation (`responseModalities: ["TEXT", "IMAGE"]` with `inlineData`). The Lovable AI Gateway uses OpenAI-compatible format which does **not** support image-to-image generation in the same way.

**Solution:** Keep this function using direct Gemini API since it requires multimodal image output. Only revert `generate-story`.

**Alternative:** If we must revert coloring too, we would need to restructure the approach — but the coloring function was already using direct Gemini before today's changes (it was always using `GEMINI_API_KEY` with direct Gemini for image generation). So no revert is needed for coloring.

### Model mapping (Gateway uses OpenAI-compatible model names)
- `gemini-2.0-flash` → `google/gemini-2.5-flash` (or `google/gemini-2.0-flash` if available)
- The Lovable Gateway supports models like `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite`

### Files modified
1. `supabase/functions/generate-story/index.ts` — revert all AI calls to Lovable AI Gateway
2. `supabase/functions/generate-coloring-page/index.ts` — no changes needed (was already using direct Gemini for image gen)

### Deploy
Both functions will be redeployed after changes.

