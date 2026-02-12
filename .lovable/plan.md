

## Plan: Gallery Restructure - 4 Categories, Dynamic Names, New Topics, and AI Images

### Overview
Complete restructuring of the topic gallery from 5 categories to 4, adding 11 new topics, integrating all existing topics, adding dynamic `{childName}` support in labels, and generating consistent gallery images via AI.

---

### 1. New Category Structure

Reorganize all topics (existing + 11 new) into 4 categories:

**A. גיבורי על (Superheroes) -- 7 topics**
- אנחנו גיבורי על (existing)
- שומרי הדרכים (NEW - road safety)
- שומרי כדור הארץ (NEW - environment)
- הלב של {childName} (NEW - helping others)
- הגוף שלי הוא רק שלי (existing: body-safety)
- פשוט להיות אני (existing: just-be-me)
- כולנו מיוחדים ודומים (existing: we-are-special)

**B. גדלים ביחד (Growing Together) -- ~22 topics**
- הקסם שבניסיון (NEW)
- הלילה המיוחד בממלכת סבא וסבתא (NEW)
- צוות מנצח - אהבת אחים (NEW)
- מפתחות הקסם - תודה/בבקשה/סליחה (NEW)
- שומר הסודות (NEW - stranger danger)
- Plus all existing daily-hero, emotion, and social topics: teeth brushing, bath, nails, hand washing, barber, dentist, pacifier, potty training, brave taster, independence, new sibling, fear of dark, lost tooth, pocket kiss, anger cloud, mom don't go, friendship, sharing, birthday, apologize, new house, first day kindergarten, my special family

**C. ממלכת הדמיון (Imagination Kingdom) -- 6 topics**
- הרפתקה במצולות הים (existing: underwater-journey)
- רוקדים בגשם (existing: rain-party)
- טיסה בחלל (existing: space-adventure)
- ממלכת הקסם (existing: magic-kingdom)
- טיול בעננים (existing: cloud-adventure)
- טיול בגן החיות (existing: zoo-adventure)

**D. יוצאים להרפתקה (Adventure Time) -- 5 topics**
- {childName} כובש/ת את השמיים (NEW - flying to vacation)
- מסע ביער הקסום (NEW - magical forest journey)
- החגורה היא חברה (NEW - seatbelt safety)
- טיול משפחתי (existing: family-trip)
- מסיבת יום הולדת (existing: birthday-party -- moved here)

---

### 2. Dynamic `{childName}` in Labels

Topics with `{childName}` in their title will use the child's name from `formData.childName`:
- "הלב של {childName}" -- "הלב של נועה"
- "{childName} כובש/ת את השמיים" -- "נועה כובשת את השמיים" (gender-aware)

Implementation:
- Store raw label templates with `{childName}` placeholder
- Add a `renderLabel` function that replaces `{childName}` with `formData.childName` (or "הילד/ה" if empty)
- Handle gender suffix (כובש/כובשת) based on `formData.childGender`

**File**: `src/components/wizard/TopicStep.tsx`

---

### 3. AI-Generated Gallery Images

Create a backend function to generate consistent gallery images for the 11 new topics using the Lovable AI image generation model.

**Edge Function**: `supabase/functions/generate-topic-images/index.ts`
- Uses `google/gemini-3-pro-image-preview` model for high quality
- Generates one image per new topic with a detailed prompt including Sol/friend character description
- Uploads results to a `topic-images` storage bucket
- Returns the stored paths

**Storage**: Create a `topic-images` public bucket for gallery thumbnails

**Initial approach**: Use the closest existing topic image as a temporary placeholder for each new topic. Then trigger the AI generation function to create proper images. Once generated, the app references the stored image URLs.

**Prompt template** for each image:
```
"3D Disney-Pixar style animation, warm cinematic lighting, magical sparkles.
[Character: Sol - 4-year-old girl with curly brown hair, brown eyes / Boy friend with short dark hair]
wearing [topic-specific outfit].
Scene: [topic-specific background].
Aspect ratio 3:4, child-friendly, vibrant colors."
```

**Files**:
- `supabase/functions/generate-topic-images/index.ts` (new)
- Storage bucket creation via migration

---

### 4. Story Generation Prompt Update

Reinforce the anchoring instruction in `generate-story/index.ts` to emphasize that the selected topic is the binding template (skeleton) for the story.

**File**: `supabase/functions/generate-story/index.ts` (lines 882-887)

Add/update:
```
- הנושא הנבחר הוא התבנית (השלד) המחייבת לסיפור. היצמד לערכי הנושא באדיקות.
- כל סצנה חייבת להיות ספציפית ועשירה סביב הערך שנשלח מבסיס הנתונים.
```

---

### 5. Visual Consistency Notes

- Equal gender distribution: ~half of topic images feature Sol (girl), ~half feature the boy friend
- Character faces and hair remain identical across all images
- Only outfits change per topic (safety vest, green clothes, pajamas, etc.)
- All images maintain the existing 3D Disney-Pixar style

---

### Technical Summary

| Component | Change |
|-----------|--------|
| `TopicStep.tsx` | Restructure to 4 categories, add 11 new topics with logic/descriptions, dynamic `{childName}` rendering, temporary placeholder images |
| `generate-topic-images` edge function | New -- AI image generation for 11 new topic thumbnails |
| Storage | New `topic-images` bucket for generated gallery images |
| `generate-story/index.ts` | Reinforce topic-as-binding-template instruction |
| `supabase/config.toml` | Add new edge function entry |

### Execution Order
1. Database: create storage bucket for topic images
2. Backend: create `generate-topic-images` edge function
3. Frontend: restructure `TopicStep.tsx` with 4 categories, new topics, dynamic names, placeholder images
4. Backend: update story generation prompt
5. Run image generation to replace placeholders

