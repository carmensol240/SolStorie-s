

## Plan: Add Color and Shape Topics to Learning Category

### Change — `src/components/wizard/topic-data.ts` line 336

After the `number-10` topic entry (line 336), insert 16 new topic entries before the closing `],` on line 337.

The new topics will use existing imported images as placeholders (matching thematically where possible) and will be grouped under two new subCategories:
- `"🎨 צבעים"` — 9 color topics
- `"🔷 צורות"` — 6 shape topics

Each topic will have `ageRange: "3-6"` and appropriate keywords, consistent with the existing number topics format.

### Image assignments (using existing imports)
Colors: `topicRainParty`, `topicUnderwater`, `topicBirthday`, `topicNatureSecrets`, `topicFamilyTrip`, `topicMagicCastle`, `topicMagicalForest`, `topicCloudAdventure`, `topicFearOfDark`
Shapes: `topicSuperheroes`, `topicZoo`, `topicSpaceHero`, `topicFriendship`, `topicBirthday`, `topicSpaceHero`

### No other files or logic touched.

