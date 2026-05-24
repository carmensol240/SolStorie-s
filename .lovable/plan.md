## Changes to `src/pages/Upgrade.tsx` (mode=single only)

### 1. Remove user-details save from single-story success handler
Line 186: Remove `await userDetailsRef.current?.saveToProfile();` from `handleSinglePayPalSuccess`.

### 2. Replace single-story PayPal block (lines 547-568)
Remove the `UserDetailsForm` component and the `userDetailsValid` conditional gate. Show `PayPalButton` directly without any form preceding it.

Current:
```tsx
<UserDetailsForm ref={userDetailsRef} onValidChange={setUserDetailsValid} />
{!userDetailsValid && <p className="text-red-400 text-xs text-center mb-2">...</p>}
{userDetailsValid && <PayPalButton ... />}
```

New:
```tsx
<PayPalButton ... />
```

### 3. Fix price display format
Line 552: Change `₪{SINGLE_STORY_PRICE}` to `₪{SINGLE_STORY_PRICE.toFixed(2)}` so it renders as "₪19.90" instead of "₪19.9".

No other code, imports, or package-mode behavior is changed.