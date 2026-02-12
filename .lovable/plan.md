

## Plan: Upgrade Topic Gallery Experience

### Overview
Add three enhancements to the topic selection gallery (TopicStep.tsx): "View All" grid toggle per category, a heart/wishlist button on each topic card, and age tags on topic images.

---

### 1. "View All" Button per Category

**What**: Add a "צפה בהכל" button next to each category title. Clicking it toggles the category between carousel mode and a full 2-column grid view.

**How**:
- Add local state `expandedCategories` (Set of category IDs) in `TopicStep`
- Pass `isExpanded` and `onToggleExpand` props to `CategoryCarousel`
- In the category header, add a text button "צפה בהכל" / "סגור" next to the scroll arrows
- When expanded: hide carousel, show a 2-column grid of all topics in that category
- When collapsed: show the existing carousel (default)

**File**: `src/components/wizard/TopicStep.tsx`

---

### 2. Heart/Wishlist on Each Topic Card

**What**: A small heart icon in the top-left corner of each topic card. Tapping it toggles a "liked" state. Liked topics are saved per user in the database.

**How**:

**Database**: Create a `topic_wishlist` table:
- `id` (uuid, PK)
- `user_id` (uuid, not null)
- `topic_id` (text, not null)
- `created_at` (timestamptz, default now())
- Unique constraint on (user_id, topic_id)
- RLS: users can only read/write their own rows

**Frontend**:
- Create a hook `use-topic-wishlist.ts` that fetches and manages wishlist state
- Add `isLiked` and `onToggleLike` props to `TopicCard`
- Render a small Heart icon (lucide) in the top-left corner of the image area
- Filled red heart when liked, outline white heart when not
- Prevent click propagation so tapping the heart doesn't select the topic
- For non-authenticated users: heart click shows a toast prompting login

**Files**: 
- `src/hooks/use-topic-wishlist.ts` (new)
- `src/components/wizard/TopicStep.tsx` (modified)
- Database migration (new table)

---

### 3. Age Tag on Each Topic Card

**What**: A small badge in the bottom-left corner of each topic image showing the recommended age range (e.g., "3-6").

**How**:
- Add `ageLabel` field to the `AdventureTopic` interface (string like "0-2", "3-6", "3-8")
- Add age labels to every topic in `ADVENTURE_CATEGORIES` data
- Render a small semi-transparent badge in the bottom-left corner of the topic card image
- Styling: `bg-black/50 backdrop-blur-sm text-white text-[9px] rounded-full px-1.5 py-0.5`

Suggested age mappings:
- Most daily-hero & emotion topics: "3-6"
- Superheroes, space, underwater: "3-8"
- Pacifier, potty training: "0-3"
- Body safety, apologize, independence: "4-8"

**File**: `src/components/wizard/TopicStep.tsx`

---

### Technical Details

| Component | Change |
|-----------|--------|
| `TopicStep.tsx` | Add expand state, heart props, age labels to data |
| `TopicCard` | Add heart icon (top-left), age badge (bottom-left) |
| `CategoryCarousel` | Add "View All" button, grid mode rendering |
| `use-topic-wishlist.ts` | New hook for wishlist CRUD with optimistic updates |
| Database | New `topic_wishlist` table with RLS policies |

### Design Principles
- Heart icon: white outline by default, filled red when liked, with a scale animation on tap
- Age badge: subtle, non-intrusive, positioned to not overlap with the title at bottom
- "View All" grid: 2 columns, same card style but without the compact carousel constraints
- All text remains in Hebrew, child-friendly aesthetic preserved
- RTL layout maintained throughout

