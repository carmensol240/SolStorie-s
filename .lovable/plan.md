
# Major Update: Expanding Story Topics and Categories

## What We're Doing
Adding 15+ new educational story topics across all five categories, enriching the Educational Toolbox with professionally-tagged entries, and keeping the Hebrew translation map in sync so every new topic appears correctly in the library, story covers, and sharing.

No database migrations are needed — topics live entirely in frontend data files.

## Files to Edit

### 1. `src/components/wizard/topic-data.ts`

**New topics added to "עולם הערכים" (values):**
- `honesty` — "אמירת אמת" — Honesty and truthfulness
- `respecting-elders` — "כבוד למבוגרים" — Respecting adults and grandparents
- `true-friendship` — "חברות אמת" — What real friendship looks like
- `accepting-differences` — "קבלת השונה" — Accepting differences in others
- `helping-home` — "עזרה בבית" — Contributing to the family home

**New topics added to "התמודדות ורגשות" (emotions):**
- `cooperation` — "שיתוף פעולה" — Working together as a team
- `patience` — "סבלנות" — The power of patience
- `politeness` — "אדיבות" — Being polite and considerate
- `self-confidence` — "ביטחון עצמי" — Building inner confidence (distinct from the edu version)

**New topics added to "סקרנות ומדע" (curiosity):**
- `space-journey` — "מסע בחלל" — Exploring the solar system
- `nature-secrets` — "סודות הטבע" — Wonders of the natural world
- `how-body-works` — "איך הגוף שלנו עובד" — Human body for kids

**New topics added to "דמיון ויצירה" (creativity):**
- `cloud-kingdom` — "ממלכת העננים" — Adventures in a cloud kingdom
- `dragon-party` — "מסיבת הדרקונים" — A party with friendly dragons
- `strange-inventions` — "המצאות משונות" — Wacky inventors and their creations

**Educational Toolbox (edu) — new professionally-tagged entries:**
- `honesty-edu` — "אמירת אמת – מיומנות חברתית" — Social story for honesty
- `cooperation-edu` — "שיתוף פעולה בקבוצה" — Carol Gray-style cooperation social story
- `patience-edu` — "סבלנות – להמתין בשקט" — Patience as a regulation strategy
- `politeness-edu` — "אדיבות ודרך ארץ" — Social norms and politeness
- `respecting-elders-edu` — "כבוד למבוגרים" — Structured social story for respecting adults

All edu topic IDs end in `-edu` so the story engine correctly applies the Carol Gray methodology (≥3:1 descriptive-to-directive sentence ratio, no direct "you" address).

**Images:** New topics will use the best-fit existing images from the local assets and storage bucket (no new uploads required). Mapping:
- `honesty` → `topicApologize` (honesty/truth theme)
- `respecting-elders` → `topicGrandparentsNight`
- `true-friendship` → `topicFriendship`
- `accepting-differences` → `topicWeAreSpecial`
- `helping-home` → `topicHelpingAtHome`
- `cooperation` → `topicPlayingTogether`
- `patience` → `topicAngerCloud` (calm/waiting)
- `politeness` → `topicSharing`
- `self-confidence` → `topicIndependence`
- `space-journey` → `topicSpaceHero`
- `nature-secrets` → `topicEnvironment`
- `how-body-works` → `topicBloodTest`
- `cloud-kingdom` → `topicCloudAdventure`
- `dragon-party` → `topicMagicCastle`
- `strange-inventions` → `topicMagicKeys`

### 2. `src/lib/topic-translations.ts`

Add all new topic IDs to `TOPIC_HEBREW_MAP` so they render in Hebrew across the library, story covers, and share cards:

```typescript
// New values topics
'honesty': 'אמירת אמת',
'respecting-elders': 'כבוד למבוגרים',
'true-friendship': 'חברות אמת',
'accepting-differences': 'קבלת השונה',
'helping-home': 'עזרה בבית',

// New emotions topics
'cooperation': 'שיתוף פעולה',
'patience': 'סבלנות',
'politeness': 'אדיבות',
'self-confidence': 'ביטחון עצמי',

// New curiosity topics
'space-journey': 'מסע בחלל',
'nature-secrets': 'סודות הטבע',
'how-body-works': 'איך הגוף שלנו עובד',

// New creativity topics
'cloud-kingdom': 'ממלכת העננים',
'dragon-party': 'מסיבת הדרקונים',
'strange-inventions': 'המצאות משונות',

// New edu toolbox entries
'honesty-edu': 'אמירת אמת – מיומנות חברתית',
'cooperation-edu': 'שיתוף פעולה בקבוצה',
'patience-edu': 'סבלנות – להמתין בשקט',
'politeness-edu': 'אדיבות ודרך ארץ',
'respecting-elders-edu': 'כבוד למבוגרים',
```

## Topic Count After Update

| Category | Before | After |
|---|---|---|
| עולם הערכים | 10 | 15 |
| התמודדות ורגשות | 24 | 28 |
| דמיון ויצירה | 8 | 11 |
| סקרנות ומדע | 4 | 7 |
| ארגז כלים חינוכי | 5 | 10 |
| **Total** | **51** | **71** |

## Educational Consistency

Every new topic description is written in rich literary Hebrew, following the Meir Shalev prose style — no forced rhymes, no invented words, no non-Hebrew vocabulary. Each description ends with an implied educational takeaway integrated naturally into the narrative premise, consistent with the existing story generation mandate.

The five new edu toolbox entries are explicitly structured for Carol Gray social stories: they describe social situations from the inside, avoid direct "you/אתה" address, and focus on the child's inner experience and coping strategies.

## What Stays Unchanged
- All existing topic IDs (no broken library references)
- Story generation edge function (already enforces educational takeaway)
- Navigation (still 3 tabs: בית, ספרייה, הגדרות)
- Database schema (no migration needed)
- Hero images and UI layout
