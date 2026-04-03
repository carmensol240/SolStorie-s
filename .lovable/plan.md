

## Plan: Fix Google Button Text Color & Inline Avatar Generation

### Issue 1: Google button text invisible
The Google sign-in button in `GeneratingStep.tsx` (line 760) uses `text-foreground`. While this should be dark, the user reports it appears white. Fix by using an explicit dark color.

### Issue 2: Avatar generation in separate dialog
Currently clicking "צור אווטאר" opens `AvatarPreviewDialog` as a modal. The user wants avatar generation to happen inline within the photo box — showing the generating state and result side-by-side with the original photo, without opening a separate dialog.

### Changes

#### 1. `src/components/wizard/GeneratingStep.tsx` — Fix Google button text color
- Line 760: Change `text-foreground` to `text-gray-800` for explicit dark text that won't be affected by theme

#### 2. `src/components/wizard/ChildInfoStep.tsx` — Inline avatar generation

**Remove dialog usage:**
- Remove the `AvatarPreviewDialog` component rendering (lines 916-928)
- Remove `avatarPreviewOpen` and `pendingPhotoForAvatar` states
- Remove `AvatarPreviewDialog` import

**Add inline avatar generation:**
- Add `isGeneratingAvatar` state to track generation in progress
- When "צור אווטאר" button is clicked (line 809-817), instead of opening dialog, call the `preview-child-avatar` edge function directly inline
- During generation, show a loading spinner in the avatar slot (right side of the side-by-side view)
- On success, set `formData.childAvatarUrl` with the result — the existing side-by-side layout (lines 714-744) already handles display
- Keep the "עדכן אווטאר" button (lines 819-832) working the same way but inline
- Keep the regeneration count logic (from existing `avatarRegenerationCount` state)
- Keep the "מחק" button as-is

**Inline flow in the photo box:**
- Photo uploaded, no avatar → show single photo + "צור אווטאר" button
- Generating avatar → show original photo on left + spinner on right (side-by-side)
- Avatar ready → show original photo + avatar side-by-side + "עדכן אווטאר" and "מחק" buttons

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — fix button text color
2. `src/components/wizard/ChildInfoStep.tsx` — inline avatar generation, remove dialog

