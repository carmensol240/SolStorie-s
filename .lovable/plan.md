

## Plan: Remove Admin Redirect to Settings

### Problem
Admin emails (`carmit1901@gmail.com`, `carmit1901+test@gmail.com`) are redirected to `/settings` instead of seeing the normal app flow. The user wants admins to navigate the app like regular users.

### Changes

**1. `src/pages/Adventure.tsx` (line 35-36)**
Remove the admin email check — treat admins the same as any logged-in user (redirect to `/create`):
```ts
// Before:
if (ADMIN_EMAILS.includes(user.email || '')) {
  navigate("/settings", { replace: true });
} else {
  navigate("/create", { replace: true });
}

// After:
navigate("/create", { replace: true });
```
Remove the unused `ADMIN_EMAILS` constant.

**2. `src/pages/About.tsx` (lines 20-25)**
Same fix — remove admin-specific redirect, just redirect all logged-in users to `/create`:
```ts
// Before:
if (ADMIN_EMAILS.includes(user.email || '')) {
  navigate("/settings", { replace: true });
} else {
  navigate("/create", { replace: true });
}

// After:
navigate("/create", { replace: true });
```

### What stays unchanged
- Admin dashboard access (`/admin/dashboard`) still works via direct URL
- Settings page admin features still work when navigated to manually
- Test mode on Upgrade page stays intact

