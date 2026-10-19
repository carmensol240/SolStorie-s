# Correction: a kippah for a boy only when the parent ticks it

Existing stories are not changed.

## The rule
- **Girl:** never a kippah, tzitzit, sidelocks or head covering. Unchanged.
- **Boy:** a kippah only when the parent ticks it in the form. If it isn't ticked, there's no kippah, exactly as now.
- **Tzitzit and sidelocks:** never, for a boy or a girl.

## What changes

1. **Child form:** a "כיפה" checkbox under the clothing choice, shown only when "בן" is selected, with the help text "הכיפה תופיע בכל האיורים בסיפור". Switching to "בת" hides the box and clears the tick.
2. **Saved:** the choice is saved in the child's profile and with each story, so redrawing a page and the coloring pages use the same choice. Existing stories stay "no kippah".
3. **Server enforcement:** a girl never gets a kippah, even if a ticked value arrives.
4. **In the illustration**, when the box is ticked:
   - "a small knitted kippah" is added to the character part (like glasses). Its color is the chosen clothes color, or dark blue if no color was chosen.
   - The color is decided once per story and saved with it.
   - The kippah appears on every page, including pajamas, a swimsuit and the superhero costume.
   - Instead of "uncovered head, hair visible", the character part says "small kippah on the head, hair visible".
   - The general "no religious items" line in the illustration instructions changes to: no kippah unless the character part includes one, and never tzitzit, sidelocks or a head covering. For a girl, it stays an absolute ban.
5. **Story text:** it may mention the kippah only when the box was ticked. Tzitzit and sidelocks are always forbidden. When it isn't ticked, the story-writing instructions stay as they are today.
6. **Not ticked:** everything stays exactly as implemented now (no kippah, uncovered head, holiday symbols as objects in the scene).

## Tests
- Boy, ticked: the character part on every page contains the kippah, in the clothes color or dark blue, including with pajamas, a swimsuit and the superhero costume.
- Boy, not ticked: no kippah, and "uncovered head".
- Girl: never a kippah, even when a ticked value arrives.
- Never tzitzit or sidelocks, in any combination.
- The kippah color stays the same for the same story.

## Technical details
- Migration (additive, nullable/default false): `children.kippah boolean not null default false`; `stories.kippah boolean not null default false`, `stories.kippah_color text`.
- `_shared/appearance.ts`: `Appearance.kippah?: boolean`; `resolveKippah(gender, requested)` → false for girls; `kippahColor(appearance)` → English clothes color or "dark blue"; `buildCharacterCore({..., kippah, kippahColor})` adds "wearing a small knitted {color} kippah" + "small kippah on the head, hair visible", otherwise "uncovered head, hair visible". `buildCharacterLock` passes these through. Keep `RELIGIOUS_STYLES` empty; tzitzit/sidelocks never emitted.
- `_shared/style-config.ts`: `buildGenderHeader(gender, { kippah })`. Boy + kippah → "a small kippah is part of the character and MUST appear on every page; never tzitzit, sidelocks or head covering". Otherwise the current rule. `GENDER_SYMBOL_RESTRICTION`: wording changed to "no kippah unless the CHARACTER LOCK includes one; never tzitzit/sidelocks/head covering".
- CreateStory form state + ChildInfoStep checkbox (boy only, cleared on switch to girl), saved to `children.kippah`. GeneratingStep sends `appearance.kippah`.
- generate-story: merge the request with the saved profile and enforce girl = false. Save `stories.kippah` and `kippah_color`. Add the "may mention the kippah" line only when it's on, and the "tzitzit/sidelocks forbidden" line always.
- generate-illustrations: read the request/profile/story values, enforce gender, pass the kippah into the character lock, the visual anchor text and the gender header. Save `kippah_color` once if missing.
- retry-illustration and generate-coloring-page: read `stories.kippah` and `kippah_color` (falling back to the child profile for older rows: no kippah) and pass them to the character lock and header.
- Tests in `src/__tests__/appearance.test.ts` per the list above.
- Deploy generate-story, generate-illustrations, retry-illustration and generate-coloring-page, then publish.
