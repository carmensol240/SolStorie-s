

## Plan: Generate Cover in Parallel with Illustrations for "dad-in-reserves"

### Change

**File: `supabase/functions/generate-illustrations/index.ts`**

1. **Add `generateCoverImage` helper function** (~line 750, before `serve`):
   - Takes `supabase`, `storyId`, `apiKey` as params
   - Calls Gemini image generation with the specified IDF father-hugging-child cover prompt
   - Uploads the resulting base64 image to `story-illustrations/{storyId}/cover-{timestamp}.png`
   - Updates `stories.cover_url` with the public URL
   - Returns the cover URL or null on failure

2. **Add cover promise before `Promise.all`** (~line 1170, before the illustrations `Promise.all`):
   ```typescript
   const coverPromise = topic === "dad-in-reserves"
     ? generateCoverImage(supabase, storyId, LOVABLE_API_KEY)
     : Promise.resolve(null);
   ```

3. **Include cover in `Promise.all`** (line 1171):
   ```typescript
   const [coverResult, ...illustrationResults] = await Promise.all([
     coverPromise,
     ...pagesToIllustrate.map(page => generatePageIllustration(page))
   ]);
   if (coverResult) console.log(`✅ Cover generated for dad-in-reserves: ${coverResult}`);
   ```

### Cover prompt
```
"A heartwarming children's book cover illustration in Pixar 3D CGI style, Israeli soldier father in olive green IDF military uniform (yarok tzava fatigues) hugging his young child warmly, emotional reunion, soft warm cinematic lighting, vibrant saturated colors, Disney-Pixar aesthetic, NOT US military, NOT American military. No text. Leave 20% space at top for title. NEGATIVE: ${NEGATIVE_PROMPT}"
```

### What stays the same
All illustration logic, existing cover generation via `generate-cover` function (still works independently), page processing, retry logic.

