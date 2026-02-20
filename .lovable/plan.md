
# Character Relationship Fix: Ben Is Sol's Little Brother

## What Changes

The character description for Ben across all 4 AI generation functions must be updated to explicitly establish him as Sol's **younger brother** (אחיה הקטן), not just a friend in the cast. When both Sol and Ben appear in a story, the Hebrew prose must use sibling vocabulary (אחים, אחיה הקטן, אחותו הגדולה).

---

## Files to Update

### 1. `supabase/functions/generate-story/index.ts` — Line ~994

**Current Ben description:**
```
5. **בן (Ben) - הילד האמן** - תפקיד: אמנות, יצירתיות ודמיון. לובש סרבל ג'ינס מותז בצבע, שיער חום מבולגן. לעיתים קרובות מחזיק מכחול גדול. יצירתי וחולמני.
```

**Change to:**
```
5. **בן (Ben) - אחיה הקטן של סול** - תפקיד: פעוט, אחות גדולה, משפחה. לובש חולצה ירוקה בהירה או תכולה, שיער חום כהה מתולתל מאוד ונפחי. פעוט חמוד שתמיד הולך בעקבות סול. **חשוב: כאשר בן וסול מופיעים ביחד בסיפור, יש לתאר אותם כאחים — השתמש בביטויים: "אחיה הקטן", "אחותו הגדולה", "ביניהם כימיה של אחים".**
```

Also add a sibling-narrative rule directly beneath the cast list:

```
**⚠️ כלל אחים מחייב:** כאשר בן מופיע בסיפור שבו גם סול נוכחת, **אסור** לתארם כחברים. השתמש תמיד בשפה של אחווה: "בֶּן, אָחִיהָ הַקָּטָן שֶׁל סוֹל", "סוֹל הִבִּיטָה בְּאָחִיהָ הַקָּטָן", "שְׁנֵי הָאַחִים". הם משפחה, לא חברים.
```

---

### 2. `supabase/functions/generate-cover/index.ts` — Lines 108, 113, 117

**Line 108 — Character reference label:**
Change:
```
- Image 2 (Ben): Toddler with very curly dark hair, warm tan skin — always the SMALLEST character
```
To:
```
- Image 2 (Ben): Sol's LITTLE BROTHER — toddler with very curly dark hair, warm tan skin matching Sol (they are siblings) — always the SMALLEST character
```

**Line 113 — Group description:**
Change:
```
CHARACTERS (all 5 must appear together in the scene, posing as a group of friends):
```
To:
```
CHARACTERS (all 5 must appear together in the scene — Sol and Ben are SIBLINGS, the others are their friends):
```

**Line 117 — Ben individual description:**
Change:
```
4. Ben - match EXACTLY from reference image 2. Very curly dark brown hair, warm tan skin like Sol (siblings). Stands center/front, NOTICEABLY SMALLER than all others. Light green or sky blue shirt.
```
To:
```
4. Ben (Sol's LITTLE BROTHER) - match EXACTLY from reference image 2. Very curly dark brown hair, warm tan skin like Sol — they are siblings and share similar features. Stands beside Sol or center/front, NOTICEABLY SMALLER than all others. Light green or sky blue shirt. Toddler-sized.
```

---

### 3. `supabase/functions/generate-illustrations/index.ts` — Line 224

**Current:**
```
- Image 2 (Ben): toddler, very curly dark hair, SMALLER than Sol
```

**Change to:**
```
- Image 2 (Ben — Sol's LITTLE BROTHER): toddler, very curly dark hair, warm tan skin matching Sol (siblings). When both Ben and Sol appear together, depict them with a sibling bond — Sol looking after him, Ben looking up to her. Always SMALLER than Sol.
```

---

### 4. `supabase/functions/retry-illustration/index.ts` — Line 128

**Current:**
```
- Image 2 (Ben): toddler, very curly dark hair, SMALLER than Sol
```

**Change to:**
```
- Image 2 (Ben — Sol's LITTLE BROTHER): toddler, very curly dark hair, warm tan skin matching Sol (siblings). When both appear together, depict sibling bond. Always SMALLER than Sol.
```

---

## Summary of Narrative Rules Added

| Location | Rule Added |
|---|---|
| `generate-story` cast list | Ben explicitly labeled "Sol's little brother" with mandatory sibling language instruction |
| `generate-story` cast rules | New "⚠️ כלל אחים מחייב" block — forces Hebrew prose to use אחיה הקטן / אחותו הגדולה when both appear |
| `generate-cover` | Ben labeled "Sol's LITTLE BROTHER" in references and composition; group changed from "friends" to "siblings + friends" |
| `generate-illustrations` | Ben reference updated with sibling relationship and visual bond instruction |
| `retry-illustration` | Same as generate-illustrations |

---

## What Stays the Same

- All 5 character reference image URLs — unchanged
- Sol Casual / Sol Hero selection logic — unchanged
- All other character descriptions (Mia, Leo, Zoe) — unchanged
- Story generation flow, credits, nikud pipeline — all unchanged
- No database changes needed
- All 4 functions redeployed automatically after editing
