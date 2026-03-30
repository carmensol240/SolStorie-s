

## Plan: Email Feedback to Admin After Submission

### Summary
After saving story feedback to the database, send an email notification to `souldesign06@gmail.com` with story details and the feedback content. Uses a new lightweight Edge Function following the existing `send-purchase-confirmation` Resend pattern.

### Technical Details

**1. Create `supabase/functions/send-feedback-notification/index.ts`**

A simple Edge Function using Resend (same pattern as `send-purchase-confirmation`):