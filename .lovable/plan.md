

## Plan: Start Story Generation Immediately for Unauthenticated Users

### Current behavior
For unauthenticated users, generation waits until either:
- User signs up/logs in (then generates as authenticated)
- User clicks "אולי אחר כך" (then generates with `guestMode: true`)

This means the signup form blocks generation, making it feel slow.

### New behavior
Start generation immediately in guest mode while showing the signup form. If user signs up during generation, the story gets claimed to their account afterward. If they don't sign up, the story is still created (unclaimed).

### Changes — `src/components/wizard/GeneratingStep.tsx`

1. **Start generation immediately** (line 448): Change condition from `(user || signupDismissed)` to `(user || signupDismissed || !user)` — effectively always start. Simplify to just `!hasStartedRef.current`.

2. **Always send guestMode for unauthenticated users** (line 199): Change `const isGuest = !user && signupDismissed` to `const isGuest = !user`. This ensures the edge function gets `guestMode: true` even before signup is dismissed.

3. **Remove the signupDismissed useEffect** (lines 474-480): No longer needed since generation starts immediately.

4. **Keep signup form visible**: The form still shows during generation — if user signs up, the `claim-guest-story` flow saves it to their account. No changes to the form UI.

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — 3 small edits to start generation immediately

