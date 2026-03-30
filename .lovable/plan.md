

## Plan: Fix Learning Topic Detection in StoryViewer + TTS Button Only on Last Page

### Problem 1: `isLearningTopic` is always false in StoryViewer
The DB stores topics as Hebrew labels (e.g., `"אות י׳ – אריה האמיץ"`, `"מספר 2 – שני חברים"`, `"צבע אדום"`, `"צורת עיגול"`), but the code checks for English prefixes like `startsWith('letter-')`. This means the TTS button never appears.

### Problem 2: `learningPronunciation` lookup fails
`LEARNING_PRONUNCIATION` is keyed by topic IDs (`'letter-yod'`), but `story.topic` contains Hebrew labels. The lookup always returns `null`.

### Problem 3: TTS button appears on all pages instead of last only
Currently the button is rendered on every combined, illustration, and text page. It should only show on the final virtual page.

### Solution — `src/pages/StoryViewer.tsx` only

#### A. Fix `isLearningTopic` detection (line 1033)
Replace the English prefix checks with Hebrew prefix checks matching what's stored in the DB:
```tsx
const isLearningTopic = story?.topic?.startsWith('אות ') || story?.topic?.startsWith('מספר ') || story?.topic?.startsWith('צבע ') || story?.topic?.startsWith('צורת ');
```

#### B. Fix `learningPronunciation` lookup (line 1034)
Create a reverse map from Hebrew DB topics to topic IDs, then look up pronunciation:
```tsx
const HEBREW_TO_TOPIC_ID: Record<string, string> = Object.fromEntries(
  Object.entries({
    'אות א׳': 'letter-alef', 'אות ב׳': 'letter-bet', 'אות ג׳': 'letter-gimel',
    'אות ד׳': 'letter-dalet', 'אות ה׳': 'letter-he', 'אות ו׳': 'letter-vav',
    'אות ז׳': 'letter-zayin', 'אות ח׳': 'letter-chet', 'אות ט׳': 'letter-tet',
    'אות י׳': 'letter-yod', 'אות כ׳': 'letter-kaf', 'אות ל׳': 'letter-lamed',
    'אות מ׳': 'letter-mem', 'אות נ׳': 'letter-nun', 'אות ס׳': 'letter-samekh',
    'אות ע׳': 'letter-ayin', 'אות פ׳': 'letter-pe', 'אות צ׳': 'letter-tsadi',
    'אות ק׳': 'letter-qof', 'אות ר׳': 'letter-resh', 'אות ש׳': 'letter-shin',
    'אות ת׳': 'letter-tav',
    'מספר 1': 'number-1', 'מספר 2': 'number-2', 'מספר 3': 'number-3',
    'מספר 4': 'number-4', 'מספר 5': 'number-5', 'מספר 6': 'number-6',
    'מספר 7': 'number-7', 'מספר 8': 'number-8', 'מספר 9': 'number-9',
    'מספר 10': 'number-10',
    'צבע אדום': 'color-red', 'צבע כחול': 'color-blue', 'צבע צהוב': 'color-yellow',
    'צבע ירוק': 'color-green', 'צבע כתום': 'color-orange', 'צבע סגול': 'color-purple',
    'צבע ורוד': 'color-pink', 'צבע לבן': 'color-white', 'צבע שחור': 'color-black',
    'צורת עיגול': 'shape-circle', 'צורת ריבוע': 'shape-square',
    'צורת משולש': 'shape-triangle', 'צורת מלבן': 'shape-rectangle',
    'צורת לב': 'shape-heart', 'צורת כוכב': 'shape-star',
  })
);
```

The lookup extracts the Hebrew prefix (e.g., `"אות י׳"` from `"אות י׳ – הילד/ה היצירתי/ת"`) by splitting on ` – `, then maps to the topic ID for pronunciation:
```tsx
const topicPrefix = story?.topic?.split(' – ')[0] || story?.topic || '';
const resolvedTopicId = HEBREW_TO_TOPIC_ID[topicPrefix];
const learningPronunciation = resolvedTopicId ? LEARNING_PRONUNCIATION[resolvedTopicId] : null;
```

#### C. TTS button only on last page (lines 1649, 1730, 1779)
Add a condition to only show on the last virtual page:
```tsx
{isLearningTopic && learningPronunciation && currentPage === virtualPages.length - 1 && (
```

All three instances of the TTS button (combined, illustration, text page types) get this same condition.

### Backend: No changes needed
The `generate-story` function already correctly uses `topicId` for learning detection and the `hebrewLearningTarget` is derived from the topic ID. The wrong-letter issue is likely an AI model inconsistency, not a code bug — the prompts correctly specify the target letter.

### Files modified
- `src/pages/StoryViewer.tsx` — fix detection + last-page-only TTS

