
# Global Character Reference Update — Visual Consistency Across All Image Generation

## What This Does

Injects mandatory character reference image URLs into every AI image generation call so the model receives the actual visual appearance of each character, not just text descriptions. This eliminates AI "invention" of characters that don't match the canon design.

## Three Files to Update

### 1. `supabase/functions/generate-cover/index.ts`

**Current state:** The cover prompt uses only text descriptions of Sol, Ben, Zoe, Leo, Mia. The AI invents its own interpretation each time.

**Change:** Add the 6 reference image URLs as `image_url` content items in the message alongside the text prompt. The AI model (`gemini-3-pro-image-preview`) supports multi-image input — we can pass multiple reference images + a text instruction in a single message.

**New message structure:**
```
messages: [{
  role: "user",
  content: [
    { type: "image_url", image_url: { url: SOL_CASUAL_URL } },
    { type: "image_url", image_url: { url: SOL_HERO_URL } },
    { type: "image_url", image_url: { url: BEN_URL } },
    { type: "image_url", image_url: { url: ZOE_URL } },
    { type: "image_url", image_url: { url: LEO_URL } },
    { type: "image_url", image_url: { url: MIA_URL } },
    { type: "text", text: coverPrompt }
  ]
}]
```

The cover prompt text will also be updated to explicitly instruct the model:
- "Use the provided reference images as mandatory visual anchors"
- "Match facial features, hair, and skin tone EXACTLY from the references"
- "Zero invented characters — only the 5 listed above"

---

### 2. `supabase/functions/generate-illustrations/index.ts`

**Current state:** The `generateIllustration` function sends only a text prompt (or text + child photo). There are no canonical character references injected — the "cast" characters (Sol, Ben, Zoe, Leo, Mia) are described in text only inside `illustration_prompt`.

**Change:** Define a `CHARACTER_REFERENCES` constant at the top of the file with all 6 URLs. When building the message for `generateIllustration`, append the character reference images before the text prompt.

New logic:
```typescript
const CHARACTER_REFERENCES = [
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/sol%20casual.png",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/sol%20hero.png",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/ben.jpeg",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/zoe.jpeg",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/leo.jpeg",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/mia.jpeg",
];
```

When `childPhoto` exists → message content = `[...characterRefs, childPhotoRef, textInstruction]`

When no `childPhoto` → message content = `[...characterRefs, textInstruction]`

Also add a mandatory instruction block to `enhancedPrompt`:
```
=== MANDATORY CHARACTER REFERENCES ===
Reference images of each character are provided. You MUST match their appearance EXACTLY:
- Sol (casual): first reference image — use for educational/daily-life themes
- Sol (hero): second reference image — use ONLY for fantasy/adventure themes  
- Ben: third reference image — toddler, smaller than Sol
- Zoe: fourth reference image — dark skin, afro, blue headband
- Leo: fifth reference image — round glasses, straight hair
- Mia: sixth reference image — brown bob, green dress
ZERO INVENTION: Do not add characters not shown in these references.
If multiple characters appear in the story text, ALL of them must appear in the same scene.
```

---

### 3. `supabase/functions/retry-illustration/index.ts`

**Current state:** This function uses a simple `stylePrefix` text with no character references at all.

**Change:** Add the same `CHARACTER_REFERENCES` constant and inject them into the message alongside the existing prompt. Same pattern as `generate-illustrations`.

---

## Character Reference URLs (Canonical)

| Character | URL | Usage Rule |
|---|---|---|
| Sol (Casual) | `.../sol%20casual.png` | Default — educational/daily life stories |
| Sol (Hero) | `.../sol%20hero.png` | Fantasy/adventure themes only |
| Ben | `.../ben.jpeg` | Always smaller than Sol |
| Zoe | `.../zoe.jpeg` | Dark skin, afro, blue headband |
| Leo | `.../leo.jpeg` | Round glasses, straight hair |
| Mia | `.../mia.jpeg` | Brown bob, emerald green |

---

## Technical Notes

- The Gemini 3 Pro Image Preview model supports multi-image input in a single message — passing reference images alongside text is the correct way to enforce visual consistency
- The reference images are from a **different** Supabase project (`xqoxoxxlyfimlbekfjxo`) — they are public URLs and will be accessible directly by the AI gateway
- No database changes needed
- No new secrets needed
- All three functions will be redeployed automatically after editing
