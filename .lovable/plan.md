

## Plan: Add `max_tokens: 8192` to the AI call body

**File:** `supabase/functions/generate-story/index.ts`  
**Line 1257:** Add `max_tokens: 8192` next to the existing `response_format` field in the JSON body.

```typescript
// Before:
        response_format: { type: "json_object" },

// After:
        response_format: { type: "json_object" },
        max_tokens: 8192,
```

No other changes.

