

## Plan: TTS Button Changes — Learning Library → Decorative, Story Viewer → Clickable

### Summary
1. Make the 🔊 button on learning topic cards decorative (non-clickable, smaller)
2. Add a clickable 🔊 TTS button on each story page for learning topics only
3. Change ElevenLabs voice ID to Matilda (child-friendly)

### Changes

#### 1. `src/components/wizard/TopicStep.tsx` — Lines 293-306

Replace the clickable `<button>` with a small decorative `<div>`. Remove the `onClick` handler and `useTextToSpeech` import (if no longer used elsewhere — check first; the `startReading` is only used here, so the import + hook call can be removed too).

Replace the button block with:
```tsx
{LEARNING_PRONUNCIATION[topic.id] && (
  <div className="absolute top-1.5 right-1.5 z-20 w-5 h-5 rounded-full bg-white/60 flex items-center justify-center" aria-hidden="true">
    <Volume2 className="w-3 h-3 text-purple-400" />
  </div>
)}
```

Also remove the `useTextToSpeech` import (line 10) and the `startReading` destructure from the hook call.

#### 2. `src/pages/StoryViewer.tsx` — Add TTS button for learning topics

**Line 1012**: Expand `isLearningTopic` to include colors and shapes:
```tsx
const isLearningTopic = story?.topic?.startsWith('letter-') || story?.topic?.startsWith('number-') || story?.topic?.startsWith('color-') || story?.topic?.startsWith('shape-');
```

**Imports (line 1-3 area)**: Add `Volume2` to lucide imports and import `useTextToSpeech`:
```tsx
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
```

**After line ~41 area**: Add the `LEARNING_PRONUNCIATION` map (same data as in TopicStep) or extract to a shared module. Since instructions say "do not modify any other code or files", duplicate the map inside StoryViewer.

**Inside the component**: Call `const { startReading } = useTextToSpeech();` and derive `learningPronunciation` from `story?.topic`.

**Story page rendering** — Add a floating 🔊 button on each page type (combined ~line 1610, illustration ~line 1680, text ~line 1726) when `isLearningTopic` is true. Position it bottom-right or top-right with z-20. Example:

```tsx
{isLearningTopic && learningPronunciation && (
  <button
    onClick={() => startReading(learningPronunciation, 'he')}
    className="absolute bottom-12 right-3 z-20 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-purple-200"
    aria-label="השמע"
  >
    <Volume2 className="w-5 h-5 text-purple-600" />
  </button>
)}
```

#### 3. `supabase/functions/elevenlabs-tts/index.ts` — Line ~41

Replace voice ID:
```typescript
const voiceId = 'jsCqWAovK2LkecY7zXl4'; // Matilda — child-friendly
```

### Files modified
- `src/components/wizard/TopicStep.tsx` — decorative icon, remove TTS hook
- `src/pages/StoryViewer.tsx` — add TTS button for learning topics, expand `isLearningTopic`
- `supabase/functions/elevenlabs-tts/index.ts` — voice ID change

