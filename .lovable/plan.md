

## Plan: Fix AvatarPreviewDialog Mobile Layout

### Changes (single file: `src/components/story/AvatarPreviewDialog.tsx`)

1. **Line 261** — Add `overflow-hidden` to `DialogContent`:
   ```
   <DialogContent className="sm:max-w-md overflow-hidden" dir="rtl">
   ```

2. **Line 275** — Add `w-full` to the grid container:
   ```
   <div className="grid grid-cols-2 gap-4 w-full">
   ```

3. **Line 279** — Add `w-full` to original photo container (already has `overflow-hidden`):
   ```
   <div className="aspect-square w-full rounded-xl overflow-hidden border-2 border-muted">
   ```

4. **Line 291** — Add `w-full` to avatar container (already has `overflow-hidden`):
   ```
   <div className="aspect-square w-full rounded-xl overflow-hidden border-2 border-primary bg-muted flex items-center justify-center">
   ```

### What stays the same
Everything else — logic, buttons, footer, state management.

