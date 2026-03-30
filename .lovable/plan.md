

## Plan: Strengthen FULL_BLEED_INSTRUCTION

### Change — `supabase/functions/_shared/style-config.ts` line 10 only

Replace the current `FULL_BLEED_INSTRUCTION` value with the new text:

```typescript
export const FULL_BLEED_INSTRUCTION = `CRITICAL: This must be a PURE ILLUSTRATION with zero UI elements. Shoot as if a professional photographer took this scene in real life - no phone screens, no app interfaces, no screenshots, no device frames anywhere in the image. The image must look like a scene from a Pixar movie, not a screenshot of an app.`;
```

This propagates automatically to `PIXAR_STYLE`, `PIXAR_STYLE_COMPACT`, and all downstream prompts that reference them. No other lines or files touched.

