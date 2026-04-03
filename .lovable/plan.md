

## Plan: Fix GeneratingStep — Icons, Signup Form, and Speed

### Analysis

1. **Rotating sentences missing icons**: The `EMPOWERING_SENTENCES` array (line 55) is plain strings with no icons/emojis. They need emoji prefixes to match the original design.

2. **Inline signup form**: Already fully present and working (lines 732-909) — Google button, "או" divider, email/password, terms checkbox, "הירשמו בחינם ✨" button, and "אולי אחר כך" link are all there. No changes needed.

3. **Generation speed**: The rewrite step was already optimized (switched to `gemini-2.5-flash-lite` with abort timeout). This is the fastest available option. No further revert possible — this IS the optimized version.

### Changes — `src/components/wizard/GeneratingStep.tsx`

**Add emojis to EMPOWERING_SENTENCES** (lines 55-64):

Change each sentence to include a leading emoji:
```
"✨ במילים שאתם בוחרים היום..."
"💛 הזמן שאתם משקיעים עכשיו..."
"🎁 כל סיפור שאתם יוצרים..."
"🌱 כל מילה שאתה מקריא..."
"📖 בזמן שהסיפור נכתב..."
"🌟 יש לך את הכוח להפוך..."
"🌈 הקריאה המשותפת היא..."
"🧭 אתה המדריך הכי טוב..."
```

### Summary
- Only the emoji prefixes on sentences are missing — one small edit
- Signup form is intact and complete
- Generation speed is already optimized with the faster model + timeout guard

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — add emojis to empowering sentences array

