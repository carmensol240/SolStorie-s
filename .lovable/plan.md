

## Plan: Expand and Shuffle Motivational Sentences in GeneratingStep

### Analysis
1. **Signup form** — Already fully present and working (lines 732-909): Google button, "או" divider, email/password, terms, "הירשמו בחינם ✨", and "אולי אחר כך". No changes needed.
2. **Sentences** — Only 8 sentences, cycling sequentially with modulo. Need 15+ and a shuffle-without-repeat algorithm.
3. **Icons** — Already have emojis. Will ensure all new sentences also have emojis.

### Changes — `src/components/wizard/GeneratingStep.tsx`

**Expand EMPOWERING_SENTENCES** (lines 55-64) to 16 sentences, all with emoji prefixes:
```
"✨ במילים שאתם בוחרים היום, אתם מעצבים את עולמו הפנימי של ילדכם מחר",
"💛 הזמן שאתם משקיעים עכשיו בסיפור משותף, בונה את הביטחון של הילד שלכם מחר",
"🎁 כל סיפור שאתם יוצרים הוא מתנה של דמיון ומרחב בטוח עבור ילדכם",
"🌱 כל מילה שאתה מקריא היא זרע של סקרנות וצמיחה",
"📖 בזמן שהסיפור נכתב, אתה כותב ביטחון ודמיון בלב של הילד שלך",
"🌟 יש לך את הכוח להפוך כל רגע פשוט להרפתקה שתלווה אותו לכל החיים",
"🌈 הקריאה המשותפת היא המקום שבו הילד שלך לומד לחלום בלי גבולות",
"🧭 אתה המדריך הכי טוב של הילד שלך בעולמות הדמיון",
"🦋 כל סיפור פותח דלת לעולם חדש של אפשרויות",
"🏰 הדמיון של ילדכם הוא הטירה הכי חזקה שיש",
"🎭 דרך הסיפורים ילדים לומדים להכיר רגשות ולהבין אחרים",
"🔮 הקסם האמיתי הוא הרגע שבו ילד אומר — ׳עוד פעם!׳",
"💫 סיפור אישי מלמד ילד שהוא חשוב, ייחודי ואהוב",
"🎨 כל עמוד הוא בד ציור חדש לדמיון של ילדכם",
"🌻 ילדים שגדלים עם סיפורים גדלים עם ביטחון ואמפתיה",
"🫂 הסיפור שאתם יוצרים עכשיו יהפוך לזיכרון יקר לשניכם"
```

**Shuffle-without-repeat rotation** (line 389): Replace the sequential `(prev + 1) % length` with a Fisher-Yates shuffle approach using a ref:
- Add a `shuffledSentences` ref that holds a shuffled copy of indices
- Add a `shufflePosition` ref tracking current position
- When position reaches end, reshuffle
- `setSentenceIndex` picks from shuffled order

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — expand sentences array to 16, implement shuffle-without-repeat rotation

