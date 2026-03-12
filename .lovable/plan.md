

## Plan: Generate Pixar-Style Thumbnails for 6 New Topics

### Problem
The 6 new topic images (`src/assets/topic-dinosaurs.jpg`, etc.) were created as placeholder files and don't display correctly. They need proper Pixar-style thumbnails matching the existing topics.

### Approach
Generate thumbnails via an edge function using the Lovable AI Gateway (Gemini image model), upload to the `topic-images` storage bucket, then update `topic-data.ts` to reference the bucket URLs instead of local imports.

### Changes

**1. Create edge function `supabase/functions/generate-topic-images-batch/index.ts`**
- Generates 6 images using `google/gemini-3-pro-image-preview` with Pixar-style prompts from `style-config.ts`
- Uploads each to the `topic-images` bucket as `topic-{id}.png`
- Prompts per topic:
  - **dinosaurs**: Sol playing with friendly colorful dinosaurs in a prehistoric jungle
  - **cardboard-house**: Sol inside a giant cardboard box transformed into a magical castle
  - **candy-alive**: Sol surrounded by dancing candy, lollipops and gummy bears coming alive
  - **talking-toys**: Sol with animated toys (teddy bear, robot, doll) in a moonlit bedroom
  - **farm-animals**: Sol in a sunny farm petting cows, chickens and sheep
  - **unicorn**: Sol riding a sparkling unicorn over a rainbow

**2. Update `src/components/wizard/topic-data.ts`**
- Remove the 6 local image imports (`topicDinosaurs`, `topicCardboardHouse`, etc.)
- Replace with bucket URLs: `${TOPIC_IMAGES_BASE}/topic-{id}.png`
- Update cardboard-house description to: `"קופסת קרטון פשוטה שהופכת לטירה, ספינה או רקטה – הכל תלוי בדמיון!"`

**3. Delete unused local assets**
- Remove `src/assets/topic-dinosaurs.jpg`, `topic-cardboard-house.jpg`, `topic-candy-alive.jpg`, `topic-talking-toys.jpg`, `topic-farm-animals.jpg`, `topic-unicorn.jpg`

### Execution Order
1. Create and deploy the batch generation edge function
2. Invoke it to generate and upload the 6 images
3. Update `topic-data.ts` to use bucket URLs + new description
4. Clean up unused local files

