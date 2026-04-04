

## Plan: Remove Canvas Fallback, Fix Coloring Page via Lovable AI Gateway

### Problem
The Gemini API returns 429 (quota exceeded) for coloring page generation. When it fails, the client-side Canvas edge detection fallback kicks in, producing ugly, unprofessional results. The user wants clean AI-generated coloring pages only.

### Root Cause
The direct Gemini API (`generativelanguage.googleapis.com`) is hitting quota limits. The Canvas Sobel edge detection fallback was added as a safety net but produces terrible quality.

### Solution
1. **Remove Canvas fallback entirely** — no more ugly edge detection
2. **Switch coloring page generation to Lovable AI Gateway** — same gateway that works for `generate-story`, using image-capable model `google/gemini-3.1-flash-image-preview`
3. **Delete `src/lib/coloring-page-generator.ts`** — no longer needed

### Changes

**1. `supabase/functions/generate-coloring-page/index.ts`**
- Replace direct Gemini API calls with Lovable AI Gateway (`ai.gateway.lovable.dev/v1/chat/completions`)
- Use `LOVABLE_API_KEY` instead of `GEMINI_API_KEY`
- Send illustration as base64 image in OpenAI vision format
- Use model `google/gemini-3.1-flash-image-preview` (supports image output via gateway)
- Keep all caching, credits, storage, and analytics logic unchanged

**2. `src/pages/StoryViewer.tsx`**
- Remove import of `generateColoringPageClientSide`
- Remove both fallback blocks (print + online) that call the Canvas generator
- If API fails, show error toast instead of falling back to Canvas

**3. Delete `src/lib/coloring-page-generator.ts`**
- Remove the entire Canvas edge detection file

### What stays the same
- All caching logic (story_coloring_pages table, storage upload)
- Coloring credits system
- Upsell flow for additional illustrations
- Prompt text and coloring page quality requirements
- Analytics tracking
- Retry logic with exponential backoff

