

## Plan: Replace Lovable AI Gateway with Direct Google Gemini API

### Overview
Replace all Lovable AI Gateway (`ai.gateway.lovable.dev/v1/chat/completions`) calls in two edge functions with direct Google Gemini API calls using `GEMINI_API_KEY`.

### Key Difference: API Format
The Lovable Gateway uses OpenAI-compatible format (`/v1/chat/completions`). The direct Gemini API uses a different format (`/v1beta/models/{model}:generateContent`). The request/response structure differs significantly:

- **Auth**: Query param `?key=API_KEY` instead of `Authorization: Bearer`
- **Request body**: `contents` array with `parts` instead of `messages` with `content`
- **System prompt**: Goes in `systemInstruction` field
- **JSON mode**: `generationConfig.responseMimeType: "application/json"` instead of `response_format`
- **Response**: `candidates[0].content.parts[0].text` instead of `choices[0].message.content`
- **Image output** (coloring): Gemini native image gen uses `responseModalities: ["TEXT", "IMAGE"]` in `generationConfig`, returns inline base64 in parts

### Changes — `supabase/functions/generate-story/index.ts`

There are **5 call sites** to replace:

1. **Main story generation** (line ~1441): `gemini-2.5-flash` → `gemini-2.0-flash` at `generativelanguage.googleapis.com`
2. **Retry on parse failure** (line ~1577): Same model/endpoint change
3. **Text quality rewrite** (line ~1712): `gemini-2.5-flash-lite` → `gemini-2.0-flash` (no lite variant in direct API at that endpoint)
4. **Summary generation** (line ~1850): `gemini-2.5-flash-lite` → `gemini-2.0-flash`
5. **Nikud (vowel) function** (line ~513): `gemini-2.5-flash` → `gemini-2.0-flash`

For each call:
- Change URL to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`
- Convert `messages` array to Gemini `contents` format
- Move system prompt to `systemInstruction`
- Convert `response_format: { type: "json_object" }` to `generationConfig.responseMimeType: "application/json"`
- Parse response from `candidates[0].content.parts[0].text`
- Replace `LOVABLE_API_KEY` env read with `GEMINI_API_KEY`

### Changes — `supabase/functions/generate-coloring-page/index.ts`

The coloring function uses image-in + image-out. The direct Gemini API for image generation:
- URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`
- Image input: `inlineData` part with `mimeType` and `data` (base64 without data URL prefix)
- Image output: `generationConfig.responseModalities: ["TEXT", "IMAGE"]`
- Response: image in `candidates[0].content.parts[].inlineData.data` (base64)
- Remove model fallback loop (single model now)
- Keep retry logic for 429/5xx errors
- Replace `LOVABLE_API_KEY` with `GEMINI_API_KEY`

### What stays the same
- All prompts (system prompt, user prompt, illustration prompts, Hebrew text)
- All Supabase/storage/caching/analytics logic
- All error handling patterns (adapted to new response format)
- CORS headers, auth flow, credit logic

### Files modified
1. `supabase/functions/generate-story/index.ts` — 5 API call sites converted to Gemini format
2. `supabase/functions/generate-coloring-page/index.ts` — AI call converted to Gemini image generation format

