

## Bug Fix: `sequelInstruction` used before initialization

### Root Cause
The error `ReferenceError: Cannot access 'sequelInstruction' before initialization` occurs because:
- `sequelInstruction` is **used** at line 965 inside the user prompt template
- `sequelInstruction` is **defined** at line 1184, after the AI call completes

The sequel logic block (lines 1183-1213) that queries previous stories and builds the sequel instruction needs to run **before** the prompt is constructed, not after.

### Fix
**File: `supabase/functions/generate-story/index.ts`**

1. **Move the sequel logic block** (lines 1183-1213) to just before the prompt construction — around line 837, before `contentFraming` is built. This block queries previous stories for the same child+topic and sets `sequelInstruction` accordingly.

2. The block depends on: `userId`, `topic`, `childId`, `childName`, `supabase` — all of which are already available at that point in the code.

3. Remove the block from its current location (after the AI response parsing at line 1183).

### Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/generate-story/index.ts` | Move sequel logic block (lines 1183-1213) to before prompt construction (~line 837) |

Edge function redeployment required.

