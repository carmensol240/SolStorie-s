

## Plan: Enable PayPal Sandbox Mode for Gift Card Testing

### Current State
- The project has a **Live PayPal Client ID** in `src/config/pricing.ts` (line 47)
- The **Sandbox Client ID** is already saved as a comment on line 46: `Ac9EHf8z3a7W8Ewy5MGdUzc9lc7ThzaflNMNjjLXNqBmReU2FZfl98ZCyJ9f_LpSXJRUDJdHMdFelyO_`
- PayPal SDK is loaded in `PayPalButton.tsx` with the live client ID

### Changes

**File 1: `src/config/pricing.ts`**
- Add a `PAYPAL_SANDBOX` boolean flag (set to `true` for testing, `false` for production)
- Add `PAYPAL_SANDBOX_CLIENT_ID` constant from the existing comment
- Update `PAYPAL_CLIENT_ID` export to dynamically select based on the flag:
```typescript
export const PAYPAL_SANDBOX = true; // ← SET TO false BEFORE DEPLOYING TO PRODUCTION
export const PAYPAL_SANDBOX_CLIENT_ID = "Ac9EHf8z3a7W8Ewy5MGdUzc9lc7ThzaflNMNjjLXNqBmReU2FZfl98ZCyJ9f_LpSXJRUDJdHMdFelyO_";
export const PAYPAL_LIVE_CLIENT_ID = "AffM7iJE3sqAisjBHuiwL0YYi_W5YT9VDKbMB-wM5XBT7HdwoNjyYtfzUWY3dcK6MVkAr3GSjoEvuVDH";
export const PAYPAL_CLIENT_ID = PAYPAL_SANDBOX ? PAYPAL_SANDBOX_CLIENT_ID : PAYPAL_LIVE_CLIENT_ID;
```

**File 2: `src/components/paywall/PayPalButton.tsx`**
- Import `PAYPAL_SANDBOX` from pricing config
- Show a visible "🧪 מצב בדיקות" banner when sandbox is active, so you never accidentally ship sandbox mode
- No other logic changes needed — the SDK URL already uses `PAYPAL_CLIENT_ID`

### Important Notes
- **Sandbox credentials**: You'll need to use a PayPal Sandbox buyer account (from developer.paypal.com → Sandbox → Accounts) to complete test purchases. The sandbox seller account is already tied to the Sandbox Client ID.
- **⚠️ Before going live**: Set `PAYPAL_SANDBOX = false` in `pricing.ts`.

### What stays the same
- Gift Card page UI, coupon creation, WhatsApp sharing — all unchanged
- Upgrade page PayPal flow — uses same `PAYPAL_CLIENT_ID`, so it will also be in sandbox mode while the flag is on

