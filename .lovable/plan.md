# Avatar likeness: did it really used to be better? (findings, no changes)

## Short answer
Not as a decline over time. The data shows it depends on the child, not the date: children with very distinctive looks (curly hair, big eyes) stay very similar to the avatar, from November 4 to today. Children with ordinary short dark hair (like Uriel) were only moderately similar from the start, including Uriel's first story on November 7.

## What I checked
17 stories have a linked child with an avatar. I looked at the avatar next to the first 4 pictures in 10 of them. I skipped Sol's stories because that profile uses a real child's photo.

| Story | Date | Child | Similarity |
|---|---|---|---|
| 8808e48e | Nov 4 | Mika | Very high: curls, eyes, face |
| ca4c049a | Nov 10 | Mika | Very high, same as Nov 4 |
| 55460219 | Nov 4 | Noam | High: curls and freckles |
| 787b594e | Nov 11 | Noam | High, same as Nov 4 |
| 6c4f8149 | Nov 4 | Shoga | Medium: hair and braid right, face younger and generic |
| 3a2d5c15 | Nov 3 | Adel | Medium: bun right, face generic and cartoonish |
| bcf04228 | Nov 7 | Uriel (first story) | Medium: hair lighter brown and longer than the avatar |
| a19bd350 | Nov 11 | Uriel | Medium, about the same as Nov 7 |
| d396db1c | Nov 3 | Ariel | Low: the "avatar" is a phone screenshot of a real photo, and he was drawn with braids |

## What was sent then (from saved records and code history)
- Model: the same image model (gemini-3-pro-image) on Nov 4, Nov 8 and today.
- Every one of these pictures was recorded as "drawn with a face reference". Before today, the records don't say whether that reference was the avatar or the real photo, and the temporary reference files are deleted after 24 hours, so this part cannot be verified for old stories.
- The instruction changed a lot (49 changes to the drawing code since mid-October), and rules kept being added. But stories made after those changes (Mika Nov 10, Noam Nov 11) are just as similar as on Nov 4, so the longer instruction is not what separates good from bad.

## Most likely cause
1. **The avatar itself.** The model copies standout features well (curls, freckles, a bun) and falls back to a "generic Pixar boy" when the face has nothing standout. Uriel has short, near-black hair and no distinctive mark, so he becomes a lighter-haired, generic boy.
2. **Avatars that aren't real 3D avatars** (Ariel's screenshot, Adel's almost-photo avatar) get poor results.
3. The memory of "almost identical" most likely comes from children like Mika and Noam, not from a better past version of the code.

## What cannot be verified
- For stories before today, whether the avatar or the real photo was sent.
- The exact instruction text that was sent (it isn't saved, only rebuilt from code history).

## Possible next step (only if you approve)
Nothing to build now. If wanted later: save the reference type and the instruction for every picture, so future comparisons can be checked exactly.
