

## Plan: Allow Avatar Creation Without Authentication

### Summary
Three changes: (1) Edge function accepts unauthenticated requests using IP-based rate limiting, (2) AvatarPreviewDialog skips session check for guests, (3) GeneratingStep retrieves guest avatar from localStorage after signup.

---

### 1. `supabase/functions/preview-child-avatar/index.ts`

Replace the strict auth block (lines 16-56) with optional auth:
- Try to extract and validate the auth token
- If valid → rate limit by `user.id` (existing behavior)
- If no auth header or invalid → rate limit by client IP instead (use `getClientIP` + `checkRateLimit` with a stricter limit, e.g. 2 per hour)
- Proceed with avatar generation regardless — the AI call and response don't depend on `user_id`

### 2. `src/components/story/AvatarPreviewDialog.tsx`

- Remove the session check guard (lines 72-83) that blocks generation when no session exists
- Remove the 401 retry logic (not needed for guest mode)
- In `handleConfirm`: when `skipStorage` or no user, also save the `previewUrl` to `localStorage` as `guest_avatar_url` before calling `onConfirm`

### 3. `src/components/wizard/GeneratingStep.tsx`

In `saveChildToSupabase` (line 457-474): after inserting the child, check for `guest_avatar_url` in localStorage. If found, update the child's `avatar_url` with it and clear localStorage:
```typescript
const guestAvatar = localStorage.getItem('guest_avatar_url');
if (guestAvatar) {
  // Update the just-inserted child record with the guest avatar
  await supabase.from("children").update({ avatar_url: guestAvatar })
    .eq("user_id", userId).eq("name", formData.childName);
  localStorage.removeItem('guest_avatar_url');
}
```

### Files modified
1. `supabase/functions/preview-child-avatar/index.ts` — optional auth, IP rate limit for guests
2. `src/components/story/AvatarPreviewDialog.tsx` — skip session guard, save to localStorage for guests
3. `src/components/wizard/GeneratingStep.tsx` — retrieve guest avatar after signup

