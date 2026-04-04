

## Plan: Add "Coloring Pages" Tab to Library

### Overview
Add a new "דפי צביעה" (Coloring Pages) tab to the Library page that displays all coloring pages the user has generated, allowing them to re-color or re-download them.

### Data Source
The `story_coloring_pages` table already exists with columns: `id`, `story_id`, `user_id`, `illustration_url`, `coloring_image_path`, `created_at`. There are already 10 records. The coloring images are stored in the `story-illustrations` bucket (public).

### Changes — single file: `src/pages/Library.tsx`

1. **Add state for coloring pages** — new `coloringPages` state array, fetched from `story_coloring_pages` where `user_id = user.id`, ordered by `created_at desc`

2. **Add fetch function** — `fetchColoringPages()` that queries the table and joins with `stories` to get `child_name` and `topic` for display labels

3. **Wrap the main stories content in a top-level Tabs component** with two tabs:
   - "📚 סיפורים" (Stories) — current content, unchanged
   - "🎨 דפי צביעה" (Coloring Pages) — new grid of coloring page thumbnails

4. **Coloring pages grid** — simple responsive grid (2 columns on mobile, 3 on desktop) showing each coloring page as a card with:
   - Thumbnail image (from `coloring_image_path` via public URL)
   - Story name + topic label below
   - Two action buttons: "צביעה אונליין" (navigates to story viewer with coloring mode) and "הורדה" (triggers the same blob-download logic)

5. **Empty state** — when no coloring pages exist, show a friendly message with a palette icon

### What stays the same
- All existing story list logic, child tabs, offline filter
- All other pages and components
- The `story_coloring_pages` table (no schema changes)

