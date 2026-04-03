

## Plan: Fix Coloring Page "No Credits" Error Message

### Problem
The coloring feature itself has no credit check — it's free for all users. The confusing "no credits" error appears when the Lovable AI gateway returns HTTP 402 (platform AI balance limit). The edge function translates this into "נגמרו הקרדיטים, נסו שוב מאוחר יותר" which misleads users into thinking their personal credits are depleted.

### Fix
Change the error message in the edge function to be generic and not mention credits. Also add a retry mechanism since 402 from the AI gateway can be transient.

### Changes — `supabase/functions/generate-coloring-page/index.ts`

1. Change the 402 error response message from "נגמרו הקרדיטים, נסו שוב מאוחר יותר" to "השירות עמוס כרגע, נסו שוב בעוד כמה דקות 🎨" — a generic server-busy message that doesn't reference credits.

2. Remove the `code: "CREDITS_EXHAUSTED"` field to prevent any client-side code from interpreting this as a user credit issue.

3. Also update the 429 error message similarly for consistency: keep the existing "השרת עמוס כרגע" message but ensure both paths feel equivalent to the user.

### Files modified
1. `supabase/functions/generate-coloring-page/index.ts`

