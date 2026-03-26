

## Plan: Strengthen Everyday Hebrew Language Instruction in Story Prompt

### Problem
The prompt contains contradictory guidance — it asks for "עברית עשירה ושירית" and "פרוזה ספרותית" alongside "עברית יומיומית". The literary/poetic language instruction dominates, producing stiff, unnatural phrases (e.g. "מלך על סוס") that don't sound like how an Israeli parent talks to a child.

### Changes

**File: `supabase/functions/generate-story/index.ts`**

1. **Line 18** — Change the style directive from literary to conversational:
   - **From:** `עברית תקנית, עשירה ושירית — שפה יפה ומוזיקלית, אך מובנת לילדים.`
   - **To:** `עברית יומיומית, חמה וטבעית — כמו שהורה ישראלי מדבר עם ילדו לפני השינה. לא ספרותית, לא כבדה, לא מליצית.`

2. **Lines 51-52** — Remove "פרוזה ספרותית" framing:
   - **From:** `אתה סופר/ת ילדים עטור/ת פרסים. כתוב בפרוזה ספרותית...` / `פרוזה ספרותית לילדים...`
   - **To:** `אתה סופר/ת ילדים עטור/ת פרסים. כתוב בפרוזה טבעית וחמה...` / `פרוזה טבעית לילדים: סיפור שנשמע כמו שהורה מספר — חם, פשוט וזורם. לא שפה ספרותית כבדה.`

3. **Lines 61-63** — Soften the "שפה עשירה ציורית" to be grounded:
   - **From:** `כותב בסגנון של שפה עשירה, חושית וציורית`
   - **To:** `כותב בסגנון חם ואינטימי — שפה חושית אך פשוטה, כמו סיפור לפני שינה`

4. **Lines 97-101** — Revise vocabulary guidance per age:
   - **From:** `השתמש בעברית עשירה ותקנית (שפה גבוהה)`
   - **To:** `השתמש בעברית טבעית ופשוטה — מילים שילד ישראלי שומע בבית`
   - Keep age differentiation but reframe: all ages use everyday Hebrew, older kids just get slightly richer vocabulary.

5. **After line 162** — Add a new explicit top-level rule section:

```
### 🚨 כלל עליון: עברית יומיומית בלבד! (EVERYDAY HEBREW ONLY)
- **כל משפט חייב להישמע כמו שהורה ישראלי מדבר עם ילדו — חם, פשוט וזורם.**
- **אסור בהחלט:** נוסח ספרותי כבד, צורות פועל לא שגרתיות, מילים שילד לא מכיר.
- **מבחן הטבעיות:** קרא את המשפט בקול — אם הוא לא נשמע כמו משהו שהורה ישראלי באמת יגיד, כתוב מחדש.
- ❌ "מלך על סוס" → ✅ "רכב על סוס"
- ❌ "צעד בגאון" → ✅ "הלך בשמחה"  
- ❌ "חש בנפשו" → ✅ "הרגיש בלב"
- ❌ "נשא עיניו" → ✅ "הסתכל למעלה"
- ❌ "פסע לאיטו" → ✅ "הלך לאט"
- **כלל זהב:** אם ילד בן 5 לא ישתמש במילה הזו בשיחה רגילה — אל תשתמש בה בסיפור.
```

6. **Line 280** — For ages 7-8, change "אוצר מילים עשיר ומתוחכם, פרוזה ספרותית" to "אוצר מילים מגוון אך טבעי — עדיין שפה יומיומית, לא ספרותית".

### What stays the same
- Sensory descriptions guidance (ריחות, צלילים, מגע) — kept, these add warmth without being literary
- NLP principles, growth mindset, positive phrasing — unchanged
- Story structure, page counts, word counts — unchanged
- Grammar rules, gender matching — unchanged
- All other functions, edge functions, components

