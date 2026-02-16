
# Fix: Story Deletion Not Working

## Problem
The "Delete Story" confirmation button doesn't reliably trigger the actual deletion. The `AlertDialogAction` component from Radix UI has internal close-handling behavior that can conflict with `e.preventDefault()` in the `onClick` handler, causing the `confirmDelete` function not to execute properly in some cases.

## Solution
Replace the `AlertDialogAction` approach with a regular `Button` combined with manual dialog close handling. This avoids any conflict with Radix UI's internal event system.

## Changes (1 file)

### `src/components/ui/story-list-item.tsx`

1. Replace the `AlertDialogAction` button in the delete confirmation dialog with a standard `Button` that:
   - Calls the delete function (`onDelete`)
   - Awaits the deletion to complete
   - Then closes the dialog
   
2. Make `confirmDelete` an async function that properly awaits the parent's `onDelete` handler

3. Update the `onDelete` prop type to return `Promise<void>` to support async deletion

The key change in the dialog footer:
```tsx
<AlertDialogFooter className="gap-2 sm:gap-0">
  <AlertDialogCancel>ביטול</AlertDialogCancel>
  <Button
    variant="destructive"
    onClick={async () => {
      await onDelete(id);
      setShowDeleteDialog(false);
    }}
  >
    מחק
  </Button>
</AlertDialogFooter>
```

This bypasses any Radix UI event handling conflicts and ensures the delete operation completes before the dialog closes.

## Technical Details
- The database already has proper CASCADE delete rules on all related tables (story_pages, digital_books, user_story_stats, analytics_events)
- RLS policies correctly allow users to delete their own stories
- The only issue is the UI button not reliably firing the delete call
