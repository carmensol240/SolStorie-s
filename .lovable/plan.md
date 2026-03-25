

## Plan: Add IDF Military Uniform for Father in "dad-in-reserves" Illustrations

### Problem
When the topic is `"dad-in-reserves"`, the father character has no specific clothing instruction, so he appears in random/inconsistent outfits across illustrations instead of wearing an IDF military uniform.

### Changes

**File: `supabase/functions/generate-illustrations/index.ts`**

1. **Add `"dad-in-reserves"` to `THEME_OUTFITS`** (after `"safe-room-sirens"`, ~line 741):
   ```typescript
   "dad-in-reserves": {
     outfit: "comfortable home clothes",
     background: "warm home environment with family photos and a military bag by the door",
     theme: "emotional family story about father going to military reserves"
   },
   ```

2. **Add father clothing constant and injection logic** (~line 925, after `storyOutfit` is locked):
   ```typescript
   const FATHER_MILITARY_CLOTHING = "father wearing olive green IDF military uniform (madim), army boots, military beret or cap";
   const isDadInReserves = topic === "dad-in-reserves";
   ```

3. **Inject father description into `illustrationPrompt`** inside `generatePageIllustration` (~line 1016, after prompt is built):
   If `isDadInReserves`, append the father clothing description to `illustrationPrompt` whenever the prompt text mentions a father figure (check for keywords: `father`, `dad`, `אב`, `אבא`). If the page prompt mentions the father, append:
   ```
   IMPORTANT: The father character MUST be wearing: olive green IDF military uniform (madim), army boots, military beret or cap. This is consistent across ALL illustrations showing the father.
   ```

### Technical Detail

The injection happens after `buildScenePrompt` or the fallback prompt is determined, by checking if the resolved `illustrationPrompt` (or `page.text`) contains father-related keywords:

```typescript
if