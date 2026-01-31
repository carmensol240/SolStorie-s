
# Password Reset Email Fix Plan

## Problem Summary
The password reset email is not being delivered because Supabase uses its **built-in email system** (not Resend) for authentication emails. The auth logs confirm the request was processed successfully (status 200), but the email delivery is failing.

## Current State
- **Resend API Key**: Configured and working (used for contact form and purchase emails)
- **Verified Domain**: `storytime.org.il` in Resend
- **Auth Flow**: Uses `supabase.auth.resetPasswordForEmail()` which relies on Supabase's default SMTP
- **Issue**: Supabase's default email provider has deliverability issues

---

## Solution: Configure Custom SMTP in Supabase

### Option A: Custom SMTP via Resend (Recommended)

Configure Supabase to use Resend as the SMTP provider for ALL authentication emails.

**Steps:**
1. Get SMTP credentials from Resend dashboard
2. Configure Supabase Auth SMTP settings using the `configure-auth` tool
3. Set sender email to use verified domain (`noreply@storytime.org.il`)

### Option B: Custom Edge Function for Password Reset

Create a new edge function that handles password reset emails via Resend, then modify the auth flow to use it.

---

## Implementation Details

### Step 1: Configure SMTP Settings

Use Supabase Auth configuration to set up Resend SMTP:
- **SMTP Host**: `smtp.resend.com`
- **SMTP Port**: 465 (SSL)
- **SMTP User**: `resend`
- **SMTP Password**: Your `RESEND_API_KEY`
- **Sender Email**: `noreply@storytime.org.il`
- **Sender Name**: סטורי טיים

### Step 2: Verify Email Templates

Ensure the password reset email template in Supabase Auth settings:
- Uses Hebrew text
- Contains proper reset link format
- Matches the app's branding

### Step 3: Test the Flow

1. Request password reset from `/auth` page
2. Verify email arrives with correct content
3. Click reset link → verify `/reset-password` page works
4. Submit new password → verify success

---

## Technical Notes

### Why This Works
- Resend provides enterprise-grade email deliverability
- Using your verified domain (`storytime.org.il`) ensures emails aren't marked as spam
- All auth emails (password reset, email verification, magic links) will use Resend

### Files to Modify
No code changes required - this is a configuration change in Supabase Auth settings

### Prerequisites
- RESEND_API_KEY is already configured
- Domain `storytime.org.il` is verified in Resend
- Resend SMTP access is enabled (may need to request from Resend dashboard)

---

## Alternative: If SMTP Configuration Not Available

If Supabase Auth SMTP configuration isn't accessible via Lovable Cloud, we'll implement Option B:

1. Create `supabase/functions/send-password-reset/index.ts`
2. Generate custom reset tokens
3. Send branded emails via Resend
4. Handle token verification on the reset password page

This approach requires more code changes but gives full control over the email content and delivery.
