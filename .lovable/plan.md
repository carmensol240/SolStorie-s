# Closer likeness to the avatar + correct picture shape (proposal)

Applies only to new stories (from a new cutoff time) and to redraws you approve. All locked rules stay: cover = avatar, page 1 = the child in a scene, Pixar 3D only, the same child on every page, existing stories untouched, and the locked-rule tests stay.

## Order of work (each step can be tested on its own)
1. **Picture shape (item 4).** This is the cheapest step and fixes Uriel's pages 3–11. Today a landscape book sends no shape instruction at all, and only square books get one. So the model copies the shape of the first picture it receives, and the avatar is tall.
2. **Distinguishing traits (item 2).**
3. **Bigger face (item 3).**
4. **Character sheet (item 1).**
5. **Two drawings per page (item 5).** Only as an option, see below.

## 1. Picture shape
- Every drawing and redraw gets an explicit shape instruction from the story's saved picture shape: landscape 3:2, square 1:1, or portrait. Where the image service allows it, the shape is also requested as a setting, not only in words.
- After each drawing, the server reads the real width and height. A picture in the wrong shape counts as a failed check and gets a corrected redraw, up to the existing limit of 2. After that the previous picture stays and you get an alert. This is a dimension check, not an AI call, so it costs nothing.

## 2. Distinguishing traits
- When the avatar is analysed (this already happens once per story to read hair, eyes and skin), the same request also asks for 5–8 precise traits that set this child apart from a "generic Pixar child". For example: face shape, eyebrows, hair length, direction and parting, ears, nose, freckles or marks.
- The traits are saved once in the story and written into the face paragraph of every page and every redraw. The face check then checks against these traits as well.
- No extra AI call, because it's part of the existing analysis.

## 3. Bigger face
- Today new stories rotate 3 framings: waist-up, knees-up, and three-quarter knees-up, with the hero about half the image height.
- Proposal: waist-up on most pages, about 2 of every 3, and knees-up only when the action needs the body (for example building or running). The hero becomes about 60% of the image height.
- This stays inside locked rule 5: eye level, no bird's-eye or low angle, no wide shot, no face-only close-up. Rule 5 currently says "about half the image height", so this needs your written approval to change it to "about half to 60%". The camera-framing test will be updated to match, never weakened.

## 4. Character sheet
- Made once per new story, before the pages: one landscape picture on a plain light background showing the child from the avatar, in the story's clothes, in Pixar 3D, from 3 views (front, three-quarter, full body).
- It's checked against the avatar for face, age, hair shade and length, eyes and face shape, plus the 3D style check. If it fails, it's redrawn up to 2 times. If it still fails, the story goes on as it does today without a sheet, and you get an alert. It never blocks the story.
- It's saved privately for that story and is not public. Redraws use it too.
- **Reference order for every page (proposal):** 1. the avatar, the only source for the face; 2. the character sheet, for the face from other angles, the clothes and the 3D style; 3. page 1, as today, for clothes and style only; 4. Leo when he's named on the page. I recommend keeping the avatar first and sending it every time, because the sheet is a copy and could drift. The instruction says the sheet is the same child as the avatar.
- Page 1 is drawn after the sheet and uses it too. The cover stays the avatar.

## 5. Two drawings per page (option only)
- Two pictures are drawn for each page, and the check picks the one closer to the avatar.
- Cost: about double per page. My recommendation is not to use it for every story. Use it only for a page whose first drawing failed the face check, instead of a plain redraw. Today's redraw already costs the same, so the extra cost is small.

## Estimated AI cost per new story (6 pictures; estimates, not measured)
- Today: about 6 drawings + checks, roughly 30–60 cents (more when there are redraws).
- Steps 1–3: about the same, because no new AI calls are added. A wrong-shape redraw happens only when a picture comes out the wrong shape.
- Step 4: the sheet adds 1 drawing + 1 check, and up to 2 more drawings if it fails. That's about +5–30 cents per story.
- Step 5 for every page: about +30–60 cents per story. Only on failures (recommended): only when a redraw is needed.

## Build cost in credits (rough estimate)
- Steps 1–3: one build round, about 3–6 credits.
- Step 4: one or two build rounds, about 6–12 credits.
- The test run: about 2–4 credits.
- These are estimates. The actual number depends on how many fixes are needed.

## Test plan before turning it on for everyone (test account only)
- An admin-only temporary test tool, like the earlier Noam test. It writes nothing to any story; images are kept only in a private test folder and deleted afterwards.
- **Uriel:** 2 pages from his story (pages 3 and 5), drawn from his avatar only, read without changing his story. **Noam:** 2 pages from his latest test story.
- Each page is drawn twice, once with the current method and once with the new method (shape + traits + framing + character sheet). Then a side-by-side: avatar, current, new. For each picture I'll report the face-check result, the shape and the number of redraws.
- Test cost: about 8 drawings + 2 sheets, roughly 50 cents–1 dollar.
- After you approve the result, I'll turn it on for new stories only, from a new cutoff time.
- Note: Uriel belongs to a customer account. His avatar is only read, never changed, and nothing is saved to his story. If you prefer, the test can use only Noam.

## Technical details (files)
- `_shared/illustration-format.ts`: shape rules for landscape, square and portrait, plus a size check on the result.
- `_shared/style-check.ts`: shape failure added to the decision; traits added to the face check.
- `_shared/avatar-traits.ts`: extract and save the distinguishing traits (new story column, for example `hero_traits`, through a migration).
- `_shared/illustration-prompt.ts`: traits in the face paragraph; character-sheet block and the new reference order.
- `_shared/camera-framing.ts` + `camera-framing_test.ts`: mostly waist-up framing after a new cutoff time.
- New `_shared/character-sheet.ts` (+ test): draw, check and save to a private storage path; new story column for the sheet path.
- `generate-illustrations/index.ts`, `retry-illustration/index.ts`: make or reuse the sheet, attach it, request the shape, check the size.
- A temporary test function for the comparison, deleted after the test.
