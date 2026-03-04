

## תוכנית: החלפת fal-ai/instant-character ב-fal-ai/flux-kontext/dev

### מה ישתנה

כל הקריאות למודל `fal-ai/instant-character` יוחלפו ב-`fal-ai/flux-kontext/dev` — מודל מהיר יותר עם אותו ממשק API (prompt + image_url → images[0].url). ה-timeout יקוצר משמעותית כי המודל מהיר יותר.

### קבצים שישתנו (3 Edge Functions)

#### 1. `supabase/functions/generate-illustrations/index.ts`
- שינוי URL מ-`fal.run/fal-ai/instant-character` ל-`fal.run/fal-ai/flux-kontext/dev`
- הקטנת timeout מ-120s ל-30s (המודל מהיר הרבה יותר)
- הוספת פרמטרים: `output_format: "png"`, `resolution_mode: "4:3"`
- עדכון הודעות לוג ו-error messages מ-"Instant Character" ל-"Flux Kontext"

#### 2. `supabase/functions/retry-illustration/index.ts`
- אותם שינויים: URL, timeout (120s→30s), פרמטרים, לוגים

#### 3. `supabase/functions/generate-cover/index.ts`
- אותם שינויים: URL, timeout (60s→30s), פרמטרים, לוגים

### שינויי API

instant-character קיבל:
```json
{ "prompt": "...", "image_url": "..." }
```

flux-kontext/dev מקבל אותו מבנה + פרמטרים אופציונליים:
```json
{ "prompt": "...", "image_url": "...", "output_format": "png", "resolution_mode": "4:3", "num_images": 1 }
```

התגובה זהה: `data.images[0].url` — אין צורך בשינוי בקוד העיבוד.

### ללא שינויי DB או קוד צד-לקוח

