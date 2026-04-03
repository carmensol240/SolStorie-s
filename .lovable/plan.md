

## Plan: Set /adventure as Entry Point with Terms Checkbox and Smart Flow

### Changes

#### 1. `src/App.tsx` — Change root route to Adventure
- Line 62: Change `<Route path="/" element={<About />} />` to `<Route path="/" element={<Adventure />} />`
- Keep `/about` route pointing to `<About />` (settings page links to it)

#### 2. `src/pages/Adventure.tsx` — Add terms checkbox, admin redirect, smart flow

**Admin redirect (from About.tsx logic):**
Add `useEffect` — if logged-in admin email → navigate to `/settings`; other logged-in users → navigate to `/create`.

**Terms checkbox:**
- Add state `termsAccepted`, initialized from `localStorage.getItem('terms_accepted') === 'true'`
- Above the CTA button, show a checkbox with label: `קראתי ואני מסכימ/ה ל` + link `תנאי השימוש` → `/terms`
- Only show checkbox if terms not already accepted (not in localStorage)
- On check, save `terms_accepted: true` to localStorage
- Disable CTA button when checkbox is visible and unchecked

**Smart CTA flow:**
- Update `handleAdventureCTA`: check `localStorage` for saved children data → if children exist, go to `/create`; if not, go to `/create` (the wizard's first step is child info, so this handles it naturally)

### Files modified
1. `src/App.tsx` — root route points to Adventure
2. `src/pages/Adventure.tsx` — terms checkbox, admin redirect, smart navigation

