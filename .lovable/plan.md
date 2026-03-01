

## Plan: Switch generate-story to OPENAI_API_KEY + Enhanced Logging

### Overview
Replace `LOVABLE_API_KEY` with `OPENAI_API_KEY` for the main story generation call, switch the endpoint from the Lovable AI Gateway to the OpenAI API directly, and add detailed `console.log` statements for debugging.

### Changes in `supabase/functions/generate-story/index.ts`

#### 1. API Key — lines ~693-700
Replace `LOVABLE_API_KEY` retrieval with `OPENAI_API_KEY`:
```typescript
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
if (!OPENAI_API_KEY) {
  console.error("[generate-story] OPENAI_API_KEY is NOT configured in secrets!");
  throw new Error("API key not configured");
}
console.log("[generate-story] OPENAI_API_KEY loaded successfully");
```

#### 2. Main AI call — line ~1092
Switch endpoint from `ai.gateway.lovable.dev` to `api.openai.com` and use the OpenAI key:
```typescript
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-4o",
    messages: [...],
    response_format: { type: "json_object" },
  }),
});
```

#### 3. Enhanced logging throughout
Add detailed logs at key checkpoints:
- Request body parsing (child name, topic, age range)
- Auth verification result
- API key availability
- Full error response text on AI call failure
- Story parsing success/failure with page count
- DB insert results

#### 4. Background calls (summary + nikud) — lines ~1270, 1305
These still use `LOVABLE_API_KEY` for cheaper/faster tasks (summary via gemini-flash-lite, nikud). Keep these on the Lovable gateway since they work fine, but rename the variable to clarify:
```typescript
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
// Used only for background summary + nikud (cheap tasks)
```

#### 5. CORS — already correct
The existing `corsHeaders` at line 5-8 already includes all required headers. No changes needed.

### Model Choice
Switching from `google/gemini-2.5-pro` (via Lovable gateway) to `gpt-4o` (via OpenAI directly). This uses the `OPENAI_API_KEY` secret that's already configured.

### Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/generate-story/index.ts` | Switch main AI call to OpenAI API with OPENAI_API_KEY; add detailed console.log; keep LOVABLE_API_KEY for background tasks |

Edge function deployment required after change.

