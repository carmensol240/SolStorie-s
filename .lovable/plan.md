# Fix: English stories generated in Hebrew + child name being changed

## Root cause

In `supabase/functions/generate-story/index.ts`:

1. **Language bug**: The initial story generation correctly branches on `language === "en"` (line 1225) and uses an English system + user prompt. BUT immediately after, around **line 1734**, a "TEXT QUALITY REWRITE" step runs **unconditionally** with a fully Hebrew rewrite prompt that explicitly instructs the model to "rewrite it in warm, everyday Hebrew". For English stories, this step translates the entire story into Hebrew. The same block also runs the Hebrew `[עמוד X]` page-marker re-parsing on English output.

2. **Name bug**: Neither the Hebrew nor English user prompts contain an explicit "do not change or substitute the child's name" rule. The rewrite step also has no name-preservation rule, and combined with the Hebrew bias it can swap names like `נתאי` → `ניצן`. There is one weak mention at line 1467 that only applies to Bible-story flow.

## Fix (scoped, two edits in one file)

### `supabase/functions/generate-story/index.ts`

**A. Skip the Hebrew rewrite for English stories**
- Wrap the entire `=== TEXT QUALITY REWRITE ===` block (around lines 1734–1853) with `if (language !== "en") { ... }`. English stories already come back in English from the primary generation call — they do not need (and must not get) the Hebrew rewrite pass.

**B. Add an explicit "never change the child's name" rule in both prompts**

In the Hebrew user prompt (around line 1345, right after `- שם: ${childName}`), add:
```
🚨 כלל חובה — שם הילד/ה: השתמש בשם "${childName}" בדיוק כפי שנכתב, אות באות. אסור בהחלט להחליף, לקצר, להאריך, "לתקן", לעברת, או להציע שם חלופי. השם המופיע בכל העמודים, בכותרות ובדיאלוגים חייב להיות "${childName}" בדיוק.
```

In the English user prompt (around line 1302, right after `- Name: ${childName}`), add:
```
🚨 MANDATORY NAME RULE: Use the name "${childName}" EXACTLY as written, letter for letter. Never substitute, shorten, lengthen, "correct", translate, transliterate, or suggest an alternative name. The name appearing on every page, in titles and dialogue, must be exactly "${childName}".
```

**C. Add the same name-preservation rule inside the Hebrew rewrite prompt** (only relevant now for Hebrew stories after fix A), around line 1788 in the `CRITICAL RULES` list:
```
- The child's name in the story is "${childName}". Preserve it EXACTLY as it appears — never replace, shorten, transliterate, or "correct" it.
```

## Out of scope
- No changes to language selection UI, English nikud handling, illustrations pipeline, or any other feature.
- No DB / RLS / edge-config changes.

## Files to edit
- `supabase/functions/generate-story/index.ts` (only)
