
# Password Reset Email Fix Plan

## Root Cause Identified

The password reset emails are NOT being sent because **the email address being tested (`carmit1901@gmail.com`) is not registered in the database**.

### Evidence from Logs:
```
Error generating reset link: AuthApiError: User with this email not found
Processing password reset for: carmit1901@gmail.com
```

### Registered Users:
The only registered user in the database is: **`ckarma63@gmail.com`** (created 2026-01-31, verified)

The edge function intentionally returns "Email Sent" even for non-existent users - this is a **security best practice** to prevent attackers from discovering which emails are registered.

---

## Why Sign-up Works But Password Reset Doesn't

| Flow | Mechanism | Works? |
|------|-----------|--------|
| **Sign-up** | Uses Lovable Cloud's built-in email hook (`email-hook`) | Yes |
| **Password Reset** | Uses custom edge function with `generateLink()` API | Only for existing users |

The sign-up flow uses Lovable Cloud's automatic email system, while password reset uses your custom edge function. Both work correctly - but the password reset can only send emails for users that actually exist.

---

## Solution: Test with a Registered Email

**Immediate Test**: Request password reset for `ckarma63@gmail.com` - this should successfully send an email via Resend.

If the email arrives, the system is working correctly. If not, there's an issue with:
1. Resend API key scope
2. Domain verification

---

## Technical Verification Checklist

### Already Correct:
- Event handler: `handleForgotPassword` correctly calls `resetPasswordForEmail()` (line 375-406 in Auth.tsx)
- Edge function: Properly uses `supabaseAdmin.auth.admin.generateLink()` to create recovery link
- Redirect URL: Set to `${window.location.origin}/reset-password` (correct)
- Sender: Changed to `onboarding@resend.dev` for testing

### After Confirming Email Works:
1. Restore sender to `noreply@storytime.org.il`
2. Optionally add logging to show email was actually sent

---

## Recommended Testing Steps

1. **Test with existing user**: Go to `/auth`, click "Forgot Password", enter `ckarma63@gmail.com`
2. **Check inbox**: Look for email from `onboarding@resend.dev`
3. **Check spam folder**: Resend test domain emails sometimes go to spam
4. **Verify edge function logs**: Should show "Sending password reset email to: ckarma63@gmail.com" followed by "Password reset email sent successfully"

---

## If Email Still Doesn't Arrive

If testing with `ckarma63@gmail.com` still fails:

### Option 1: Check Resend Dashboard
- Log into resend.com
- Check "Emails" tab for delivery status
- Look for any bounces or failures

### Option 2: Add Debug Logging
Add more detailed logging to the edge function to capture the Resend API response:
```typescript
console.log("Resend API response:", JSON.stringify(emailResponse));
```

### Option 3: Verify API Key Scope
The Resend API key might be restricted. In Resend dashboard:
- Go to "API Keys"
- Ensure the key has permission to send from `onboarding@resend.dev`

---

## Files Already Correct (No Changes Needed)

| File | Status |
|------|--------|
| `src/pages/Auth.tsx` | Event handler correctly wired (lines 375-406) |
| `src/hooks/use-auth.ts` | `resetPasswordForEmail` correctly calls edge function |
| `supabase/functions/send-password-reset/index.ts` | Logic is correct, sender updated to test domain |

---

## Summary

**The password reset system is working correctly.** The issue is that you were testing with an email address that doesn't have an account (`carmit1901@gmail.com`).

**Action Required**: Test the password reset flow with a registered email address (`ckarma63@gmail.com`) to verify emails are being delivered.
