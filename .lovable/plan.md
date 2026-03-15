

## Summary

The user requested **two changes** to `generate-story/index.ts` but only described the first one. Here's what I can do:

### Change 1: Switch the primary AI model (line 1252)

Change the main story generation call from `google/gemini-2.5-pro` to `google/gemini-2.5-flash`.

**File:** `supabase/functions/generate-story/index.ts`
- **Line 1244:** Update log message from `gemini-2.5-pro` to `gemini-2.5-flash`
- **Line 1252:** Change `model: "google/gemini-2.5-pro"` → `model: "google/gemini-2.5-flash"`

### Change 2: Missing

The message mentions "שני שינויים" (two changes) but only describes the first one. Please share the second change so I can include it in the implementation.

