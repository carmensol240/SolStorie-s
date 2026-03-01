

## Plan: Voice Profile Update + Gradient Branding Title

### 1. TTS Voice Profile — Child Voice (Female, 4-6 years)

**File: `supabase/functions/azure-speech-tts/index.ts`**

Update the SSML to produce a sweet, young child's voice:

- **Hebrew voice**: Keep `he-IL-HilaNeural` (only female Hebrew neural voice available) but add SSML tuning:
  - `pitch="+15%"` — higher, child-like pitch
  - `rate="0.85"` — slightly slower, gentle delivery
  - Add `<mstts:express-as style="cheerful">` for warmth (requires mstts namespace)
  
- **English voice**: Switch from `en-US-AnaNeural` to `en-US-AnaNeural` (Ana is already a child voice — good choice), add same pitch/rate tuning

- Add SSML `<break>` handling and the mstts namespace for expressive styles

The SSML will become:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="he-IL">
  <voice name="he-IL-HilaNeural">
    <mstts:express-as style="cheerful">
      <prosody rate="0.85" pitch="+15%">
        ...text...
      </prosody>
    </mstts:express-as>
  </voice>
</speak>
```

### 2. Gradient "SolStorie's™" Title on End Page

**File: `src/pages/StoryViewer.tsx`** — line ~1002-1004 (end/closing page)

Add the existing `logo-3d-bubble` + `logo-rainbow` branded title after the feedback section on the end page. The gradient rainbow style already exists in `index.css`. Add it below the feedback box:

```tsx
<span className="text-xl font-black logo-3d-bubble mt-3">
  <span className="logo-rainbow">SolStorie's™</span>
</span>
```

### Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/azure-speech-tts/index.ts` | Add SSML child voice tuning (pitch, rate, cheerful style) |
| `src/pages/StoryViewer.tsx` | Add gradient SolStorie's™ title on end page |

Edge function deployment required.

