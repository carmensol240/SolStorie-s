# Coloring window on the story screen: show all pictures

Only the coloring window on the story screen changes. The story reader, the library, prices, credits and access rules stay as they are.

## 1. Always open the picture picker
- Tapping "Coloring" always opens the list of every picture in the story. It no longer jumps straight to the last page made.
- Pictures that already have a coloring page get a small "ready" mark. Picking one goes straight to print / color online, with no wait and no new drawing.
- Other pictures show "tap to create". Picking one and tapping "Continue" makes it as today.

## 2. Clear "choose another picture" button
- On the print / color online screen, the small gray link "← בחרו איור אחר" becomes a normal full-width button (outline style), so parents can see there are more pages.

## Technical details
- StoryViewer.tsx `openColoring`: load all `story_coloring_pages` rows for the story and user (not limit 1). Keep a map from illustration URL to coloring path, and always set `coloringAction='pick'`.
- Picker grid: badge on pictures that are in the map. On "Continue" for a ready picture, set the cached URLs from the map and go to 'choose-action' without calling the function.
- Match pictures by storage path (use getPublicIllustrationUrl on both sides), because saved rows hold full URLs.
- Back link → `<Button variant="outline" className="w-full">`.
- Check in the browser at 390px with an opened story: the picker shows all pictures, the ready mark appears, and the back button works.
