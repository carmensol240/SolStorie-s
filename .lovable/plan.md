

## Plan: Fix Learning Topic Bugs + Add Full Body Instruction

### Analysis

After inspecting the code, here's what I found:

**Bug 1 — HEBREW_LETTER_MAP:** The current map (lines 730-736) is **already correct** — it matches exactly what the user provided. No change needed.

**Bug 2 — Topic ID to letter mapping:** The extraction logic on line 722 (`topic.replace('letter-', '').toUpperCase()`) correctly maps `letter-yod` → `YOD`, `letter-alef` → `ALEF`, etc. **Already correct.**

**Addition — Full body shot instruction:** This needs to be added to the learning topic illustration prompts.

### Changes — `supabase/functions/generate-story/index.ts` only

**1. Add full body instruction to learning topic illustration guidelines (lines 1282-1287):**

Append to the existing learning topic illustration block:
```
- Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts.
```

**2. Add full body instruction to last page override (line 1764):**

Append to the last page illustration prompt:
```
Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts.
```

### What stays the same
- HEBREW_LETTER_MAP (already correct)
- Topic-to-letter extraction logic (already correct)
- All other logic untouched

