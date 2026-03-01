

## Plan: Sequel Logic, "What Happens Next?" Button, and Style Confirmation

### Already Implemented (No Changes Needed)
- **Visual Style**: The cinematic 3D Pixar prompt (`STYLE_BLOCK`) was already updated in the last 3 iterations across all edge functions
- **IndexedDB**: Already implemented in `use-offline-storage.ts`
- **PDF Sharing via navigator.share**: Already implemented
- **Cast descriptions**: Already defined (Ben, Zoe, Leo, Mia) in the edge functions
- **Age-based story lengths**: Already enforced in `generate-story`

### Changes Required

#### 1. Sequel Logic in `generate-story` Edge Function
The function currently doesn't pass `child_id` or check for previous stories on the same topic. We need to:

- **Client (`GeneratingStep.tsx`)**: Pass the selected `childId` (from `formData`) to the edge function
- **Edge function (`generate-story/index.ts`)**: 
  - Accept `childId` from the request body
  - Query `stories` table for previous stories with same `user_id` + `child_name` + `topic` (Hebrew)
  - If found, count them and inject a sequel instruction into the prompt: "This is Part N of an ongoing adventure. The child has already experienced [previous topic]. Continue the story in the same world with a NEW adventure."
  - Save `child_id` in the story insert if provided

#### 2. "What Happens Next?" Button in `BookHeader.tsx`
- Add a `Sparkles` icon button next to the PDF download button
- On click/hover, show a `Popover` with the warm Hebrew explanation text
- Label: `📖 אהבתם? בבחירה הבאה באותו נושא, מחכה לכם המשך להרפתקה!`
- Popover content: The warm explanation about sequel continuity

#### 3. Files to Edit

| File | Change |
|------|--------|
| `src/components/wizard/GeneratingStep.tsx` | Pass `childId` to edge function |
| `supabase/functions/generate-story/index.ts` | Accept `childId`, query previous stories, inject sequel prompt, save `child_id` |
| `src/components/story/book-frame/BookHeader.tsx` | Add "What Happens Next?" popover button |

### Technical Details

**Sequel query** (in edge function):
```sql
SELECT id, topic FROM stories 
WHERE user_id = :userId AND child_name = :childName AND topic = :hebrewTopic
ORDER BY created_at ASC
```
If count > 0, inject into `userPrompt`:
```
## 🔄 המשך הרפתקה (חלק ${count + 1})
זהו סיפור המשך! הילד/ה כבר חווה/חוותה הרפתקה קודמת על "${topic}".
צור המשך חדש ומרתק באותו עולם, עם אתגר חדש ותפנית מפתיעה.
אל תחזור על העלילה הקודמת - המשך את המסע קדימה!
```

**"What Happens Next?" button**: Small popover using existing Radix Popover component, placed between the PDF download button and the menu button.

