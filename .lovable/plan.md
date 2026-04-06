

## Plan: Move Navigation Arrows to Top Toolbar (Tablet Only)

### Single file: `src/components/story/OnlineColoringCanvas.tsx`

### 1. Remove floating circle arrows (lines 601-627)
Delete the entire block of the two fixed-position `<button>` elements at the bottom of the component.

### 2. Add arrows inside the top toolbar (line 507, inside the `<div className="flex items-center gap-0.5">`)
After the Trash2 button (line 525), add a divider and two navigation buttons, wrapped in a container that is hidden on mobile:

```tsx
{(canGoPrev || canGoNext) && (
  <div className="hidden md:flex items-center">
    <div className="w-px h-5 bg-white/30 mx-0.5" />
    {canGoPrev && onNavigatePrev && (
      <Button onClick={onNavigatePrev} variant="ghost" size="icon"
        className="text-white hover:bg-white/20 rounded-xl w