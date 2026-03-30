

## Plan: Add TTS Speaker Button to Learning Topic Cards

### What changes
In `src/components/wizard/TopicStep.tsx`, add a 🔊 button to each learning topic card (rendered via `SimpleTile` in the learning sub-tab grid at line 270). When clicked, it calls the existing `useTextToSpeech` hook to speak the topic's Hebrew label.

### Changes — `src/components/wizard/TopicStep.tsx` only

#### 1. Import `useTextToSpeech` and `Volume2` icon (line 1-9)

Add:
```typescript
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { Volume2 } from 'lucide-react';
```

#### 2. Create a pronunciation map for learning topics

Add a constant mapping topic IDs to their spoken Hebrew pronunciation (the pedagogical name, not the card label):

```typescript
const LEARNING_PRONUNCIATION: Record<string, string> = {
  'letter-alef': 'אָלֶף', 'letter-bet': 'בֵּית', 'letter-gimel': 'גִּימֶל',
  'letter-dalet': 'דָּלֶת', 'letter-he': 'הֵא', 'letter-vav': 'וָו',
  'letter-zayin': 'זַיִן', 'letter-chet': 'חֵית', 'letter-tet': 'טֵית',
  'letter-yod': 'יוֹד', 'letter-kaf': 'כָּף', 'letter-lamed': 'לָמֶד',
  'letter-mem': 'מֵם', 'letter-nun': 'נוּן', 'letter-samekh': 'סָמֶך',
  'letter-ayin': 'עַיִן', 'letter-pe': 'פֵּא', 'letter-tsadi': 'צָדִי',
  'letter-qof': 'קוֹף', 'letter-resh': 'רֵישׁ', 'letter-shin': 'שִׁין',
  'letter-tav': 'תָּו',
  'number-1': 'אֶחָד', 'number-2': 'שְׁנַיִם', 'number-3': 'שָׁלוֹשׁ',
  'number-4': 'אַרְבַּע', 'number-5': 'חָמֵשׁ', 'number-6': 'שֵׁשׁ',
  'number-7': 'שֶׁבַע', 'number-8': 'שְׁמוֹנֶה', 'number-9': 'תֵּשַׁע',
  'number-10': 'עֶשֶׂר',
  'color-red': 'אָדֹם', 'color-blue': 'כָּחֹל', 'color-yellow': 'צָהֹב',
  'color-green': 'יָרֹק', 'color-orange': 'כָּתֹם', 'color-purple': 'סָגֹל',
  'color-pink': 'וָרֹד', 'color-white': 'לָבָן', 'color-black': 'שָׁחֹר',
  'shape-circle': 'עִיגּוּל', 'shape-square': 'רִיבּוּעַ',
  'shape-triangle': 'מְשֻׁלָּשׁ', 'shape-rectangle': 'מַלְבֵּן',
  'shape-heart': 'לֵב', 'shape-star': 'כּוֹכָב',
};
```

#### 3. Initialize TTS hook in `TopicStep` component (inside the function, around line 20)

```typescript
const { startReading, isLoading: ttsLoading } = useTextToSpeech();
```

#### 4. Add speaker button to learning topic cards (line 270)

Replace the `SimpleTile` rendering inside the learning sub-tab grid with a wrapper that adds the speaker button. Instead of rendering just `<SimpleTile>`, wrap it in a `<div className="relative">` and overlay a small speaker button:

```tsx
{section.topics
  .filter(t => t.id.startsWith(learningSubTab))
  .map((topic) => (
    <div key={topic.id} className="relative">
      <SimpleTile topic={topic} isSelected={formData.topic === topic.id} onSelect={() => handleTopicSelect(topic)} />
      {LEARNING_PRONUNCIATION[topic.id] && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            startReading(LEARNING_PRONUNCIATION[topic.id], 'he');
          }}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
          aria-label="השמע"
        >
          <Volume2 className="w-4 h-4 text-purple-600" />
        </button>
      )}
    </div>
  ))}
```

The button is positioned top-right of the card, uses `e.stopPropagation()` to prevent triggering topic selection, and calls `startReading` with the Hebrew pronunciation.

### No other files touched.

