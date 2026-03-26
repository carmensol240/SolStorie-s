

## Plan: Expand Cover Generation to ALL Topics

### Scope
Add cover prompts for all ~80 topics in the app. The `TOPIC_COVER_PROMPTS` map currently has 11 entries — it will grow to cover every topic ID from `topic-data.ts`.

### Changes

**File: `supabase/functions/generate-illustrations/index.ts`**

Replace the `TOPIC_COVER_PROMPTS` map (~line 748-760) with a comprehensive version covering all topics. Each prompt follows the same pattern: `"Children's book cover, Pixar 3D CGI style, [scene description], [lighting]. No text. Leave 20% space at top for title."`

The full prompt map (grouped by category):

```typescript
const TOPIC_COVER_PROMPTS: Record<string, string> = {
  // ── Values ──
  "superheroes": "Children's book cover, Pixar 3D CGI style, a brave child standing heroically on a rooftop with a cape flowing in the wind, golden sunset, city skyline. No text. Leave 20% space at top for title.",
  "body-safety": "Children's book cover, Pixar 3D CGI style, a confident child standing tall with arms crossed and a protective shield glowing around them, warm safe colors. No text. Leave 20% space at top for title.",
  "road-safety": "Children's book cover, Pixar 3D CGI style, a child at a crosswalk with a friendly traffic light character, bright sunny day, safe neighborhood. No text. Leave 20% space at top for title.",
  "environment": "Children's book cover, Pixar 3D CGI style, a child planting a tree in a lush green meadow, butterflies and sunshine, Earth glowing in the background. No text. Leave 20% space at top for title.",
  "we-are-special": "Children's book cover, Pixar 3D CGI style, diverse group of children holding hands in a circle, each glowing with a unique color, warm joyful atmosphere. No text. Leave 20% space at top for title.",
  "just-be-me": "Children's book cover, Pixar 3D CGI style, a child looking at their reflection in a magical mirror and smiling proudly, sparkling light around them. No text. Leave 20% space at top for title.",
  "helping-others": "Children's book cover, Pixar 3D CGI style, a child helping another child who fell, warm golden light, playground setting, kind expression. No text. Leave 20% space at top for title.",
  "stranger-danger": "Children's book cover, Pixar 3D CGI style, a child confidently saying no with a glowing protective bubble around them, safe neighborhood. No text. Leave 20% space at top for title.",
  "seatbelt-safety": "Children's book cover, Pixar 3D CGI style, a happy child buckling a seatbelt in a colorful car, friendly car character, sunny road. No text. Leave 20% space at top for title.",
  "blood-test": "Children's book cover, Pixar 3D CGI style, a brave child with a superhero cape getting a gentle blood test, friendly nurse, warm hospital room. No text. Leave 20% space at top for title.",
  "true-friendship": "Children's book cover, Pixar 3D CGI style, two children sitting together under a big tree sharing a moment, golden afternoon light. No text. Leave 20% space at top for title.",
  "accepting-differences": "Children's book cover, Pixar 3D CGI style, children of different appearances laughing together on a colorful playground, warm inclusive atmosphere. No text. Leave 20% space at top for title.",
  "helping-home": "Children's book cover, Pixar 3D CGI style, a child happily helping set a dinner table with family, cozy kitchen, warm lighting. No text. Leave 20% space at top for title.",

  // ── Emotions ──
  "body-hero-teeth": "Children's book cover, Pixar 3D CGI style, a child with a sparkly toothbrush fighting cartoon cavity monsters, bathroom setting, magical sparkles. No text. Leave 20% space at top for title.",
  "body-hero-bath": "Children's book cover, Pixar 3D CGI style, a joyful child in a bathtub surrounded by soap bubbles and rubber ducks, warm bathroom glow. No text. Leave 20% space at top for title.",
  "home-of-love": "Children's book cover, Pixar 3D CGI style, a child hugging a parent in a cozy living room, warm golden light, love hearts floating. No text. Leave 20% space at top for title.",
  "playing-together": "Children's book cover, Pixar 3D CGI style, children playing together in a sunny garden with a ball, green grass, flowers blooming. No text. Leave 20% space at top for title.",
  "body-hero-hands": "Children's book cover, Pixar 3D CGI style, a child washing hands with magical sparkly soap, cartoon germs running away, fun bathroom scene. No text. Leave 20% space at top for title.",
  "potty-training": "Children's book cover, Pixar 3D CGI style, a proud toddler sitting on a colorful potty with a big smile, confetti and stars, celebratory mood. No text. Leave 20% space at top for title.",
  "pacifier-fairy": "Children's book cover, Pixar 3D CGI style, a magical fairy collecting pacifiers in a glowing basket, starry night sky, dreamy atmosphere. No text. Leave 20% space at top for title.",
  "first-day-kindergarten": "Children's book cover, Pixar 3D CGI style, a child with a backpack standing excitedly at a colorful kindergarten entrance, warm morning light. No text. Leave 20% space at top for title.",
  "mom-dont-go": "Children's book cover, Pixar 3D CGI style, a mother hugging a child at the kindergarten door, tender emotional moment, soft warm lighting. No text. Leave 20% space at top for title.",
  "fear-of-dark": "Children's book cover, Pixar 3D CGI style, a child in bed looking up at friendly glowing stars and a smiling moon, cozy bedroom, gentle night light. No text. Leave 20% space at top for title.",
  "friendship-courage": "Children's book cover, Pixar 3D CGI style, two children meeting for the first time in a kindergarten, shy smiles, colorful playground. No text. Leave 20% space at top for title.",
  "sharing": "Children's book cover, Pixar 3D CGI style, two children happily sharing a toy together, warm playground setting, golden afternoon light. No text. Leave 20% space at top for title.",
  "apologize": "Children's book cover, Pixar 3D CGI style, a child extending a hand to another child with a sorry expression, rainbow appearing, reconciliation. No text. Leave 20% space at top for title.",
  "trying-again": "Children's book cover, Pixar 3D CGI style, a determined child building a tall block tower that wobbled before, sparkles of persistence, warm room. No text. Leave 20% space at top for title.",
  "independence": "Children's book cover, Pixar 3D CGI style, a proud child tying their own shoes with a big grin, morning light, bedroom setting. No text. Leave 20% space at top for title.",
  "anger-cloud": "Children's book cover, Pixar 3D CGI style, a child blowing away a dark angry cloud that transforms into a rainbow, emotional transformation scene. No text. Leave 20% space at top for title.",
  "brave-taster": "Children's book cover, Pixar 3D CGI style, a child bravely tasting a colorful plate of new foods, vegetables and fruits smiling, kitchen table. No text. Leave 20% space at top for title.",
  "clean-room": "Children's book cover, Pixar 3D CGI style, a child organizing toys into a magical treasure chest, sparkly clean room, accomplished feeling. No text. Leave 20% space at top for title.",
  "new-house": "Children's book cover, Pixar 3D CGI style, a child looking up at a new house with wonder, moving boxes around, warm welcoming light from windows. No text. Leave 20% space at top for title.",
  "dentist-visit": "Children's book cover, Pixar 3D CGI style, a child sitting in a friendly dentist chair with a kind dentist, bright clean office, reassuring smile. No text. Leave 20% space at top for title.",
  "barber-visit": "Children's book cover, Pixar 3D CGI style, a child sitting in a barber chair with a colorful cape, friendly barber, mirror reflection showing new haircut. No text. Leave 20% space at top for title.",
  "lost-tooth": "Children's book cover, Pixar 3D CGI style, a child holding a tiny tooth with a tooth fairy flying nearby, sparkly magical night scene. No text. Leave 20% space at top for title.",
  "body-hero-nails": "Children's book cover, Pixar 3D CGI style, a child getting nails trimmed with sparkly clean nails glowing, cozy bathroom setting. No text. Leave 20% space at top for title.",
  "new-sibling": "Children's book cover, Pixar 3D CGI style, a child gently touching a newborn baby's hand, nursery room, soft warm light, tender moment. No text. Leave 20% space at top for title.",
  "bedtime-story": "Children's book cover, Pixar 3D CGI style, a parent reading a storybook to a child in a cozy bed, warm lamp light, dreamy stars floating. No text. Leave 20% space at top for title.",
  "pocket-kiss": "Children's book cover, Pixar 3D CGI style, a mother placing a glowing kiss into a child's pocket, magical sparkles, warm morning light. No text. Leave 20% space at top for title.",
  "sibling-love": "Children's book cover, Pixar 3D CGI style, siblings hugging and laughing together, pillow fort in background, warm cozy room. No text. Leave 20% space at top for title.",
  "my-special-family": "Children's book cover, Pixar 3D CGI style, a loving family group hug with warm golden light, cozy home, hearts floating around. No text. Leave 20% space at top for title.",
  "find-a-friend": "Children's book cover, Pixar 3D CGI style, a lonely child on a bench who notices another child approaching with a smile, playground, hopeful golden light. No text. Leave 20% space at top for title.",
  "screen-time": "Children's book cover, Pixar 3D CGI style, a child putting down a tablet and looking out at an exciting colorful world outside the window. No text. Leave 20% space at top for title.",
  "divorce": "Children's book cover, Pixar 3D CGI style, a child standing between two cozy houses connected by a glowing heart bridge, warm twilight sky. No text. Leave 20% space at top for title.",
  "sick-grandparent": "Children's book cover, Pixar 3D CGI style, a child holding a grandparent's hand gently, cozy room with flowers, warm emotional light. No text. Leave 20% space at top for title.",
  "making-mistakes": "Children's book cover, Pixar 3D CGI style, a child looking at a broken vase then looking up with courage, a green sprout growing from the pieces. No text. Leave 20% space at top for title.",
  "crying-is-ok": "Children's book cover, Pixar 3D CGI style, a child with a single tear becoming a rainbow, comforting hug from parent, warm safe atmosphere. No text. Leave 20% space at top for title.",
  "safe-room-sirens": "Children's book cover, Pixar 3D CGI style, a family huddled together safely in a cozy shelter room, warm protective light, sense of togetherness. No text. Leave 20% space at top for title.",
  "dad-in-reserves": "A heartwarming children's book cover illustration in Pixar 3D CGI style, Israeli soldier father in olive green IDF military uniform (yarok tzava fatigues) hugging his young child warmly, emotional reunion, soft warm cinematic lighting, vibrant saturated colors, Disney-Pixar aesthetic, NOT US military, NOT American military. No text. Leave 20% space at top for title.",

  // ── Creativity / Imagination ──
  "zoo-adventure": "Children's book cover, Pixar 3D CGI style, a child surrounded by friendly zoo animals - giraffe, lion cub, monkey, colorful zoo entrance, sunny day. No text. Leave 20% space at top for title.",
  "cloud-adventure": "Children's book cover, Pixar 3D CGI style, a child riding on a fluffy white cloud above a magical landscape, rainbow trails, dreamy sky. No text. Leave 20% space at top for title.",
  "magic-kingdom": "Children's book cover, Pixar 3D CGI style, a child at the gates of a sparkling magical kingdom with towers and a friendly dragon, golden light. No text. Leave 20% space at top for title.",
  "rain-party": "Children's book cover, Pixar 3D CGI style, a child dancing joyfully in the rain with colorful boots and umbrella, puddles splashing, rainbow forming. No text. Leave 20% space at top for title.",
  "underwater": "Children's book cover, Pixar 3D CGI style, a child swimming underwater with colorful tropical fish, coral reefs, sunbeams through water, magical ocean. No text. Leave 20% space at top for title.",
  "magical-forest": "Children's book cover, Pixar 3D CGI style, a child walking through an enchanted forest with glowing mushrooms, talking trees, magical fireflies. No text. Leave 20% space at top for title.",
  "space-adventure": "Children's book cover, Pixar 3D CGI style, a child in a fun spacesuit floating among colorful planets and stars, rocket ship nearby, cosmic adventure. No text. Leave 20% space at top for title.",
  "magic-keys": "Children's book cover, Pixar 3D CGI style, a child holding glowing magical keys in front of mysterious doors, each door showing a different world, fantasy light. No text. Leave 20% space at top for title.",
  "cloud-kingdom": "Children's book cover, Pixar 3D CGI style, a child exploring a kingdom built entirely of clouds, cloud castles and cloud creatures, dreamy pastel sky. No text. Leave 20% space at top for title.",
  "dragon-party": "Children's book cover, Pixar 3D CGI style, a child dancing with friendly colorful dragons at a party, rainbow fire, festive forest clearing. No text. Leave 20% space at top for title.",
  "strange-inventions": "Children's book cover, Pixar 3D CGI style, a child inventor with goggles surrounded by wacky contraptions, gears and springs, creative workshop. No text. Leave 20% space at top for title.",
  "dinosaurs": "Children's book cover, Pixar 3D CGI style, a child riding on a friendly baby dinosaur, prehistoric jungle, volcanic mountains in background, adventure. No text. Leave 20% space at top for title.",
  "cardboard-house": "Children's book cover, Pixar 3D CGI style, a child inside a giant cardboard box transformed into a castle, imagination sparkles, living room. No text. Leave 20% space at top for title.",
  "candy-alive": "Children's book cover, Pixar 3D CGI style, a child surrounded by dancing candy characters - lollipops, gummy bears, chocolate bars - in a candy wonderland. No text. Leave 20% space at top for title.",
  "talking-toys": "Children's book cover, Pixar 3D CGI style, toys coming alive at night - teddy bear, robot and doll having an adventure, moonlit bedroom. No text. Leave 20% space at top for title.",
  "farm-animals": "Children's book cover, Pixar 3D CGI style, a child surrounded by cute farm animals - cow, chicken, sheep, pig - sunny farm, red barn. No text. Leave 20% space at top for title.",
  "unicorn": "Children's book cover, Pixar 3D CGI style, a child riding a sparkling unicorn through a rainbow sky, flower fields below, magical glittering light. No text. Leave 20% space at top for title.",

  // ── Curiosity / Science ──
  "family-trip": "Children's book cover, Pixar 3D CGI style, a happy family hiking on a beautiful nature trail, mountains, blue sky, adventure backpacks. No text. Leave 20% space at top for title.",
  "birthday-party": "Children's book cover, Pixar 3D CGI style, a child blowing out candles on a colorful birthday cake, balloons, confetti, happy friends around. No text. Leave 20% space at top for title.",
  "grandparents-night": "Children's book cover, Pixar 3D CGI style, a child cuddling with grandparents on a cozy couch, warm lamp light, storybook open, cookies on table. No text. Leave 20% space at top for title.",
  "flying-vacation": "Children's book cover, Pixar 3D CGI style, a child excitedly looking out an airplane window at clouds and tiny cities below, golden sunset. No text. Leave 20% space at top for title.",
  "space-journey": "Children's book cover, Pixar 3D CGI style, a child astronaut floating among colorful planets, Saturn's rings, distant galaxies, awe-inspiring cosmos. No text. Leave 20% space at top for title.",
  "nature-secrets": "Children's book cover, Pixar 3D CGI style, a child with a magnifying glass discovering tiny creatures and flowers in a lush forest, golden light. No text. Leave 20% space at top for title.",
  "how-body-works": "Children's book cover, Pixar 3D CGI style, a child looking amazed at a transparent magical view inside the human body, heart beating, colorful organs. No text. Leave 20% space at top for title.",
  "shabbat": "Children's book cover, Pixar 3D CGI style, a family gathered around a Shabbat table with lit candles, challah bread, warm golden glow, cozy Friday evening. No text. Leave 20% space at top for title.",
  "pets": "Children's book cover, Pixar 3D CGI style, a child hugging a cute puppy and kitten together, park setting, warm afternoon light, love and friendship. No text. Leave 20% space at top for title.",
  "cooking": "Children's book cover, Pixar 3D CGI style, a little chef child mixing a bowl with flour on nose, colorful kitchen, ingredients flying playfully. No text. Leave 20% space at top for title.",
  "joy": "Children's book cover, Pixar 3D CGI style, a child jumping joyfully with arms wide open, butterflies and sunshine, pure happiness, vibrant colors. No text. Leave 20% space at top for title.",

  // ── Edu Toolbox ──
  "waiting-in-line-edu": "Children's book cover, Pixar 3D CGI style, children standing patiently in a line, one child smiling knowing their turn is coming, school setting. No text. Leave 20% space at top for title.",
  "emotion-regulation-edu": "Children's book cover, Pixar 3D CGI style, a child taking a deep breath with calming waves of color around them, peaceful transformation. No text. Leave 20% space at top for title.",
  "holidays-seasons-edu": "Children's book cover, Pixar 3D CGI style, four quadrants showing a child in each season - spring flowers, summer sun, autumn leaves, winter snow. No text. Leave 20% space at top for title.",
  "play-rules-edu": "Children's book cover, Pixar 3D CGI style, children playing a board game fairly, taking turns, happy sportsmanship, colorful game pieces. No text. Leave 20% space at top for title.",
  "self-confidence-edu": "Children's book cover, Pixar 3D CGI style, a child standing on a stage with a confident pose, spotlight, cheering audience, golden moment. No text. Leave 20% space at top for title.",
  "honesty-edu": "Children's book cover, Pixar 3D CGI style, a child speaking truthfully with a warm glowing light coming from their heart, gentle honest expression. No text. Leave 20% space at top for title.",
  "cooperation-edu": "Children's book cover, Pixar 3D CGI style, children building something together as a team, each contributing a piece, teamwork, sunny outdoor. No text. Leave 20% space at top for title.",
  "patience-edu": "Children's book cover, Pixar 3D CGI style, a child sitting calmly waiting with a peaceful expression, hourglass with sparkly sand, serene setting. No text. Leave 20% space at top for title.",
  "politeness-edu": "Children's book cover, Pixar 3D CGI style, a child politely holding a door open for others, warm smiles, school hallway, kind gesture. No text. Leave 20% space at top for title.",
  "respecting-elders-edu": "Children's book cover, Pixar 3D CGI style, a child listening attentively to a wise grandparent telling a story, warm living room, respectful moment. No text. Leave 20% space at top for title.",
  "eating-with-cutlery-edu": "Children's book cover, Pixar 3D CGI style, a proud toddler eating neatly with a spoon and fork, sparkly clean cutlery, colorful plate, kitchen table. No text. Leave 20% space at top for title.",
  "rainbow-power-edu": "Children's book cover, Pixar 3D CGI style, a child holding a plate of colorful fruits and vegetables glowing with rainbow superpowers, energetic. No text. Leave 20% space at top for title.",

  // ── Torah Stories (existing, unchanged) ──
  "moses-basket": "Children's book cover, Pixar 3D CGI style, baby Moses in a wicker basket floating on the Nile river, water lilies, soft warm light, magical. No text. Leave 20% space at top for title.",
  "exodus": "Children's book cover, Pixar 3D CGI style, Moses leading Israelites through the parted Red Sea, dramatic golden light, epic biblical scene. No text. Leave 20% space at top for title.",
  "noah-ark": "Children's book cover, Pixar 3D CGI style, Noah's ark with pairs of animals boarding, rainbow in the sky, warm magical light. No text. Leave 20% space at top for title.",
  "joseph-brothers": "Children's book cover, Pixar 3D CGI style, young Joseph wearing a magnificent colorful striped coat, desert sunset, ancient Canaan. No text. Leave 20% space at top for title.",
  "david-goliath": "Children's book cover, Pixar 3D CGI style, young David with a sling facing giant Goliath, dramatic light, ancient Israel. No text. Leave 20% space at top for title.",
  "abraham-sarah": "Children's book cover, Pixar 3D CGI style, Abraham and Sarah under a starry sky in the desert, warm campfire light, ancient times. No text. Leave 20% space at top for title.",
  "jonah-fish": "Children's book cover, Pixar 3D CGI style, Jonah inside a giant whale underwater, magical blue light, dramatic scene. No text. Leave 20% space at top for title.",
  "samson-hero": "Children's book cover, Pixar 3D CGI style, strong Samson with long hair, ancient Philistine setting, dramatic light. No text. Leave 20% space at top for title.",
  "esther-queen": "Children's book cover, Pixar 3D CGI style, Queen Esther in royal Persian palace wearing crown and purple dress, golden light. No text. Leave 20% space at top for title.",
  "hanukkah-miracle": "Children's book cover, Pixar 3D CGI style, golden menorah glowing with magical light in ancient Temple, warm golden atmosphere. No text. Leave 20% space at top for title.",
};
```

The trigger logic (~line 1232) already checks `TOPIC_COVER_PROMPTS[topic]`, so no changes needed there — adding keys to the map automatically activates cover generation for those topics.

### What stays the same
- `generateCoverImage` function logic, storage, DB update — all unchanged
- All illustration logic, page processing, retry logic
- The trigger condition already uses map lookup, so it works automatically

