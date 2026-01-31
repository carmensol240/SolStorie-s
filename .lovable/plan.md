
# Password Reset Email & Global Scroll Fix Plan

## Problem Analysis

### Finding 1: User Does Not Exist in Database
The logs reveal the **root cause**: the email `carmit1901@gmail.com` is not registered in the system.

```
Error generating reset link: AuthApiError: User with this email not found
error_code: "user_not_found"
```

The edge function is working correctly - it intentionally returns "Email Sent" even when the user doesn't exist. This is a **security best practice** to prevent attackers from discovering which emails are registered (email enumeration attack).

### Finding 2: Sender Domain Test Needed
You requested testing with `onboarding@resend.dev` to rule out domain issues. This will help confirm whether the `storytime.org.il` domain has any delivery issues.

### Finding 3: Global Scroll Issue
Current CSS in `src/index.css` prevents scrolling:
```css
html, body {
  overflow: hidden;  /* This blocks scrolling */
}
```

---

## Solution Plan

### Step 1: Test with Existing User
Before changing code, please verify:
- Does `carmit1901@gmail.com` have an account?
- Try the password reset with an email you KNOW is registered

### Step 2: Change Sender to Test Domain (Temporary)
Modify `supabase/functions/send-password-reset/index.ts`:
```typescript
// Line 87: Change from:
from: "סטורי טיים <noreply@storytime.org.il>",

// To:
from: "Story Time <onboarding@resend.dev>",
```

### Step 3: Fix Global Scroll
Modify `src/index.css` to allow scrolling:
```css
html, body {
  direction: rtl;
  scroll-behavior: smooth;
  overflow-y: auto;  /* Changed from 'hidden' */
  overflow-x: hidden;
  min-height: 100vh;
  min-height: 100dvh;
}
```

### Step 4: Page-Level Scroll Containers
Update main pages to have proper scroll containers:
- `Home.tsx` - already has `overflow-hidden` on container (intentional for dashboard layout)
- `Library.tsx` - add scroll wrapper
- `CreateStory.tsx` - add scroll wrapper
- `Auth.tsx` - add scroll wrapper

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-password-reset/index.ts` | Change sender to `onboarding@resend.dev` |
| `src/index.css` | Change `overflow: hidden` to `overflow-y: auto; overflow-x: hidden` |

### Testing Steps After Implementation
1. Create a NEW test account with a fresh email
2. Request password reset for that email
3. Check if email arrives from `onboarding@resend.dev`
4. Verify pages scroll properly on all devices

### Important Security Note
The edge function correctly hides whether an email exists - this is intentional. The "Email Sent" message appears even for non-existent users to prevent attackers from discovering valid email addresses.

---

## Expected Outcome
- Password reset emails will be sent via Resend's test domain
- If email arrives: Your domain (`storytime.org.il`) may need re-verification
- If email still fails: Issue is elsewhere (API key scope, Resend account limits)
- All pages will scroll properly to show full content
