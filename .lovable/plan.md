## Problem

In the current `PayPalButton.tsx`, only the standard PayPal Smart Buttons are rendered (PayPal + a "Debit or Credit Card" button via `enable-funding=card`). When the user clicks the credit card button, nothing visibly happens / no card number, expiry or CVV inputs appear inline.

## Goal

Restore inline credit card input fields (card number, expiry, CVV, cardholder name) inside the payment form so users can pay by card without leaving the page.

## Approach

Use PayPal's **Card Fields** component (`window.paypal.CardFields`) alongside the existing Smart Buttons. This is the supported way to render inline, PCI-compliant card inputs in iframes that the merchant styles but never touches the raw card data.

Only `src/components/paywall/PayPalButton.tsx` will be modified. No other file is touched.

### Changes to `PayPalButton.tsx`

1. **SDK script URL** — add `components=buttons,card-fields` to the SDK src so `window.paypal.CardFields` is available. Keep `enable-funding=card` and existing params.

2. **Render Card Fields** — after the Smart Buttons render, also render a Card Fields instance into a new container below the PayPal buttons:
   - `cardFields.NumberField()` → `#pp-card-number`
   - `cardFields.ExpiryField()` → `#pp-card-expiry`
   - `cardFields.CVVField()` → `#pp-card-cvv`
   - `cardFields.NameField()` → `#pp-card-name`
   - Wire the same `createOrder` / `onApprove` / `onError` handlers used for the buttons (via `callbacksRef`).

3. **Submit button** — add a "שלם בכרטיס אשראי" button below the inputs that calls `cardFields.submit()`. Disable it while submitting; show a spinner.

4. **Layout** — keep RTL, match the existing dark glassy paywall style (white/10 background, white/20 border, rounded). Add a small "או שלמו בכרטיס אשראי" divider between the PayPal buttons and the card fields.

5. **Eligibility fallback** — call `cardFields.isEligible()` first. If false (merchant account not approved for Advanced Card Payments, or buyer region unsupported), hide the inline fields silently and keep the existing card button — current behavior is preserved.

6. **Cleanup** — on unmount / amount change, close the CardFields instance and clear the container, mirroring the existing buttons cleanup.

### Out of scope

- No changes to `GiftCard.tsx`, `Upgrade.tsx`, `verify-purchase` Edge Function, pricing config, or any other file.
- No business-logic changes — `onSuccess` still hands the `orderId` to the parent, which already calls `verify-purchase`.
- No maintenance block changes.

## Verification

- Open Upgrade / GiftCard, click a package → PayPal section shows: Smart Buttons on top, then a divider, then inline card number / expiry / CVV / name inputs and a "שלם בכרטיס אשראי" button.
- Filling the inputs and submitting triggers the same `onApprove` flow as the PayPal button.
- If the merchant account is not eligible for Advanced Card Payments, the inline fields are hidden and the existing card button still works as before.
