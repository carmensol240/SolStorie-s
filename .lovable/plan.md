

## Plan: Fix send-feedback-notification Edge Function

### Analysis

The function code is syntactically correct and the edge function logs confirm it IS deployed and running — it booted, processed a request, and logged "Feedback notification sent, id: unknown". The "id: unknown" indicates the Resend API returned a response without an `id`, which typically means the email wasn't actually sent (domain/auth issue on Resend's side), but the Edge Function itself is functional.

However, if the deploy is genuinely failing, the most likely cause is the `esm.sh` import of Resend. The fix is to switch to `npm:` specifier (more stable in Deno) and match the pattern used by `send-contact-form` which uses `fetch` directly instead of the Resend SDK.

### Changes — `supabase/functions/send-feedback-notification/index.ts`

Replace the Resend SDK import with direct `fetch` calls to the Resend API (matching the `send-contact-form` pattern):

1. Remove `import { Resend }` and `const resend = new Resend(...)` 
2. Use `const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")` 
3. Replace `resend.emails.send({...})` with a direct `fetch("https://api.resend.com/emails", {...})` call
4. Add HTML escaping for user input (XSS prevention, matching `send-contact-form`)

This eliminates the `esm.sh` dependency entirely, which is the most common cause of Edge Function deploy failures.

### What stays the same
- Email content, recipients, subject line
- CORS headers and error handling
- Config in `supabase/config.toml`
- The invoke call in `StoryViewer.tsx`

