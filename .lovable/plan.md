

## Plan: Generate Sol's Cutlery Topic Thumbnail

### Overview
Add "eating-with-cutlery" to the `generate-topic-images` edge function with a detailed Sol-specific Pixar prompt, then invoke it to generate the image and upload it to the `topic-images` storage bucket. Finally, update `topic-data.ts` to use the new storage URL instead of the placeholder `topicBraveTaster`.

### Changes

#### 1. `supabase/functions/generate-topic-images/index.ts`
Add a new entry to `TOPIC_PROMPTS`:
```typescript
"eating-with-cutlery": {
  filename: "topic-eating-with-cutlery.png",
  prompt: `High-end cinematic 3D Disney Pixar portrait, 1:1 square aspect ratio.
A 4-year-old girl named Sol with tanned olive skin, dark wavy shoulder-length hair with natural volume, soft freckles across her nose and cheeks, big warm expressive brown eyes with detailed eyelashes and light reflections.
She sits at a small colorful table, proudly and correctly holding a small shiny fork in one hand and a small spoon in the other over a stylized plate of colorful mini pasta pieces. She looks directly at the camera with a confident, proud, happy expression showing her new skill.
Soft warm cinematic golden-hour lighting illuminating her face with gentle rim light. Extremely shallow depth of field with deeply blurred creamy bokeh background of warm indistinct golden lights and blended soft green tones. Intricate detail in hair texture, eyelashes, and eye reflections. Octane render quality, volumetric fog.
Full upper body from waist up, character centered. Ultra high resolution.
Negative prompt: ${NEGATIVE}, eating with hands, messy eating, dirty hands, floating food`
}
```

#### 2. `src/components/wizard/topic-data.ts`
Update the `eating-with-cutlery-edu` topic's `image` from `topicBraveTaster` to the public storage URL:
```typescript
image: "https://qvdwmkxviaqcgmjotsxe.supabase.co/storage/v1/object/public/topic-images/topic-eating-with-cutlery.png"
```

Do the same for `rainbow-power-edu` which also uses `topicBraveTaster` — but only if the user wants (not part of this request).

#### 3. Deploy & invoke
- Deploy the updated `generate-topic-images` edge function
- Call it with `topicIds: ["eating-with-cutlery"]` to generate and upload the image
- The image will be publicly accessible at the storage URL immediately

### Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/generate-topic-images/index.ts` | Add "eating-with-cutlery" prompt entry |
| `src/components/wizard/topic-data.ts` | Point `eating-with-cutlery-edu` image to storage URL |

Edge function deployment + invocation required.

