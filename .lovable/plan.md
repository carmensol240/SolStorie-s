

## Plan: Restore Rotating Motivational Sentences in GeneratingStep

### Analysis
The code already has everything set up — `EMPOWERING_SENTENCES` array (line 55), rotation state (`sentenceIndex`, `isSentenceVisible`), and the timer (lines 386-392) — but the sentences are **never rendered in the JSX**. The inline signup form is already present and working (lines 724-899).

### Fix — `src/components/wizard/GeneratingStep.tsx`

**Add the rotating empowering sentence display** in two places:

1. **In the authenticated/dismissed view** (lines 903-924): After the animated icon and before the warning message, add the sentence display with fade transition — same white card style used in the illustrations phase for parenting tips.

2. **In the signup form view** (around line 700): Below the progress bar, add a compact version of the rotating sentence to keep the screen engaging while users fill the form.

The sentence element:
```
<div className="w-full max-w-sm bg-white/70 backdrop-blur-sm rounded-2xl p-4 ...">
  <p className={`transition-opacity duration-500 ${isSentenceVisible ? 'opacity-100' : 'opacity-0'}`}>
    {EMPOWERING_SENTENCES[sentenceIndex]}
  </p>
</div>
```

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — render the rotating sentences in the text generation phase JSX

