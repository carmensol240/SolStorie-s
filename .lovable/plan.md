

## Plan: Fix Coloring Page Generation

### Problem
The edge function uses model `google/gemini-2.5-flash-image` which is not in the supported models list. The correct model name is `google/gemini-3.1-flash-image-preview`. Additionally, the image extraction path (`choices[0].message.images[0].image_url.url`) may not match the actual response format — it should also check `choices[0].message.content` for inline base64 image parts.

### Changes

**File: `supabase/functions/generate-coloring-page/index.ts`**

1. **Line 61** — Change model from `"google/gemini-2.5-flash-image"` to `"google/gemini-3.1-flash-image-preview"`

2. **Lines 103-104** — Improve image extraction to handle multiple response formats:
   ```typescript
   const aiData = await aiResponse.json();
   console.log("AI response keys:", JSON.stringify(Object.keys(aiData)));
   
   // Try multiple extraction paths for image data
   let generatedImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
   
   if (!generatedImage) {
     // Check content array for image parts
     const content = aiData.choices?.[0]?.message?.content;
     if (Array.isArray(content)) {
       const imgPart = content.find(p => p.type === "image_url" || p.type === "image");
       generatedImage = imgPart?.image_url?.url || imgPart?.url;
     }
     // Check if content itself is a base64 string
     if (!generatedImage && typeof content === "string" && content.startsWith("data:image")) {
       generatedImage = content;
     }
   }
   ```

3. **Add detailed logging** on line 107 to log the actual response structure when no image is found, to aid future debugging.

### What stays the same
- Client-side code in StoryViewer — unchanged
- Print window HTML — unchanged
- CORS, error handling structure — unchanged

