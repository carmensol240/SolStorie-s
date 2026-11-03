# Redraw Adel's story to match her avatar

Story 3a2d5c15 (Adel). Only this story and this child are touched.

## Current state (checked)
- Child profile: age 1, light brown hair, hair clip, has a saved avatar, same owner as the story.
- Story: not linked to the child, age range 0-2, 8 pictures (8 drawing prompts), no saved outfit.
- No coloring pages from this story yet, so there is nothing to rebuild. If one is created before the redraw finishes, I'll rebuild it.
- The story has 1 print-file access row. It will not be touched.

## Steps
1. **Child profile:** set age = 3, hair color "חום כהה", hair style "קוקו גבוה". No other changes.
2. **Story:** link it to Adel (child_id) and set the age range to 2-4. Text, title, page count and talk questions stay the same.
3. **Clothes:** save the story's fixed outfit as a pink dress so every page uses the same clothes.
4. **Redraw:** redraw the 8 pages one at a time, using the system's own redraw path with Adel's avatar as the face picture. Each page goes through the new check (same girl, Pixar 3D, face visible).
   - If a page passes, the new picture replaces the old one.
   - If a page fails after 2 redraws, the old picture stays and you get an alert and email.
5. **No charge:** redrawing doesn't use credits. I'll confirm the tester's credits are the same before and after.
6. **Report:** check in the drawing log that every one of the 8 pages used a face picture. Then list which pages passed and which kept the old picture.

## Technical details
- Data changes are done with direct updates to `children` (3 fields) and `stories` (child_id, age_range, story_outfit). `stories.story_outfit` is currently null.
- Redraw: call `generate-illustrations` with storyId plus `singlePageNumber` for each illustrated page, using a service call (no user charge). The function finds the avatar through child_id → children.avatar_url. Since every page already has a picture, the new keep-the-old-picture rule applies.
- Page 1 is drawn first, because the other pages compare against it.
- Pages are verified with `illustration_logs` rows created after the start time (had_face_reference, model_used, identity_check). `profiles.story_credits` is compared before and after.
