

## Plan: Extend Learning Topic Detection for Colors & Shapes

### Changes — `supabase/functions/generate-story/index.ts`

#### 1. Line 724 — Expand `isLearningTopic` detection

```typescript
// Before
const isLearningTopic = topic?.startsWith('letter-') || topic?.startsWith('number-');

// After
const isLearningTopic = topic?.startsWith('letter-') || topic?.startsWith('number-') || topic?.startsWith('color-') || topic?.startsWith('shape-');
```

#### 2. Lines 725-745 — Add color/shape variables after existing letter/number ones

After the existing `learningNumber` and `hebrewLearningTarget` declarations, add:

```typescript
const learningColor = isLearningTopic && topic?.startsWith('color-') ? topic.replace('color-', '') : null;
const learningShape = isLearningTopic && topic?.startsWith('shape-') ? topic.replace('shape-', '') : null;

const COLOR_HEBREW_MAP: Record<string, string> = {
  'red': 'אדום', 'blue': 'כחול', 'yellow': 'צהוב', 'green': 'ירוק',
  'orange': 'כתום', 'purple': 'סגול', 'pink': 'ורוד', 'white': 'לבן', 'black': 'שחור',
};
const SHAPE_HEBREW_MAP: Record<string, string> = {
  'circle': 'עיגול', 'square': 'ריבוע', 'triangle': 'משולש',
  'rectangle': 'מלבן', 'heart': 'לב', 'star': 'כוכב',
};
```

Update `hebrewLearningTarget` to also handle colors/shapes:

```typescript
const hebrewLearningTarget = learningLetter 
  ? (HEBREW_LETTER_MAP[learningLetter] || learningLetter)
  : learningNumber 
    ? `מספר ${learningNumber}` 
    : learningColor
      ? (COLOR_HEBREW_MAP[learningColor] || learningColor)
      : learningShape
        ? (SHAPE_HEBREW_MAP[learningShape] || learningShape)
        : null;
```

#### 3. Lines 1228-1238 — Add color/shape learning instructions to the story prompt

After the existing `learningNumber` block, add:

```
${learningColor ? `- הסיפור עוסק בצבע ${hebrewLearningTarget}
- הצבע ${hebrewLearningTarget} מופיע לפחות 8 פעמים בטקסט מודגש: **${hebrewLearningTarget}**
- תאר חפצים, חיות, פרחים ודברים שהם בצבע ${hebrewLearningTarget}
- בתחילת הסיפור: "הצבע של היום הוא ${hebrewLearningTarget}!"` : ''}
${learningShape ? `- הסיפור עוסק בצורת ${hebrewLearningTarget}
- הצורה ${hebrewLearningTarget} מופיעה לפחות 6 פעמים בטקסט מודגש: **${hebrewLearningTarget}**
- תאר חפצים ודברים שיש להם צורת ${hebrewLearningTarget}
- בתחילת הסיפור: "הצורה של היום היא ${hebrewLearningTarget}!"` : ''}
```

#### 4. Lines 1286-1292 — Add color/shape illustration instructions

Expand the illustration guidelines block to also handle colors and shapes, and add full-bleed instruction to all learning topics:

```
${isLearningTopic ? `
${learningLetter || learningNumber ? `- באיור הראשון: ${hebrewLearningTarget} מופיעה גדולה ובולטת במרכז האיור בצבע זוהר
- בכל איור: ${hebrewLearningTarget} מופיע איפשהו בסצנה — על קיר, על עץ, על חולצה
- האות/מספר בפונט עגול וצבעוני לילדים
- כל טקסט באיור חייב להיות בעברית בלבד — ${hebrewLearningTarget}` : ''}
${learningColor ? `- כל האיורים מוצפים בצבע ${hebrewLearningTarget} — הרקע, החפצים, הבגדים, הפרחים והשמיים כולם בגוני ${hebrewLearningTarget}
- הילד/ה לובש/ת בגדים בצבע ${hebrewLearningTarget}` : ''}
${learningShape ? `- בכל איור מופיעות צורות ${hebrewLearningTarget} גדולות וקטנות מרחפות סביב הדמות
- צורת ${hebrewLearningTarget} ענקית וזוהרת במרכז הסצנה` : ''}
- Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts.
- Full bleed illustration, no white margins, no borders, fills entire frame edge to edge.
` : ''}
```

#### 5. Lines 1763-1770 — Extend last-page illustration override for colors/shapes

```typescript
if (isLearningTopic && pagesWithoutIllustrations.length > 0) {
  const lastPage = pagesWithoutIllustrations[pagesWithoutIllustrations.length - 1];
  const fullBleed = "Full bleed illustration, no white margins or borders. Disney/Pixar style, warm and magical.";
  if (learningLetter || learningNumber) {
    const targetDesc = learningLetter ? `Hebrew letter ${hebrewLearningTarget}` : `number ${hebrewLearningTarget}`;
    lastPage.illustration_prompt = `The child ${childName} stands next to the giant glowing ${targetDesc}, which fills half the image and is fully visible, not cropped. The letter is large, clear, bold, 3D golden style, complete and uncut. Wide shot showing both the child and the full ${learningLetter ? 'letter' : 'number'}. Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts. ${fullBleed}`;
  } else if (learningColor) {
    lastPage.illustration_prompt = `The child ${childName} stands in a scene completely flooded with ${hebrewLearningTarget} — the background, objects, clothing, flowers, and sky are all in shades of ${hebrewLearningTarget}. Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts. ${fullBleed}`;
  } else if (learningShape) {
    lastPage.illustration_prompt = `The child ${childName} stands surrounded by giant and small ${hebrewLearningTarget} shapes floating around them in a magical colorful scene. One huge glowing ${hebrewLearningTarget} dominates the center. Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts. ${fullBleed}`;
  }
}
```

### No other files or logic touched.

