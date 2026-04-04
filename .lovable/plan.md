

## Plan: Let Admin Users See All Screens Like Regular Users

### Problem
In `src/pages/Adventure.tsx` (lines 30-34), there's a redirect that sends **all logged-in users** (including admins) away from the Adventure screen to `/create`:
```tsx
useEffect(() => {
  if (loading || !user) return;
  navigate("/create", { replace: true });
}, [user, loading, navigate]);
```

This means any logged-in user — including carmit1901 and carmit1901+test — never gets to see the Adventure screen.

Additionally, the user might have a stale `returnTo` value in localStorage pointing to `/settings`, which could cause post-login redirects to the Settings page instead of Adventure.

### Solution — single file: `src/pages/Adventure.tsx`

**Remove lines 30-34** — the automatic redirect from Adventure to `/create` for logged-in users. This will allow admin (and all) users to see the Adventure screen when they navigate to `/` or `/adventure`.

The Adventure page already has a CTA button that takes users to `/create` when they're ready, so the redirect is unnecessary.

### What stays the same
- Auth flow and login logic
- Admin detection in Settings, AdminDashboard, AdminReviews
- All other navigation and redirects
- MobileNavigation (home/library/settings tabs)
- Everything else in the app

