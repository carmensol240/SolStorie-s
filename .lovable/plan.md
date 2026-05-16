## Goal

In `src/components/story/book-frame/BookHeader.tsx`, make the offline download button (`onSaveOffline`) visible **only on desktop**. Hide it on mobile and do not include it in the mobile overflow dropdown.

## Changes

1. Wrap the existing offline-download `Tooltip` block (the one rendering `Download`/`Check`/`Loader2` from `onSaveOffline`) with `<div className="hidden md:block">` so it's hidden below the `md` breakpoint.
2. In the mobile-only section of the `DropdownMenu` (`md:hidden` items), remove the "שמור לקריאה אופליין" entry if present. Keep the other mobile entries (font size, "מה קורה בהמשך?") untouched.

## Out of scope

- Desktop layout, icons, handlers, and all other toolbar buttons remain unchanged.
- No changes to `StoryViewer.tsx` or any other file.
