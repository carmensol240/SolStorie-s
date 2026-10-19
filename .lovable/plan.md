# Correction: a kippah for a boy only when the parent ticks it

Existing stories are not changed.

## The rule
- **Girl:** never a kippah, tzitzit, sidelocks or head covering. Unchanged.
- **Boy:** a kippah only when the parent ticks it in the form. If it isn't ticked, there's no kippah, exactly as now.
- **Tzitzit and sidelocks:** never, for a boy or a girl.

## What changes

1. **Child form:** a "כיפה" checkbox under the clothing choice, shown only when "בן" is selected, with the help text "הכיפה תופיע בכל האיורים בסיפור". Switching to "בת" hides the box and clears the tick.
2. **Saved:** the choice is saved in the child's profile and with each story.
   - **What the parent sends in the form always decides, even when the box is unticked.** The saved profile is used only to pre-fill the checkbox in the form, and the server never merges it.
   - Redrawing a page and the coloring pages read **only the story's own choice**, never the profile. Older stories stay without a kippah even if the parent later ticks it in the profile.
3. **Server enforcement:** a girl never gets a kippah, even if a ticked value arrives.
4. **In the illustration**, when the box is ticked:
   - "a small knitted kippah" is added to the character part (like glasses). Its color is the chosen clothes color, or dark blue if no color was chosen.
   - The color is decided once per story and saved with it.
   - The kippah appears on every page, including pajamas, a swimsuit and the superhero costume.
   - Instead of "uncovered head, hair visible", the character part says "small kippah on the head, hair visible".
   - The general "no religious items" line in the illustration instructions changes to: no kippah unless the character part includes one, and never tzitzit, sidelocks or a head covering. For a girl, it stays an absolute ban.
5. **Story text:** it may mention the kippah only when the box was ticked. Tzitzit and sidelocks are always forbidden.
6. **Not ticked:** everything stays exactly as implemented now (no kippah, uncovered head, holiday symbols as objects in the scene).

## Tests
- Boy, ticked: the character part on every page contains the kippah, in the clothes color or dark blue, including with pajamas, a swimsuit and the superhero costume.
- Boy, not ticked: no kippah, and "uncovered head".
- Girl: never a kippah, even when a ticked value arrives.
- Profile with a kippah + form unticked = no kippah.
- Redrawing a page in an older story after the profile was changed to a kippah = no kippah.
- Never tzitzit or sidelocks, in any combination.
- The kippah color stays the same for the same story.

## Technical details
- Migration (additive): `children.kippah boolean not null default false`; `stories.kippah boolean not null default false`, `stories.kippah_color text`.
- `_shared/appearance.ts`:
  - `kippahForRequest(gender, requestKippah)`: request value only (missing = false), false for girls.
  - `kippahForStory(storyRow)`: story columns only, false for girls.
  - `kippahColor(appearance)`: English clothes color, or "dark blue".
  - `buildCharacterCore({..., kippah, kippahColor})`: with a kippah, adds "wearing a small knitted {color} kippah" and "small kippah on the head, hair visible"; otherwise "uncovered head, hair visible". `buildCharacterLock` passes these through.
  - Tzitzit and sidelocks are never emitted.
- `_shared/style-config.ts`:
  - `buildGenderHeader(gender, { kippah })`: boy with a kippah → "a small kippah is part of the character on every page; never tzitzit, sidelocks or head covering". Otherwise the current rule.
  - `GENDER_SYMBOL_RESTRICTION`: "no kippah unless the CHARACTER LOCK includes one; never tzitzit/sidelocks/head covering".
- Form:
  - CreateStory form state gets `kippah`.
  - ChildInfoStep shows the checkbox for boys only, clears it when switching to girl, pre-fills it from `children.kippah` and saves it there.
  - GeneratingStep sends `appearance.kippah`.
- generate-story: uses only `appearance.kippah` from the request, never `children.kippah`; enforces girl = false; saves `stories.kippah` and `kippah_color`. The "may mention the kippah" line is added only when it's on; the "tzitzit/sidelocks forbidden" line is always added.
- generate-illustrations: reads `stories.kippah` and `kippah_color`, never the profile. Passes them into the character lock, the visual anchor text and the gender header.
- retry-illustration and generate-coloring-page: read only `stories.kippah` and `kippah_color`, with no fallback to the child profile.
- Tests in `src/__tests__/appearance.test.ts`, per the list above.
- Deploy generate-story, generate-illustrations, retry-illustration and generate-coloring-page, then publish.
