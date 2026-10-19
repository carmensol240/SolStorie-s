# Clothing style in the child form: what exists today, and what to fix

Nothing has been changed yet. Sections 1-4 answer your questions. Section 5 is the fix for approval.

## 1. The options that exist today

The form has 6 styles and 6 colors (כחול, ורוד, אדום, ירוק, סגול, צהוב). The exact same English text is sent for a boy and for a girl. The only difference is a separate gender line that is added to every illustration.

| Style in the form | What the illustration gets (boy and girl alike) | What actually happens for a boy | What actually happens for a girl |
|---|---|---|---|
| בגדי יומיום | casual everyday clothes (t-shirt and pants) | OK | OK |
| גיבור/ת על | superhero costume with a cape | OK | OK |
| שמלה | dress | **Conflict:** the gender line forbids dresses for boys, so the picture is unpredictable | OK |
| בגד ים | swimsuit | not specified (could come out as either kind) | not specified |
| פיג'מה | pajamas | OK | OK |
| בגדי חורף | warm winter clothes (coat and scarf) | OK | OK |

The chosen color is added before the style, for example "a blue dress". **There is no style that includes religious items** (kippah, tzitzit, head covering).

## 2. Religious items today

- **Girl:** four separate places forbid a kippah, tzitzit or sidelocks. One of them, in the story-writing instructions, still says "unless the parent asked explicitly", and there is no such option.
- **Boy:** the rule is "secular by default, unless the scene asks for it". So a kippah or tzitzit can still show up even though the parent never chose it, in two cases:
  1. Holiday and Bible topics: the topic picks its own outfit (for example "festive Hanukkah clothes"), and its example even says "a kippah only for boys".
  2. The story text itself describes it ("…puts on a kippah"), and the illustration follows.
- **Conclusion:** a girl never gets a kippah. A boy can get one without the parent choosing it, which does not meet your rule.

## 3. Are the chosen clothes the same on every page?

Mostly yes. The chosen clothes are added word for word to every illustration, retry and coloring page, together with the instruction "the outfit must be exactly as described". There are three gaps:
1. **The topic outfit pushes out the chosen clothes too easily.** The topic outfit replaces the parent's choice on any page whose text contains a word like "לובש/ת" (wears), even when the sentence is about a different piece of clothing or another character.
2. **When nothing is chosen in the form,** a girl without a photo gets the default superhero costume. A boy gets "colorful clothes", with no fixed color, so the clothes can change from page to page.
3. **The color from the saved profile** sometimes reaches the illustration still in Hebrew ("כחול שמלה"), which makes the instruction weaker.

## 4. A future "character card"

Today the character description mixes the face and the clothes into one line (gender, age, hair, outfit). The description taken from the photo also asks for the clothes in the photo. So a card saved as it is today would also save clothes.

## 5. Proposed fix (illustration instructions and form only; no change to stories that already exist)

**A. Religious items only by the parent's choice**
- Since there is no religious style, a fixed rule applies to every illustration, boy and girl: no kippah, tzitzit, sidelocks, head covering, veil or cross. This holds even on holiday and Bible topics, and even if the story text mentions one. Holiday clothes stay festive and secular (colors, a Star of David necklace for a girl, and so on).
- Remove "unless the parent asked" from the girl's rule, and remove the "a kippah only for boys" example from the topic-outfit instructions.
- An automatic test confirms that no instruction ever contains a kippah or tzitzit unless a religious style was chosen. A separate test confirms a girl never gets a kippah under any circumstances.
- If you'd like to add a "מסורתי" (traditional) style in the future, say so. It would add a kippah and tzitzit only for a boy, and something different for a girl (decided by you), and the rule above would then let them through only with that choice.

**B. A style that matches the gender**
- In the form: "שמלה" appears only when a girl is selected. If a parent switches to boy after choosing a dress, the choice resets to "בגדי יומיום".
- The server enforces the same rule: a dress for a boy turns into "everyday clothes" automatically.
- A swimsuit gets separate text: "swim trunks" for a boy, "a one-piece swimsuit" for a girl. Superhero gets "superhero costume (boy)" or "(girl)".

**C. The same clothes on every page**
- The topic outfit replaces the parent's choice only on pages whose text states that the hero changes clothes (pajamas before bed, a raincoat, going into the water). It no longer happens on any page with the word "wears".
- When nothing is chosen: one fixed outfit is decided once per story (for example "a yellow t-shirt and blue jeans") and repeated on every page, for both a boy and a girl. The fixed superhero costume for a girl is removed.
- The color is always translated to English, including when it comes from the saved profile.

**D. Ready for a future character card**
- Split the character description into two separate parts: a "character" part with only face, skin, eyes, hair and body/age, and a "clothes" part that comes from this story's choice.
- The description from the photo is asked for face, skin, eyes and hair only, never the clothes in the photo.
- A test confirms the character part contains no clothes words.

**What you'll see:** girls never get a kippah, and boys get one only if you ever add a traditional style. "שמלה" disappears from the form for boys, and the clothes stay the same on every page.

## Technical details

- `_shared/appearance.ts`: gender-aware `clothingToEnglish(a, gender)`; boy + "שמלה" → everyday; swimsuit/superhero per gender; new `buildCharacterCore()` (face/skin/hair/body) + `buildOutfitLine()`; `buildCharacterLock` composes the two. Narrow `pageMentionsOutfit` to explicit hero clothing-change phrases (מחליף/ה ל…, לובש/ת פיג'מה/מעיל/בגד ים…).
- `_shared/style-config.ts`: `buildGenderHeader` and `GENDER_SYMBOL_RESTRICTION` → strict no-religious-items rule with no scene exception (an `allowReligious` flag stays false until such a style exists).
- generate-illustrations: remove the kippah example from the topic-outfit prompt and add "no religious items"; translate the profile color; default outfit = one fixed neutral outfit per story; vision prompt drops clothing fields.
- generate-story: remove "(unless the parent asked explicitly)"; add "no religious items in the outfit description".
- ChildInfoStep: filter CLOTHING_TYPES by gender and reset on gender change.
- Tests in `src/__tests__/appearance.test.ts`: per-gender text for each style; dress for a boy → everyday; no kippah/tzitzit in any built prompt; girl never kippah; character core has no clothing words; outfit-change detection.
- Deploy generate-illustrations, generate-story, retry-illustration and generate-coloring-page, then publish.
