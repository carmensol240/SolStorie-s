# Fix `generate-story` failure + visible error diagnostics

## Symptoms
- Frontend shows 5% then fails every time.
- Edge logs show 6 retried invocations, each stopping at `"Current credits: 30"` (line 746) and never reaching `"Generating story for:"` (line 916). No error log appears.
- `error_logs` table is empty for the period — meaning the outer `catch` is not firing.
- Conclusion: function returns a non-2xx response from one of the input-validation branches at lines 850–914 (no logging there), the front-end masks it as `FunctionsHttpError`, and the auto-retry loop reproduces it.

## Root cause
1. **Validation branches return 400 without logging** — we have no way to see which field is failing.
2. **Front-end loses the server's error body** when calling `supabase.functions.invoke()` on non-2xx (it only keeps a generic message).
3. **Outer catch returns a generic Hebrew message** even when the real error is something useful.

## Fix scope (only generation logic + error visibility — no UI/feature changes)

### 1. `supabase/functions/generate-story/index.ts`
- Add `console.log("[generate-story] reqBody keys:", Object.keys(reqBody))` and `console.log("[generate-story] field check", { hasName, nameLen, hasTopic, topicLen, topicId, language, ageRange, storyLength, isGuest })` immediately after parsing `reqBody` and before validation.
- For each validation `return` (missing name, missing topic, length limits, gender), prepend `console.warn("[generate-story] VALIDATION FAIL:", reason, value)` so we can see exactly which check rejected the request.
- In the outer `catch` block, additionally include `error.stack` in the `logError` metadata and log the full error object (`console.error("[generate-story] CRASH:", error?.message, error?.stack)`).
- In the response from the outer catch, attach a `debug` field with `error.message` (kept short, no stack) so the front-end can show it during this debugging window. The user-facing `error` string stays the same.
- Wrap the post-credit `children` lookup (line 921) in try/catch so a slow/failed query can't kill the request silently.

### 2. `src/components/wizard/GeneratingStep.tsx`
- After `supabase.functions.invoke("generate-story", ...)`, when `result.error` exists, also read `result.data` (Supabase populates it even on 4xx) and `console.error("[GeneratingStep] Server error body:", result.data, result.error)`.
- If `result.data?.error` is present, throw `new Error(result.data.error + (result.data.debug ? " — " + result.data.debug : ""))` instead of throwing the opaque `FunctionsHttpError`.
- Do not change retry logic, UI, progress bar, or any other feature.

### 3. Verify end-to-end
- Deploy `generate-story`.
- Call the edge function with a known-good payload via `supabase--curl_edge_functions` using the user's auth token (logged-in browser session) and confirm a `storyId` is returned.
- Tail edge logs to confirm we now see either `"Generating story for:"` (success path) or a clear `VALIDATION FAIL` / `CRASH` line with the real reason.
- Ask the user to retry from the UI and report the new error message that appears.

## Files touched
- `supabase/functions/generate-story/index.ts` (logging + safer children lookup + debug field on error)
- `src/components/wizard/GeneratingStep.tsx` (surface server error body)

## Out of scope
- AI prompt content, model selection, illustration/cover dispatch, UI, progress animation, auth flow.
