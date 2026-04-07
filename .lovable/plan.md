

## Plan: Fix PayPal Payment Screen — Remove Duplicates, Remove Shipping, Save User Details

### Problem
1. "ניתן לשלם באשראי ללא חשבון פייפאל" appears multiple times: once inside `PayPalButton.tsx` component (line 228-235) AND once per PayPal section in `Upgrade.tsx` (lines 528, 663, 730, 786), plus a standalone glass box (lines 738-744).
2. PayPal checkout shows address/shipping fields — inappropriate for digital product.
3. User details (name, phone, email) are not saved/restored.

### Changes

**File 1: `src/components/paywall/PayPalButton.tsx`**

**1a. Remove the credit card note from inside the component** (lines 227-235)
Delete the entire `{!isLoading && buttonsRendered && (...)}` block that shows "ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל". Each caller in `Upgrade.tsx` already has its own note — removing from the component eliminates the duplication.

**1b. Add `no_shipping` to PayPal order** (line 100-107)
Add `application_context: { shipping_preference: 'NO_SHIPPING' }` to the `actions.order.create()` call to remove all address/shipping fields from PayPal's checkout:
```ts
return actions.order.create({
  purchase_units: [{
    amount: { value: amount.toString(), currency_code: 'ILS' }
  }],
  application_context: {
    shipping_preference: 'NO_SHIPPING'
  }
});
```

**File 2: `src/pages/Upgrade.tsx`**

**2a. Remove duplicate credit card notes per section**
Remove the "💳 ניתן לשלם..." line from these sections (keep only the standalone glass box on lines 738-744):
- Line 528 (educator section)
- Line 663 (coloring kit section)
- Line 730 (edit kit section)
- Line 786 (story package section)

This leaves exactly ONE credit card note — the prominent glass box.

**2b. Save user details to profiles** — No changes needed here. The user's name and email already exist in auth and profiles. Phone is not collected in our app (PayPal handles payment details). There are no custom form fields in our purchase flow to save — the user clicks a package and goes straight to PayPal's hosted checkout.

### What stays the same
- All design, colors, layout, buttons
- All purchase logic and flows
- No database changes needed
- No other files changed

