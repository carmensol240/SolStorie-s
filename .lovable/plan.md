

## Plan: Update PayPal to Live Credentials

### Current State
- `PAYPAL_SANDBOX = false` in `src/config/pricing.ts` — **correct**, already set to Live mode
- Frontend uses `PAYPAL_LIVE_CLIENT_ID` (`AffM7iJE3...`) — this is the **Live** client ID, already correct
- The `verify-purchase` edge function reads `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from **secrets** and auto-detects sandbox vs live by checking if the ID starts with `"Ac9EH"`

### The Issue
The secrets `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` stored in the backend may still contain **Sandbox** credentials. If `PAYPAL_CLIENT_ID` starts with `Ac9EH`, the edge function routes to `api-m.sandbox.paypal.com` instead of `api-m.paypal.com`, causing verification failures for real payments.

### Fix Required

**1. Update `PAYPAL_CLIENT_ID` secret** — set it to your **Live** Client ID: `AffM7iJE3sqAisjBHuiwL0YYi_W5YT9VDKbMB-wM5XBT7HdwoNjyYtfzUWY3dcK6MVkAr3GSjoEvuVDH`

**2. Update `PAYPAL_CLIENT_SECRET` secret** — set it to your **Live** Secret (from PayPal Developer Dashboard → Live → API Credentials)

I'll use the `update_secret` tool to prompt you to enter both values.

### No Code Changes Needed
- `PAYPAL_SANDBOX` is already `false`
- Frontend already uses the Live client ID
- Edge function auto-detects live vs sandbox from the client ID prefix

