

## Plan: Replace Last-Page Learning Illustration Prompt

### Change — `supabase/functions/generate-story/index.ts` lines 1801-1813

Replace the entire block with a single `lastPage.illustration_prompt` assignment using a ternary chain:

```typescript
if (isLearningTopic && pagesWithoutIllustrations.length > 0) {
  const lastPage = pagesWithoutIllustrations[pagesWithoutIllustrations.length - 1];
  lastPage.illustration_prompt = topic.startsWith('color-')
    ? `The child ${childName} stands in a magical scene completely flooded with ${hebrewLearningTarget} color. The background, sky, flowers, objects and clothing are all in shades of ${hebrewLearningTarget}. Disney/Pixar 3D style. Full bleed, no white margins, no borders, image fills entire frame edge to edge.`
    : topic.startsWith('shape-')
    ? `The child ${childName} stands surrounded by giant and small ${hebrewLearningTarget} shapes floating around them in a magical colorful scene. One huge glowing ${hebrewLearningTarget} shape dominates the center. Disney/Pixar 3D style. Full bleed, no white margins, no borders, image fills entire frame edge to edge.`
    : `The child ${childName} stands next to the giant glowing ${learningLetter ? `Hebrew letter ${hebrewLearningTarget}` : `the Arabic numeral digit ${learningNumber} (NOT a Hebrew letter)`}, which fills half the image and is fully visible, not cropped. The letter is large, clear, bold, 3D golden style, complete and uncut. Wide shot showing both the child and the full ${learningLetter ? 'letter' : 'number'}. Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts. Full bleed, no white margins, no borders, image fills entire frame edge to edge.`;
}
```

Removes `fullBleed` variable and the `if/else if` chain. No other files or logic touched.

