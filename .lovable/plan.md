

## Story Series Grouping in Library

### Current State
- There is **no `parent_story_id` column** in the database. Sequels are detected at generation time by querying stories with the same `topic` + `child_name`/`child_id`, ordered by `created_at`.
- The library displays a flat grid of story cards.

### Approach
Rather than adding a `parent_story_id` column (which would require backfilling and changing the generation logic), we group stories client-side using the existing sequel detection logic: **same topic + same child = same series**.

### Plan

**1. Add grouping logic in `Library.tsx`**
- After fetching stories, group them by `(child_id || child_name) + topic` key.
- Groups with 2+ stories become "series collections"; single stories remain as-is.
- Sort each group by `created_at` ascending (Part 1 first).

**2. Create `StorySeriesCard` component**
- Displays the first story's cover as the main thumbnail.
- Shows a `📚 סדרה (3 חלקים)` badge overlay.
- On tap, expands/collapses to reveal all parts below in a vertical list.
- Each part shows `חלק 1`, `חלק 2`, etc. as a small badge.
- Uses Collapsible from Radix for the expand/collapse behavior.

**3. Update `renderStoryList` in `Library.tsx`**
- Iterate over grouped items instead of flat stories.
- Render `StorySeriesCard` for multi-story groups, regular `StoryBookCard` for singles.
- Pass all existing handlers (delete, edit, offline download) through to child cards.

**4. Visual design**
- Series card occupies full width of the 2-column grid (col-span-2) when expanded, single column when collapsed.
- Collapsed: looks like a normal book card but with the series badge.
- Expanded: shows a vertical list of smaller story cards below, each with part number badge.

### No database changes needed
The grouping key is `topic + child` which already exists in the stories table.

