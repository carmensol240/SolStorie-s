

## Plan: Fix Letter Illustration Prompt — Ensure Hebrew Letter is Fully Visible and Centered

### Problem
The illustration prompts for letter learning topics produce images where the Hebrew letter is often cropped or partially visible at edges.

### Changes — `supabase/functions/generate-story/index.ts` only

#### 1. Update inline illustration instructions (lines 1321-1325)

Replace the `learningLetter || learningNumber` block with stronger positioning/centering instructions for letters:

```
${learningLetter ? `- באיור הראשון: האות ${illustrationLearningTarget} מופיעה גדולה, שלמה ומלאה במרכז האיור בצבע זוהר — האות חייבת להיות FULLY VISIBLE, COMPLETE, NOT CROPPED in any direction, positioned in the CENTER of the image with clear empty space around it on ALL sides
- בכל איור: האות ${illustrationLearningTarget} מופיעה שלמה ומלאה איפשהו בסצנה — על קיר, על עץ, על חולצה. The letter must be entirely within the frame, never touching or near any edge.
- האות בפונט עגול וצבעוני לילדים
- כל טקסט באיור חייב להיות בעברית בלבד — ${illustrationLearningTarget}
- The child character must be positioned to the SIDE or BELOW the letter, never in front of it or obscuring it.` : ''}
${learningNumber ? `- באיור הראשון: ${illustrationLearningTarget} מופיעה גדולה ובולטת במרכז האיור בצבע זוהר
- בכל איור: ${illustrationLearningTarget} מופיע איפשהו בסצנה — על קיר, על עץ, על חולצה
- האות/מספר בפונט עגול וצבעוני לילדים
- Show the Arabic numeral digit ${learningNumber}, NOT a Hebrew letter.` : ''}
```

#### 2. Update last-page illustration prompt (line 1810)

For the letter branch, strengthen the prompt:

```typescript
: `The child ${childName} is positioned to the SIDE, looking up at a giant glowing Hebrew letter ${hebrewLearningTarget} which is placed in the exact CENTER of the image. The letter ${hebrewLearningTarget} must be FULLY VISIBLE, COMPLETE, and NOT CROPPED in any direction — with generous clear space around it on ALL sides, never touching any edge of the frame. The letter is large, bold, 3D golden glowing style, perfectly centered. The child must NOT obscure or overlap the letter. Wide shot showing both the child to the side and the complete letter in the center. Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts. Full bleed, no white margins, no borders, image fills entire frame edge to edge.`
```

### No other files touched.

