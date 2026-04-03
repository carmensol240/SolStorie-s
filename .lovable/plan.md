

## Plan: Admin Shortcut — Skip Onboarding Based on User Role

### Current behavior
In `src/pages/About.tsx` (line 18-22), logged-in users are redirected to `/adventure`. We need to differentiate based on email.

### Changes — `src/pages/About.tsx` only

Update the existing `useEffect` (lines 18-22) that checks `user`:

```typescript
useEffect(() => {
  if (!loading && user) {
    const ADMIN_EMAILS = ['carmit1901@gmail.com', 'carmit1901+test@gmail.com'];
    if (ADMIN_EMAILS.includes(user.email || '')) {
      navigate("/settings", { replace: true });
    } else {
      navigate("/create", { replace: true });
    }
  }
}, [user, loading, navigate]);
```

- Admin emails → `/settings`
- Other logged-in users → `/create` (skip onboarding, go straight to story creation)
- Not logged in → normal flow (About page shown)

### Files modified
1. `src/pages/About.tsx` — update redirect logic in useEffect

