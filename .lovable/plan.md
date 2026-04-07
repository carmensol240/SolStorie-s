

## Analysis: Purchase Not Recording After PayPal Payment

### Root Cause

The purchase recording is done **entirely client-side** in the PayPal `onSuccess` callback. After PayPal captures payment, JavaScript runs:
1. `insert` into `purchases` table
2. `addCredits()` which `update`s `profiles.story_credits`
3. `update` for free edits and coloring credits

If ANY of these fail silently (network issue, browser tab closed, JS error, RLS problem), the user is charged but gets nothing. There is **no server-side webhook** to verify and record the payment.

### Evidence from Database
- **Zero** real completed purchases exist — only test purchases from `carmit1901+test@gmail.com`
- **No** purchase-related errors in `error_logs` — meaning the callback either never ran or errors weren't caught properly
- The `catch` block only shows a failed modal but doesn't log to `error_logs`

### Possible Failure Scenarios
1. **`user` is null** at callback time — the async PayPal flow may take long enough for auth session to expire, making `if (!user) return` silently exit
2. **Browser/network interruption** — user closes tab after PayPal approval
3. **RLS timing** — unlikely but possible auth token expiry during callback

### Fix Plan — Two Parts

#### Part 1: Add Robust Error Logging (immediate visibility)

**File: `src/pages/Upgrade.tsx`**

In `handlePayPalSuccess` and all other `onSuccess` callbacks (coloring, edit, educator):
- Add `console.log` at entry point to confirm callback fires
- Log user ID and auth state before any DB call
- Wrap each DB call individually with error logging to `error_logs` table
- If `user` is null, log that specific failure and show toast error instead of silently returning

#### Part 2: Server-Side Payment Verification (permanent fix)

Create a new edge function `verify-purchase` that:
1. Receives PayPal order ID after `actions.order.capture()`
2. Verifies the payment server-side using PayPal API
3. Records the purchase and updates credits using service role (bypasses RLS)
4. Returns success/failure to the client

**Changes:**

1. **`supabase/functions/verify-purchase/index.ts`** — new edge function
   - Accepts: `{ orderId, packageId, amount, userId }`
   - Verifies PayPal order status via PayPal API
   - Inserts into `purchases` with service role
   - Updates `profiles` credits with service role
   - Returns `{ success: true, credits }` or error

2. **`src/components/paywall/PayPalButton.tsx`**
   - In `onApprove`, after `actions.order.capture()`, extract `orderID`
   - Pass `orderID` to the parent's `onSuccess` callback

3. **`src/pages/Upgrade.tsx`**
   - All `onSuccess` handlers call `verify-purchase` edge function instead of direct DB writes
   - Edge function handles credit addition atomically on the server
   - Client just shows success/failure based on response

4. **Secret needed**: PayPal client secret for server-side verification (via `add_secret` tool)

### What stays the same
- All UI design, layout, colors
- PayPal button rendering and SDK loading
- Test purchase flow (for whitelisted user)
- All other pages and components

### Technical Details

**verify-purchase edge function flow:**
```text
Client (PayPal onApprove)
  → capture order → get orderID
  → call verify-purchase({ orderId, packageId, amount })
  → Edge function:
      1. Verify with PayPal API that order is COMPLETED
      2. Check amount matches expected price
      3. Insert purchase record (service role)
      4. Update profile credits (service role)
      5. Return { success, newCredits }
  → Client shows success/failure
```

This ensures that even if the client crashes after payment, the edge function has already recorded everything server-side.

