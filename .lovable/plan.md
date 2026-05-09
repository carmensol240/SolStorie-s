## Goal
Restore auto-generation of the Disney avatar immediately after photo upload, regardless of whether the child name has been entered yet.

## Root cause
In `src/components/wizard/ChildInfoStep.tsx` (line ~222), auto-generation is gated behind `if (formData.childName.trim())`. When the user uploads a photo before typing a name, the avatar is not generated and the manual button is shown instead. The `preview-child-avatar` Edge Function only requires `childPhoto` — the name is not needed.

## Change (one line)

`src/components/wizard/ChildInfoStep.tsx`, lines 222–225:

Before:
```ts
// Auto-generate avatar inline if child name exists
if (formData.childName.trim()) {
  generateAvatarInline(photoBase64);
}
```

After:
```ts
// Auto-generate avatar inline immediately after upload
generateAvatarInline(photoBase64);
```

## Out of scope
No changes to `generateAvatarInline`, the manual "create avatar" / "update avatar" buttons (they remain as fallback/regenerate UI), regeneration limit, validation, sizes, or any other behavior.
