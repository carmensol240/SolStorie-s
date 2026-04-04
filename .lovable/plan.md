
## Plan: Fix 429 handling in `generate-story` and verify the Gemini key

### What I found
- The function is reading the secret successfully. The logs show:
  - `[generate-story] ✅ GEMINI_API_KEY loaded successfully`
- The exact failure is still coming from Google, not from missing env config:
  - `status=429`
  - `status: "RESOURCE_EXHAUSTED"`
  - quota violations mention:
    - `generate_content_free_tier_requests`
    - `generate_content_free_tier_input_token_count`
    - `limit: 0`
    - model: `gemini-2.0-flash`
- That means the key is being read, but Google is still treating that key/project as having zero usable quota for this model. So retry logic will help with temporary minute limits, but it will not solve a true `limit: 0` / billing-configuration issue by itself.

### Root cause in code
- `generate-story` currently has:
  - no real retry wrapper around the main Gemini API call
  - only a later retry when JSON parsing fails
- There is already exponential backoff logic in `generate-coloring-page`, so we can mirror that pattern in `generate-story`.
- The logs also show story credits are deducted before the Gemini call succeeds, so repeated 429s are burning user credits.

### Implementation
1. Add a reusable Gemini fetch helper inside `supabase/functions/generate-story/index.ts`
   - exponential backoff + jitter
   - retry on `429`, `500`, `502`, `503`, `504`
   - honor Google retry hints when available
   - log attempt number, status, shortened body, and wait time

2. Use that helper for all Gemini calls in `generate-story`
   - main story generation
   - retry generation after parse failure
   - text rewrite
   - summary generation
   - nikud generation

3. Improve 429 handling
   - detect quota/billing-style 429s (`limit: 0`, free-tier quota text)
   - return a clearer system error instead of a generic “try again in a few minutes” when the quota is effectively disabled
   - keep transient 429s marked as retryable

4. Protect user credits
   - move credit deduction to after successful story generation, or
   - rollback/refund the deducted credit if Gemini still fails after all retries
   - this is important because current logs show multiple deductions during failed attempts

5. Keep everything else unchanged
   - prompts
   - Hebrew output
   - Pixar/Disney styling
   - existing story flow and schema

### Files to update
- `supabase/functions/generate-story/index.ts`

### Technical details
- Reuse the same retry strategy style already present in `generate-coloring-page`
- Apply retry before the first failure response is returned to the client
- For non-critical background tasks like summary/nikud, keep retries shorter so they do not slow the main flow too much
- No database migration is required for this fix

### Expected outcome
- We will confirm in logs that the new key is loaded correctly
- Temporary rate-limit spikes will be retried automatically
- Users will stop losing story credits on failed Gemini calls
- If Google still returns `limit: 0`, the app will fail more clearly, which confirms the remaining issue is on the Google quota/billing side rather than in the function code
