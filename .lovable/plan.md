

## Plan: Fix Original Photo Not Persisting After Avatar Update

### Root Cause Analysis

Two issues found:

1. **`AvatarPreviewDialog.handleConfirm`** (lines 147-165) updates ONLY `children.avatar_url` in the DB — it does NOT update `children.photo_url`. When a new photo is uploaded and avatar generated, the original photo path should also be saved to the `children` table.

2. **`onConfirm` callback in ChildProfiles** (lines 918-942) saves `pendingAvatarChild.photoUrl` to `child_photos` history, but this value is captured from `child.photo_url` at the moment the avatar dialog opens — which could be stale if the photo was just uploaded. Also, it does NOT call `update` on the `children` table for `photo_url`.

3. **Private bucket display issue**: `child-photos` bucket is private, but file paths are used directly as `<img src>` in multiple places (lines 544, 555, 747) without signed URLs. This causes images to not display, which may look like "reverting."

### Changes

**File: `src/pages/ChildProfiles.tsx`**

1. **In `handleSaveEdit` (line ~420-429)**: Add a `console.log` before the update call to log all fields being sent, confirming `photo_url` is included.

2. **In `handleSaveEdit` after photo upload (line ~396-418)**: After uploading the new photo successfully, if the edit dialog also needs to trigger avatar regeneration, update `pendingAvatarChild` state with the NEW `photoUrl` (not the old one from `editingChild`).

3. **In edit dialog open handler (line ~340-346)**: When setting `editPhotoPreview`, if `child.photo_url` is a Storage path (not base64/URL), fetch a signed URL for display.

4. **In `onConfirm` callback (line ~918-942)**: After saving to `child_photos` history, also ensure `children.photo_url` is up to date by NOT overwriting it — verify the `AvatarPreviewDialog.handleConfirm` doesn't reset it.

**File: `src/components/story/AvatarPreviewDialog.tsx`**

5. **In `handleConfirm` (around line 160)**: The `update` call currently sets only `{ avatar_url: fileName }`. This is correct — it should NOT touch `photo_url`. But add a `console.log` to confirm what's being sent.

**File: `src/pages/ChildProfiles.tsx` (display)**

6. **For private bucket images** (lines 541-557): Add signed URL fetching for `child.photo_url` and `child.avatar_url` when they are Storage paths (not base64/http URLs). Use `supabase.storage.from('child-photos').createSignedUrl()`.

### What stays the same
- Photo upload logic, avatar generation, Storage structure, history tracking, all other components.

