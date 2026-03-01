

## Plan: Fix Character Likeness, PDF Sharing, Storage Quota, and Cast Consistency

### Issue 1: Character Likeness — Strengthen Face Reference

**Current state**: Using `fal-ai/instant-character` with just `prompt` + `image_url`. The model produces generic results because the prompt is too long and dilutes the face reference.

**Fix in `generate-illustrations/index.ts`, `generate-cover/index.ts`, `retry-illustration/index.ts`**:
- Shorten and restructure the prompt to put the face reference instruction FIRST, before any scene description
- Add explicit instruction: "The main character's face, hair texture, and skin tone MUST be an exact 3D Pixar rendering of the person in the reference photo"
- Remove conflicting character descriptions (e.g. "long dark brown hair in ponytail") when a real photo is provided — the model should derive ALL appearance from the photo
- Keep the cast descriptions (Ben, Zoe, Leo, Mia) concise and clearly marked as secondary/background characters

### Issue 2: PDF Share — Use Native Share API

**Current state**: `exportToPdf()` calls `pdf.save()` which triggers a browser download. On mobile, users can't share via WhatsApp or save to Files.

**Fix in `src/hooks/use-pdf-export.ts`**:
- After generating the PDF blob, check `navigator.canShare` with a File object
- If supported (mobile): use `navigator.share({ files: [pdfFile] })` to open the native share sheet
- If not supported (desktop): fall back to `pdf.save()` for direct download
- This gives mobile users the ability to share via WhatsApp, save to Files, AirDrop, print, etc.

### Issue 3: Fix "Exceeded Quota" localStorage Error

**Current state**: `savedChildren` in localStorage contains `avatar_url` fields with large base64 data URIs. This exceeds the ~5MB localStorage limit.

**Fix in `src/components/wizard/ChildInfoStep.tsx` and `src/pages/ChildProfiles.tsx`**:
- Before saving children data to localStorage, strip `avatar_url` and `photo_url` fields if they contain base64 data URIs (keep only if they're short storage paths or HTTP URLs)
- The avatar data is already persisted in the database — localStorage is only for offline/quick access, so it doesn't need the full base64
- Add a utility function `stripBase64ForStorage()` that removes base64 fields before `setUserData('savedChildren', ...)`

### Issue 4: Cast Consistency

**Current state**: Cast descriptions are already defined in prompts but may get ignored when prompts are too long.

**Fix**: Tighten the cast block in all three edge functions to be more concise and positioned after the main character instruction but before the scene. This is addressed as part of Issue 1's prompt restructuring.

### Files to Modify
1. `supabase/functions/generate-illustrations/index.ts` — Restructure face-reference prompt
2. `supabase/functions/generate-cover/index.ts` — Same prompt fix
3. `supabase/functions/retry-illustration/index.ts` — Same prompt fix
4. `src/hooks/use-pdf-export.ts` — Add `navigator.share()` for mobile
5. `src/components/wizard/ChildInfoStep.tsx` — Strip base64 before localStorage save
6. `src/pages/ChildProfiles.tsx` — Strip base64 before localStorage save

