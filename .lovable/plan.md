

## Fix: Photo Upload Blocked for Guest Users

### Root Cause
In `src/components/wizard/ChildInfoStep.tsx`, line 186, the `handlePhotoUpload` function has a guard `if (!file || !user) return;` that silently exits when there's no authenticated user. Since the new flow allows unauthenticated users to fill in child details, this blocks photo uploads for guests.

### Fix — `src/components/wizard/ChildInfoStep.tsx`

**Line 186**: Change the guard from:
```typescript
if (!file || !user) return;
```
to:
```typescript
if (!file) return;
```

This is the only change needed. The rest of the upload logic (FileReader, avatar preview dialog) works without authentication. The Supabase-dependent parts (saving to DB) are already gated separately in `handleSaveChildProfile`.

### Files modified
1. `src/components/wizard/ChildInfoStep.tsx` — remove `!user` guard from photo upload handler

