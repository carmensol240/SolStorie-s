Apply the same lock-indicator pattern (already used for PDF) to the coloring pages icon in the book header.

## Changes

### `src/components/story/book-frame/BookHeader.tsx`
- Add `coloringLocked?: boolean` to `BookHeaderProps`, destructured with default `false`.
- In the "Coloring Pages Shortcut" Tooltip block (around line 181):
  - Wrap `<Palette />` in a `relative inline-flex` span; when `coloringLocked`, overlay a small `<Lock />` badge in the corner with the same styling used for the PDF lock (`absolute -top-1 -left-1 w-3.5 h-3.5 bg-white rounded-full p-[1px] text-slate-700 shadow-sm`).
  - When `coloringLocked`, change the `TooltipContent` text from `דפי צביעה` to `שדרגו לחבילת דפי הצביעה`.
- Keep `onClick={onColoring}` unchanged so the click flow stays the parent's responsibility.

### `src/pages/StoryViewer.tsx`
- Derive `canUseColoring` using the same entitlement check as `canDownloadPdf`:
  ```ts
  const canUseColoring = !!user && (
    hasPdfEntitlement || isSubscriberUser || isAdminUser || isTester
  ) && !isForcedDemo;
  ```
  (place it right after `canDownloadPdf`).
- Update the `<BookHeader … />` call (around line 1664):
  - Pass `coloringLocked={!canUseColoring}`.
  - Replace `onColoring={guardDemo(() => preloadStoryCachedColoring(null))}` with a wrapper that opens the existing upsell when locked:
    ```ts
    onColoring={() => {
      if (!canUseColoring) { setColoringUpsellOpen(true); return; }
      guardDemo(() => preloadStoryCachedColoring(null))();
    }}
    ```

The existing `ColoringPurchaseModal` (already wired to `coloringUpsellOpen`) acts as the upsell on lock click.

## Out of scope
No changes to coloring credits logic, no changes to the in-flow `setColoringUpsellOpen(true)` triggers downstream (lines 2255, 2369, 2409), no changes to entitlement enforcement on the server.
