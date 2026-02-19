

# Transform Categories to Educational Themes

## Overview
Replace character-based categories (Sol, Mia, Leo, Zoe) with educational theme categories, reorganize topics under educational goals, and strengthen the story generation engine to always produce a clear educational takeaway.

## Current State
- 5 categories tied to character names: Sol (heroes), Mia (growing), Leo (imagination), Zoe (adventure), Ben (edu toolbox)
- Character names displayed on banners: "סול | Sol", "מיה | Mia", etc.
- Story generation already has educational value (line 35) but it's described as "subtle"

## Proposed New Categories

| Old | New Hebrew Name | New ID | Focus |
|-----|----------------|--------|-------|
| Sol - גיבורי על | **עולם הערכים** | values | Safety, kindness, inclusion, helping others |
| Mia - גדלים ביחד | **התמודדות ורגשות** | emotions | Emotional milestones, routines, fears, family |
| Leo - ממלכת הדמיון | **דמיון ויצירה** | creativity | Fantasy, imagination, creative adventures |
| Zoe - יוצאים להרפתקה | **סקרנות ומדע** | curiosity | Real-world discovery, nature, travel, experiences |
| Ben - ארגז כלים חינוכי | (merged into above) | -- | Edu topics redistributed into the 4 main categories |

## Changes

### 1. Topic Data Restructure
**File: `src/components/wizard/topic-data.ts`**

- Rename the 4 main sections with educational theme names
- Remove `character` and `characterEn` fields (replace with empty strings or remove from display)
- Merge the "edu" (Ben) category topics into the relevant 4 categories:
  - "emotion-regulation-edu" and "waiting-in-line-edu" move to **התמודדות ורגשות**
  - "self-confidence-edu" and "play-rules-edu" move to **עולם הערכים**
  - "holidays-seasons-edu" moves to **סקרנות ומדע**
- Update `categoryLabel`, `categoryEmoji`, and `id` for each section
- Remove the 5th "edu" section entirely (its topics are now distributed)

New structure:
```
values: עולם הערכים (superheroes, body-safety, road-safety, environment, we-are-special, just-be-me, helping-others, stranger-danger, seatbelt-safety, blood-test, play-rules-edu, self-confidence-edu)

emotions: התמודדות ורגשות (all current "growing" topics + emotion-regulation-edu, waiting-in-line-edu)

creativity: דמיון ויצירה (all current "imagination" topics)

curiosity: סקרנות ומדע (all current "adventure" topics + holidays-seasons-edu)
```

### 2. Remove Character Name Display
**Files: `src/components/home/CategorySection.tsx`, `src/pages/CategoryView.tsx`, `src/components/wizard/TopicStep.tsx`**

- Remove the `{section.character} | {section.characterEn}` line from all banners
- Show only the `categoryLabel` and topic count
- Keep the hero images (they still look good as category banners)

### 3. Update CharacterSection Interface
**File: `src/components/wizard/topic-data.ts`**

- Keep `character` and `characterEn` fields in the interface for backward compatibility but set them to empty strings
- This avoids breaking any code that references these fields

### 4. Update Story Category Mapper
**File: `src/lib/story-category-mapper.ts`**

- Update to handle the new category IDs (values, emotions, creativity, curiosity)
- Existing stories with old category IDs will still map correctly since topic IDs remain unchanged

### 5. Strengthen Educational Takeaway in Story Generation
**File: `supabase/functions/generate-story/index.ts`**

- Update line 35 from "ערך חינוכי עדין" to a stronger mandate:
  "**ערך חינוכי ברור:** כל סיפור חייב להסתיים עם מסר חינוכי ברור או מסר רגשי חיובי שהילד/ה יכול/ה לקחת איתו/ה. המסר חייב להיות משולב בעלילה באופן טבעי -- לא כ'מוסר השכל' חיצוני."
- This ensures every story has a clear educational takeaway or positive emotional message, integrated naturally into the narrative

### 6. Update Color Map
**File: `src/pages/CategoryView.tsx`**

- Update COLOR_MAP keys from old IDs (heroes, growing, imagination, adventure) to new IDs (values, emotions, creativity, curiosity)

## What Stays Unchanged
- All topic IDs remain the same (no database migration needed)
- Hero images remain the same
- Topic images, descriptions, and age ranges stay as-is
- Translation maps (`topic-translations.ts`) unchanged
- Hebrew quality and Meir Shalev style constraints already enforced

## Technical Details

### topic-data.ts category structure (new):
```typescript
{ id: "values", character: "", characterEn: "", categoryLabel: "עולם הערכים", categoryEmoji: "💎", heroImage: castSol, topics: [...] }
{ id: "emotions", character: "", characterEn: "", categoryLabel: "התמודדות ורגשות", categoryEmoji: "🌱", heroImage: castMia, topics: [...] }
{ id: "creativity", character: "", characterEn: "", categoryLabel: "דמיון ויצירה", categoryEmoji: "🎨", heroImage: castLeo, topics: [...] }
{ id: "curiosity", character: "", characterEn: "", categoryLabel: "סקרנות ומדע", categoryEmoji: "🔬", heroImage: castZoe, topics: [...] }
```

### Files to edit:
1. `src/components/wizard/topic-data.ts` -- restructure categories, merge edu topics
2. `src/components/home/CategorySection.tsx` -- remove character name display
3. `src/pages/CategoryView.tsx` -- remove character name display, update COLOR_MAP
4. `src/components/wizard/TopicStep.tsx` -- remove character name display
5. `src/lib/story-category-mapper.ts` -- no changes needed (maps by topic ID, not category ID)
6. `supabase/functions/generate-story/index.ts` -- strengthen educational takeaway rule

### Edge function redeployment:
The `generate-story` function will be redeployed after updating the educational takeaway rule.

