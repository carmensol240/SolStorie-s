

## Plan: Add Negative Prompt Keywords to Fal.ai Calls

### Summary
Append missing negative prompt keywords to `NEGATIVE_PROMPT_FULL` in the shared style config. Since both fal.ai call sites already reference this constant, updating it once covers all calls.

### Changes — `supabase/functions/_shared/style-config.ts` only

#### Update `NEGATIVE_PROMPT_FULL` (line 28)

Append to the end of the existing string (before the `${ILLUSTRATION_NEGATIVE_PROMPT}` interpolation):

```
no screens, no devices, no phones, no tablets, no frames
```

These keywords are not yet present. Terms like "text", "UI elements", "screenshot artifacts" are already covered, but the explicit "no X" phrasing reinforces them for Flux Schnell which responds well to direct negation.

#### Also update `NEGATIVE_PROMPT` (line 26)

Add the same keywords for consistency, since this is used in some prompt paths too.

### No other files modified
Both `generate-illustrations/index.ts` and `retry-illustration/index.ts` already use `NEGATIVE_PROMPT_FULL` in their prompt strings — no changes needed there.

