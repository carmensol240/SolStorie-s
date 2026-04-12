

## Diagnosis: Why Real PayPal Purchases Aren't Recorded

### Findings
1. **`verify-purchase` edge function has NEVER been called** in production — zero logs, zero entries in analytics
2. The function itself works correctly (tested just now with a fake order — returns 400 as expected)
3. The `purchases` table only has test entries (amount_ils: 0)
4. No errors in `error_logs` related to purchases
5. PayPal is correctly configured for **live mode** (client ID `AffM7i...`, `PAYPAL_SANDBOX = false`)

### Root Cause
The problem is in `PayPalButton.tsx` line 96-104. The `onApprove` callback calls `actions.order.capture()` and if that throws (which can happen if PayPal auto-captures the order, or if there's a network hiccup during the popup-to-app transition), the error is caught and `onError` is called — but by then **the money has already been charged**. The user's payment succeeds on PayPal's end, but the app never calls `verify-purchase`.

Additionally, if `actions.order.capture()` throws, the `callbacksRef.current.onSuccess(orderId)` line never executes, so `handlePayPalSuccess` is never called, and the purchase is lost.

### Fix Plan

**File: `src/components/paywall/PayPalButton.tsx`**

1. **Wrap `actions.order.capture()` with retry and fallback** — if capture fails (order already captured), still extract the order ID and call `onSuccess`
2. **Add detailed console logging** before and after each step so future issues are diagnosable

**Specific change in `onApprove`:**
```typescript
onApprove: async (data: any, actions: any) => {
  try {
    console.log('[PayPal] onApprove fired, orderId:', data.orderID);
    try {
      await actions.order.capture();
      console.log('[PayPal] Capture succeeded');
    } catch (captureErr) {
      // Order may already be captured by PayPal — this is OK
      console.warn('[PayPal] Capture call failed (may be pre-captured):', captureErr);
    }
    // Always call onSuccess with the order ID — verify-purchase 
    // will check the actual order status with PayPal's API
    const orderId = data.orderID;
    console.log('[PayPal] Calling onSuccess with orderId:', orderId);
    callbacksRef.current.onSuccess(orderId);
  } catch (err) {
    console.error('[PayPal] onApprove unexpected error:', err);
    callbacksRef.current.onError(err);
  }
},
```

This ensures that even if `actions.order.capture()` throws, the `verify-purchase` edge function is still called. The edge function independently verifies the order status with PayPal's API (`order.status === "COMPLETED"`), so it will correctly handle both pre-captured and just-captured orders.

### What stays the same
- `verify-purchase` edge function — no changes needed, it already verifies order status correctly
- All other payment flows, pricing, dashboard
- No database changes

