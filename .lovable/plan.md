

## הגדלת איורים ל-60% מהדף + חובת איור בכל דף לגיל 0-2

### שינויים

#### 1. פריסה משולבת (combined) לגיל 0-2 — `src/pages/StoryViewer.tsx`
- שינוי יחסי הגובה מ-`flex-[4]/flex-[2]/flex-[4]` (40%/20%/40%) ל-`flex-[6]/flex-[2]/flex-[6]` כדי שכל איור יתפוס ~43% וביחד שני האיורים ימלאו ~86% מהדף
- אלטרנטיבית: `flex-[5]/flex-[1.5]/flex-[5]` — האיורים גדולים יותר, הטקסט מצומצם (מתאים כי הטקסט קצר מאוד)

#### 2. דפי איור סטנדרטיים (לכל הגילאים) — `src/pages/StoryViewer.tsx`  
דפי האיור כבר full-screen (100%), אין צורך בשינוי שם. אבל אם הכוונה שגם בדפי **טקסט** תהיה תמונה — זה שינוי משמעותי יותר בארכיטקטורה שדורש החלטה.

#### 3. הבטחת איור בכל דף לגיל 0-2 — `supabase/functions/generate-story/index.ts`
הקוד כבר מוודא שכל עמוד מקבל `illustration_prompt` ו-`illustration_prompt_2` לגיל 0-2. אוסיף הגנה נוספת:
- ב-virtual page logic: אם דף 0-2 חסר illustration_url, עדיין להציג אותו כ-combined עם placeholder/skeleton ולא להשמיט אותו

#### 4. Fallback לאיור חסר — `src/pages/StoryViewer.tsx`
- כשאין `illustration_url` אבל יש prompt — מוצג skeleton (כבר מיושם)
- כשאין גם prompt — להציג placeholder דקורטיבי (רקע צבעוני עם אמוג'י) במקום שטח ריק

### קבצים
- `src/pages/StoryViewer.tsx` — שינוי יחסי flex בפריסת combined + fallback

