# Appearance choices (hair, clothes): check results and proposed fix

Nothing has been changed yet. This is the report, plus the fix I suggest.

## 1. Where the hairstyle choice goes

1. The parent taps a hairstyle on the second form screen. It is kept in the form while the parent fills it in.
2. It is saved to the child's profile **only** when the parent taps "Save profile" (or during sign-up in the wizard). If the parent picks a hairstyle and goes on without saving, it is never stored.
3. When the story is created, the choice is **not sent along with the request**. Story writing and picture creation each look the child up again in saved profiles **by name**, and read the hair and clothes from there.
4. If a saved profile is found, the hair choice is added to the story text instructions and to the picture instructions.

## 2. Why the story and pictures ignore it

Several causes add up, in this order of impact:

- **A. It usually never reaches the story at all.** Only 5 of 51 saved child profiles have a hairstyle stored. The choice depends on the profile being saved, and on the name matching exactly. If the name differs, the profile is new and unsaved, or the parent changed the choice after saving, the old value or no value is used.
- **B. Both hair fields are needed.** Hair is only used if hair color **and** hairstyle are both chosen. Picking only "קוקיות" is ignored without any message.
- **C. The child's photo wins.** The photo is sent to the picture service as the face reference. The service tends to copy the hair from the photo (for example loose hair) and pay less attention to the written hairstyle.
- **D. Hebrew words in English instructions.** The picture instructions are in English, but the choice goes in as Hebrew ("חום קוקיות"). The picture service follows this less reliably.
- **E. Clothes are replaced by the story topic.** The picture step first picks a topic outfit (for example space suit, superhero costume) and only uses the parent's clothes if there is no topic outfit. So in practice the clothes choice is almost always ignored in pictures.

## 3. Each appearance choice

| Choice in the form | Story text | Pictures |
|---|---|---|
| Hairstyle | ✅ only if saved in the profile and hair color is also chosen | ⚠️ same condition, then often overridden by the photo |
| Hair color | ✅ only if saved and hairstyle is also chosen | ⚠️ same as hairstyle |
| Clothing type | ✅ only if saved and color is also chosen | ❌ replaced by the topic outfit |
| Clothing color | ✅ only if saved and type is also chosen | ❌ replaced by the topic outfit |
| Skin tone | ❌ no such choice in the form (taken from the photo) | ✅ from the photo |
| Glasses | ❌ no such choice in the form | only if visible in the photo |
| Gender, age | ✅ | ✅ |

## Proposed fix (only after you approve)

1. Send the hair and clothing choices straight from the form with the story request, so they are used even if the profile wasn't saved. Use the saved profile only as a fallback.
2. Use each choice on its own: a hairstyle without a hair color still counts, and the same for clothes.
3. Translate the choices into clear English for the pictures (for example "קוקיות" → "two pigtails") and mark them as required, with a note that hair must follow the parent's choice, not the photo.
4. Use the parent's clothes for every page, ahead of the topic outfit. The topic outfit is used only when no clothes were chosen. If you prefer topic costumes (like a space suit) to win, tell me and I'll keep that.
5. Pass the same choices to "Try again" for page 1, so retries match.
6. Add small tests: the hairstyle alone is used, and the parent's clothes win over the topic outfit.

## Technical details

- Today: `generate-story` (~line 1145) and `generate-illustrations` (~line 1298) both use `children` `.eq("name", childName).maybeSingle()`; neither reads the values from the request. `GeneratingStep` sends no hair/clothing fields.
- AND conditions: `generate-story` 1158/1161, `generate-illustrations` 1345/1352.
- Clothes: `storyOutfit = THEME_OUTFITS[topic] || generateOutfitForTopic(...) || characterProfile.clothingDescription` (~1380–1398).
- Fix touches: `GeneratingStep.tsx` (payload), `generate-story`, `generate-illustrations`, `retry-illustration`, and a new Hebrew→English mapping in `_shared/`. No changes to the form design, the database or pricing.
