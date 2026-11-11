# Making the child look like the avatar on every page (new stories only)

Nothing changes in existing stories. All locked rules stay (Pixar 3D only, cover = the child from the avatar, cover never empty). Clothes chosen in the form still win over the avatar's clothes.

## What I found in Oriel's story (a19bd350)
- **Age:** the profile says 4, the story's age range is "2-4". The child's saved description was written with the age as "2-4", so every drawing instruction says "a boy aged 2-4". The AI picks the middle, so it draws a 3-year-old. The real age (children.age = 4) is used in only one line of the instruction, and only if it was sent with the request.
- **Hair:** the hair color field in the profile is empty. The saved description (written once from the avatar) says "dark brown", so the illustrator draws medium brown. "Almost black" never appears anywhere.
- **Check:** pages 2 onward are compared only to page 1. If page 1 drifted from the avatar, every page follows the drift and still passes.

## What I will change

1. **Real age everywhere**
   - Every drawing instruction takes the age from the child's profile (children.age). The story's age range is used only when the profile has no age.
   - The instruction says "4-year-old", never "2-4".
   - The saved description is not changed. Its age is ignored when building the instruction.

2. **Hair, eyes and skin from the avatar, written the same on every page**
   - When a story starts, the avatar is analysed once more with stricter questions. Hair must be one exact shade from a fixed list ("jet black", "near-black / very dark brown", "dark brown", "medium brown"...), plus eye color and skin tone.
   - These words are saved on the story (new fields) and copied word for word into every page, every redraw and the coloring pages.
   - Order of priority: avatar picture > avatar analysis > hair color from the form > story text. The instruction says outright: "if the text disagrees, follow the avatar picture".
   - Clothes keep their current priority (form wins).

3. **Every page also checked against the avatar**
   - The existing check (with page 1) stays. A second check is added on the same call, with the avatar as a third picture: same face, same apparent age (about 4), same hair shade.
   - A mismatch goes through the same flow as today: one redraw with the reason, then keep the closest picture, mark "needs attention" and alert you.
   - Page 1 keeps its locked rule: checked only against the avatar and never left empty.

## Files
- supabase/functions/_shared/appearance.ts — age taken from the profile; fixed hair-shade list.
- supabase/functions/_shared/avatar-traits.ts (new) — avatar analysis + "avatar wins" text, with tests.
- supabase/functions/_shared/look-check.ts — avatar fields (face, age, hair) added to the check.
- supabase/functions/generate-story/index.ts — sends children.age, saves the traits on the story.
- supabase/functions/generate-illustrations/index.ts and retry-illustration/index.ts — use the saved traits and the real age, send the avatar to the check.
- Database: 3 new optional story fields (hero_hair_shade, hero_eye_color, hero_skin_tone). Old stories keep them empty and work as they do now.
- Tests: real age instead of range; avatar hair beats the text; existing tests (cover-check, camera-framing, look-check) stay unchanged and passing.

## Estimated cost (per new full story, ~6 drawn pages)
- Extra avatar analysis: about 0.3 cents per story.
- Avatar check: on the same call as today, so only one more picture per page — about 0.1-0.2 cents per page, about 1 cent per story.
- Extra redraws when a page doesn't match the avatar: 4-5 cents each. I expect 0-2 per story at the start (often fewer, because the hair/age instruction will be more accurate).
- Total: about 1-11 cents more per story, about 0.1-0.5 credits. No cost for existing stories.

## Verification after approval
- One test taste through the admin test route only if you approve (about 1.5-2 credits), with a report per page: age, hair shade, check result.
