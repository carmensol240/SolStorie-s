

## Plan: Remove Coloring Upsell Popup

### Single file: `src/pages/StoryViewer.tsx`

1. **Remove the `showColoringUpsell` state** (line 240) and all references to `setShowColoringUpsell`
2. **Remove the AlertDialog block** (lines 2095–2116) — the "רוצים לצבוע איור נוסף?" popup
3. **Remove the AlertDialog imports** if no longer used elsewhere (`AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`)

The upsell toast messages on lines ~1958, ~2006, ~2045 (showing "נגמרו קרדיטים לצביעה") will remain — they are simple non-blocking toasts, not popups.

### What stays the same
- All coloring logic (print, online, generation)
- All other dialogs and UI
- Toast notifications for credit exhaustion

