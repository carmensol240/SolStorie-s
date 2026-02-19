

# Global Language Constraints for Story Generation

## Problem
The current system prompt in `generate-story` contains internal contradictions:
- Line 41 says "שירי ילדים... עם חרוזים וקצב" (children's songs with rhymes and rhythm)
- Lines 83, 110 contain rhyming examples
- Lines 131-135 discuss "logical rhymes" as if rhymes are sometimes allowed
- No explicit rule prohibiting output in non-Hebrew languages (Arabic, English, gibberish)

## Changes

### File: `supabase/functions/generate-story/index.ts`

1. **Add a new top-level constraint: Hebrew-only output**
   - Add to the META-INSTRUCTION block: "OUTPUT MUST BE 100% HEBREW. Any word in Arabic, English, or any other language immediately disqualifies the story."

2. **Fix contradictions in the prompt:**
   - Line 41: Remove "שירי ילדים... עם חרוזים וקצב" and replace with prose-focused language
   - Lines 83-84: Replace rhyming example with a prose-based emotional mirroring example
   - Line 110: Replace rhyming example with a prose-based sensory description example
   - Lines 131-135: Remove the entire "logical rhymes" section (it contradicts the no-rhyming rule)
   - Line 143: Remove "מבחן המשמעות" reference to rhyming

3. **Strengthen the Meir Shalev style reference:**
   - Update the role description to emphasize Meir Shalev's prose style as the primary inspiration
   - Add: "Write in natural, flowing prose inspired by Meir Shalev -- rich, warm, literary, never rhyming"

4. **Add nikud accuracy rule:**
   - Strengthen existing nikud section: "If nikud is used, it MUST be linguistically accurate. Incorrect nikud is worse than no nikud. When in doubt, use a simpler word whose nikud you are certain of."

## Technical Details

All changes are within the `SYSTEM_PROMPT` constant in `supabase/functions/generate-story/index.ts`. No database or schema changes needed. The edge function will be redeployed after editing.

### Specific edits:
- **Line 10**: Add Hebrew-only language constraint to META-INSTRUCTION
- **Line 30**: Update role description to emphasize Meir Shalev prose
- **Line 41**: Replace "שירי ילדים... חרוזים וקצב" with "סיפורי ילדים בפרוזה ספרותית"
- **Lines 83-84**: Replace rhyming example with prose example
- **Line 110**: Replace rhyming example with prose sensory description
- **Lines 131-135**: Delete "חרוזים לוגיים" section entirely
- **Line 143**: Remove rhyme reference from "מבחן המשמעות"
- **Lines 269-272**: Strengthen nikud accuracy requirements
