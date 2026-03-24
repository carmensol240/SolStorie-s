

## Plan: Fix RequireTerms fallback when terms not accepted

### Problem
Lines 84-86 return `null` when `termsChecked` is false after checking completes. The `useEffect` should have navigated to `/onboarding` (line 57), but if the navigation didn't fire (e.g., race condition, error swallowed), the user sees a blank screen.

### Fix
Replace the `return null` fallback (lines 84-86) with an explicit navigation side-effect: when `checking` is done, user exists, but `termsChecked` is false — trigger `navigate('/onboarding')` as a safety net. Keep returning the loading spinner in this state instead of null, so the user never sees a blank screen.

**File: `src/components/RequireTerms.tsx`**, lines 84-86:

```typescript
if (!termsChecked) {
  // Safety net: if we finished checking but terms aren't accepted,
  // redirect to onboarding (the useEffect should have done this already)
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
  navigate(`/onboarding?returnTo=${returnTo}`, { replace: true });
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">מעביר לאישור תנאים...</p>
      </div>
    </div>
  );
}
```

### What stays the same
Everything else — auth check, dev mode bypass, loading state, children rendering.

