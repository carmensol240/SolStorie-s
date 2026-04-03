

## Plan: Revert to Login-Required Flow

### What changed
Currently, `GeneratingStep` starts generation immediately for all users (line 467-471), using raw `fetch()` in guest mode for unauthenticated users. This is broken.

### Fix — `src/components/wizard/GeneratingStep.tsx`

**Change 1** (line 467-471): Only start generation if user is authenticated. Show signup form for unauthenticated users and wait for them to log in.

```typescript
// Only start generation for authenticated users
if (!hasStartedRef.current && user) {
  hasStartedRef.current = true;
  generateStory();
}
```

**Change 2** (line 199): Revert `isGuest` to always be `false` since we now require login. Remove the raw `fetch()` guest branch (lines 221-242) — all requests go through `supabase.functions.invoke`.

```typescript
const isGuest = false; // Guest generation disabled temporarily
```

**Change 3** (line 484-491): Re-enable the signup completion trigger — when user signs up during loading, start generation:

```typescript
if (user && !hasStartedRef.current) {
  hasStartedRef.current = true;
  generateStory();
}
```

This means unauthenticated users see the signup form, sign up, then generation starts as an authenticated user — no guest mode issues.

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — require auth before generation, disable guest mode branch

