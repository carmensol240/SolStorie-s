
# Fix: Edit Story and Gender Swap Not Responding in Library

## Problem
The "Edit Story" and "Gender Swap" options in the dropdown menu don't respond when clicked. This is because they use `onClick` handlers, while Radix UI's `DropdownMenuItem` component works reliably with `onSelect` instead.

The delete menu item already uses `onSelect` correctly -- the edit and gender swap items need the same treatment.

## Changes (1 file)

### `src/components/ui/story-list-item.tsx`

Change the edit and gender swap `DropdownMenuItem` handlers from `onClick` to `onSelect`:

**Before:**
```tsx
<DropdownMenuItem onClick={() => onEdit(id)} ...>
<DropdownMenuItem onClick={() => onGenderSwap(id)} ...>
```

**After:**
```tsx
<DropdownMenuItem onSelect={() => onEdit(id)} ...>
<DropdownMenuItem onSelect={() => onGenderSwap(id)} ...>
```

This aligns them with how Radix UI DropdownMenu is designed to work -- `onSelect` is the proper event for menu item actions, and it fires reliably after the menu closes.
