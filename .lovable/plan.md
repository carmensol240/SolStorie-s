# New official Leo, used everywhere

Official Leo: straight black hair, round glasses, red-yellow striped shirt, denim overalls with colorful paint stains, a paintbrush in his hand and one in the overalls pocket, small paint spots on his cheeks. He stays the painter ("הצייר").

## 1. Homepage "הכירו את החבורה"
- `leo-official-face.jpg` gets the same square crop (centered on the face), size and WebP format as the other thumbs, and replaces the old picture (brown messy hair) in `src/assets/cast-thumbs/leo.webp.asset.json`. The other four thumbs stay as they are.

## 2. Free gang coloring pages (/coloring-gang)
- Only one page shows Leo: `src/assets/coloring-gang/leo.png.asset.json` (today it's the old brown-haired Leo holding a crayon and a brush). It gets remade from `leo-official-full.jpg` as clean black-and-white line art: same painting-studio setting, same thickness and A4 layout as the other pages, glasses, straight hair, brush in his hand and in his pocket. The "ליאו" caption and the footer stay the same.
- The Sol, Ben, Mia and Zoe pages stay as they are. I'll show you the new page before it goes live.

## 3. Other places with the old Leo (the list you asked for)
The old brown-haired Leo (`src/assets/cast-leo-science.jpg`) is used in 4 places:
- Profile page: the "ליאו" avatar choice (`Profile.tsx`)
- Wizard topic card hero picture (`topic-data.ts`)
- Waiting screen, the "ליאו מכין" card (`GeneratingStep.tsx`)
- Puzzle game in the waiting screen (`PuzzleGame.tsx`)

Fix: one new picture made from `leo-official-full.jpg` in the same painting-studio scene and the same wide shape, saved as a new image. All 4 places use it. The old file is removed.

Already show the glasses Leo, so they stay as they are:
- Group forest picture used in the demo story (`cast-group-forest.png`)
- "Goodbye" picture at the end of the reader (`cast-waving-farewell.png`)
- Waiting screen gang picture (`generating-hero-cast.jpeg`)
These pictures have no paint stains or brush. If you want them redrawn too, tell me.

Share images: the site preview image and the story share images don't show Leo, so nothing changes there.

## 4. One Leo description
In `supabase/functions/_shared/style-config.ts`:
- Add a single `LEO_DESCRIPTION` that matches the pictures (black straight hair, round glasses, light warm skin, small paint spots on cheeks, red-yellow striped shirt, denim overalls with colorful paint stains, a paintbrush in his hand and one in the overalls pocket, red sneakers, 7-8 years old, the gang's painter).
- `CAST_DESCRIPTIONS.leo` and `CHARACTER_CARDS.leo` both use it, so the conflicting description goes away. Illustrations (generate-illustrations), redraws (retry-illustration) and topic/cover pictures (generate-topic-images-batch) already read these two, so they all get the same Leo. Coloring pages are made from the story picture, so they follow it.

## 5. Leo reference picture
- Upload `leo-official-full.jpg` to our current public `topic-images` storage as `cast/leo-official-full.jpg`.
- Replace `CHARACTER_BASE_REFS` (it points at the old project that no longer exists) with `LEO_REF_URL`. Remove the dead `xqoxox…` links for Leo. I'll leave Sol/Mia/Zoe/Ben/mom links out of use too (they are never sent today).
- In generate-illustrations and retry-illustration: when the Leo check matches a page (the same name check used for the description, and skipped when the hero child is named Leo), add Leo's picture as an extra reference image after the hero's face pictures. It's labeled "LEO — identity only: face, hair, glasses, clothes. Never copy pose, layout or background. This is NOT the main character." The hero's face pictures stay first and are never changed.
- If the Leo picture can't be loaded, the page is drawn from the text description only, exactly like today. It never blocks a page and never costs anything.

## Sol, Mia, Zoe: the differences (not changed yet)

| | CAST_DESCRIPTIONS | CHARACTER_CARDS | Homepage picture matches |
|---|---|---|---|
| Sol | 4 years old, olive skin, freckles, high bun with pink scrunchie, light-blue tee with gold star, red cape, purple pants, white sneakers | 7-8, ponytail, blue superhero suit with gold star, red cape, gold belt, red gloves and boots (plus a separate casual version) | CHARACTER_CARDS (blue-red suit with star, ponytail, pink scrunchie) |
| Mia | smooth brown bob, small flower crown, green dress | 6-7, short curly hair in a loose bun, WHITE DAISY crown, green embroidered dress, white sneakers | CHARACTER_CARDS (curly bun, white daisy crown) |
| Zoe | black curls, light-blue headband, purple-yellow tracksuit | 7-8, wild dark-brown curls, dark skin, backwards black cap + light-blue headband, red/yellow/purple tracksuit, orange sneakers | Mostly CHARACTER_CARDS (headband, red/yellow/purple tracksuit, ball). No cap in the picture. |

## Not changed
The hero child's face pipeline and its order, payments, credits, prices, other characters' pictures and coloring pages, print PDF.

## Files and pictures that change
- Pictures: `src/assets/cast-thumbs/leo.webp.asset.json` (new face), `src/assets/coloring-gang/leo.png.asset.json` (new line art), a new Leo studio picture that replaces `src/assets/cast-leo-science.jpg`, and a new storage file `topic-images/cast/leo-official-full.jpg`
- Code: `Profile.tsx`, `topic-data.ts`, `GeneratingStep.tsx`, `PuzzleGame.tsx` (import only), `_shared/style-config.ts`, `generate-illustrations/index.ts`, `retry-illustration/index.ts`, plus a short rule in `supabase/functions/AGENTS.md`
- Tests: one small test checking that both Leo descriptions are the same text, include glasses and black hair, and don't include "brown hair"

## Checks
Phone screenshots of the homepage gang row and /coloring-gang, the new coloring page at full size, and a single-page redraw on a test-account story that names Leo, to confirm the reference picture is sent and Leo looks right.
