
## Plan: Add User Details Form with Auto-Save to Profiles

### Overview
Add `first_name`, `last_name`, `phone`, `email` columns to the `profiles` table. Create a user details form that appears above PayPal buttons in the Upgrade page. The form auto-loads saved data and saves new data on payment success.

### 1. Database Migration
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text;
```

### 2. New Component: `src/components/paywall/UserDetailsForm.tsx`
A compact RTL form with 4 fields: first name, last name, phone, email.
- On mount: fetch saved values from `profiles` and pre-fill fields
- Expose current values via a ref or callback so the parent can read them on payment success
- Fields styled to match existing glass card design in Upgrade page
- All fields optional (PayPal handles the actual payment validation)

### 3. Update `src/pages/Upgrade.tsx`
- Import and render `UserDetailsForm` inside each PayPal section (story packages, educator, coloring kit, edit kit) — above the PayPal buttons
- On each `onSuccess` callback, after the existing purchase logic, save the form values to `profiles`:
  ```ts
  await supabase.from('profiles').update({
    first_name, last_name, phone, email
  }).eq('id', user.id);
  ```

### 4. Update `PayPalButton` props
No changes needed — the form lives in the parent (Upgrade.tsx), not inside PayPalButton.

### Files changed
1. **Migration**: Add 4 columns to profiles
2. `src/components/paywall/UserDetailsForm.tsx` — new component
3. `src/pages/Upgrade.tsx` — render form + save on success

### What stays the same
- All existing design, colors, layout, buttons
- PayPal checkout flow
- All other purchase logic
