

## Plan: Add Phone Validation to UserDetailsForm

### Single file: `src/components/paywall/UserDetailsForm.tsx`

### Changes

**1. Add validation state and helper**
- Add `phoneError` state
- Add `isPhoneValid` function: valid if empty (optional) OR matches `/^05\d{8}$/`
- Validate on every change to `phone`

**2. Add `isValid` to the exposed ref interface**
Update `UserDetailsRef` to include `isValid: () => boolean` so `Upgrade.tsx` can check validity. A phone is valid if it's empty or matches the Israeli format.

**3. Show error message below phone field**
When phone is non-empty and invalid, show red text: `נא להזין מספר טלפון תקין (05XXXXXXXX)`

**4. Restrict input to digits only**
Filter non-digit characters in the phone `onChange`.

### File 2: `src/pages/Upgrade.tsx`

**5. Block PayPal buttons when phone is invalid**
- Add state `const [userDetailsValid, setUserDetailsValid] = useState(true)`
- Add `onValidChange` callback prop to `UserDetailsForm` that reports validity
- Wrap each `PayPalButton` in a condition: if `!userDetailsValid`, show a disabled overlay or hide the PayPal button

Actually, simpler approach: add an `onValidChange?: (valid: boolean) => void` prop to `UserDetailsForm`, call it whenever validity changes. In `Upgrade.tsx`, track this state and conditionally render PayPal buttons only when valid.

### Files changed
1. `src/components/paywall/UserDetailsForm.tsx` — validation logic, error display, expose validity
2. `src/pages/Upgrade.tsx` — track validity, block PayPal when invalid

### What stays the same
- All design, colors, layout
- All purchase logic
- No other files changed

