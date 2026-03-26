

## Plan: Expand Cover Generation to All Torah Story Topics

### Changes

**File: `supabase/functions/generate-illustrations/index.ts`**

1. **Refactor `generateCoverImage`** to accept a `topic` parameter and use a prompt map:

   Add a `TOPIC_COVER_PROMPTS` map (before the function, ~line 747) with entries for all 10 Torah topics + `dad-in-reserves`:

   ```typescript
   const TOPIC_COVER_PROMPTS: Record<string, string> = {
     "dad-in-reserves": "A heartwarming children's book cover illustration in Pixar 3D CGI style, Israeli soldier father in olive green IDF military uniform (yarok tzava fatigues) hugging his young child warmly, emotional reunion, soft warm cinematic lighting, vibrant saturated colors, Disney-Pixar aesthetic, NOT US military, NOT American military. No text. Leave 20% space at top for title.",
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

2. **Update `generateCoverImage` signature** to accept `topic: string`, look up the prompt from the map, and append `NEGATIVE_PROMPT`. Update the log message to be generic (not "dad-in-reserves" specific).

3. **Update the cover trigger** (~line 1232) to check all topics in the map:
   ```typescript
   const coverPromise = TOPIC_COVER_PROMPTS[topic]
     ? generateCoverImage(supabase, storyId, LOVABLE_API_KEY, topic)
     : Promise.resolve(null);
   ```
   Update the success log similarly.

### What stays the same
All illustration logic, page processing, retry logic, storage paths, DB update pattern.

