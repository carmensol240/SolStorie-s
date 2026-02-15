

# Final Branding & Domain Setup

## סיכום השינויים

5 משימות מיתוג ודומיין שיש לבצע ב-14 קבצים:

---

## 1. דומיין: שינוי מ-solstories.co.il ל-soulstory.co.il

**קבצים:** `index.html`

| שורה | מ- | ל- |
|------|----|----|
| canonical | `solstories.co.il` | `soulstory.co.il` |
| og:url | `solstories.co.il` | `soulstory.co.il` |
| og:image | `solstories.co.il/favicon.png` | `soulstory.co.il/favicon.png` |
| twitter:image | `solstories.co.il/favicon.png` | `soulstory.co.il/favicon.png` |

**הערה:** לאחר שינוי הקוד, יש להגדיר את הדומיין `soulstory.co.il` בהגדרות הפרויקט (Domains) ולעדכן רשומות DNS (A record ל-185.158.133.1).

---

## 2. שם המותג: החלפת כל "SoulStory" ל-"SolStorie's™"

**10 קבצים לעדכון:**

| קובץ | שינוי |
|-------|-------|
| `vite.config.ts` | PWA manifest name/short_name |
| `src/config/pricing.ts` | "ארגז הכלים של SoulStory" |
| `src/pages/Settings.tsx` | הערה + import name |
| `src/components/shared/AboutSoulStoryContent.tsx` | שם הקובץ (rename) + תוכן |
| `src/components/paywall/PurchaseSuccessModal.tsx` | "ברוכים הבאים למשפחת SoulStory" |
| `src/pages/ShareAndEarn.tsx` | "חשבון ב-SoulStory" |
| `src/pages/Toolkit.tsx` | "SoulStory™" בלוגו |
| `supabase/functions/send-password-reset/index.ts` | from, subject, חתימה |
| `supabase/functions/send-purchase-confirmation/index.ts` | from, חתימה |
| `supabase/functions/send-contact-form/index.ts` | from, חתימה |
| `supabase/functions/azure-speech-tts/index.ts` | User-Agent header |

---

## 3. דמות "Noi" -> Zoe

**לא נדרש שינוי** -- הדמות כבר נקראת Zoe/זואי בכל הקבצים. אין הופעה של "Noi" כשם דמות באפליקציה.

---

## 4. לוגו -- התאמת גודל למובייל

**קבצים:** `src/components/home/GuestLanding.tsx`, `src/pages/Auth.tsx`

שינוי גודל הלוגו כדי שלא ייחתך במסכים צרים:
- הקטנת text-3xl ל-text-2xl במובייל עם sm:text-3xl ל-desktop
- הוספת padding אופקי (`px-4`) למניעת חיתוך

---

## 5. פוטר -- עדכון הזכויות

**קובץ:** `src/components/shared/GlobalFooter.tsx`

```text
מ-: © 2026 SolStorie's™. כל הזכויות שמורות לאמא של סול.
ל-: SolStorie's™ | כל הזכויות שמורות
```

---

## פירוט טכני מלא

### index.html (4 שינויים)
- שורה 27: canonical -> `soulstory.co.il`
- שורה 33: og:url -> `soulstory.co.il`
- שורה 35: og:image -> `soulstory.co.il/favicon.png`
- שורה 38: twitter:image -> `soulstory.co.il/favicon.png`

### vite.config.ts (2 שינויים)
- שורה 20: `"SoulStory™ – סיפורים עם נשמה"` -> `"SolStorie's™ – סיפורים עם נשמה"`
- שורה 21: `"SoulStory"` -> `"SolStorie's™"`

### GlobalFooter.tsx (1 שינוי)
- הטקסט המלא מוחלף לפורמט החדש ללא סימן (c) וללא "לאמא של סול"

### GuestLanding.tsx (1 שינוי)
- שורה 116: הקטנת גודל פונט ל-`text-2xl sm:text-3xl`

### Auth.tsx (1 שינוי)
- שורה 1052: הקטנת גודל פונט ל-`text-2xl sm:text-3xl`

### pricing.ts, Settings.tsx, PurchaseSuccessModal.tsx, ShareAndEarn.tsx, Toolkit.tsx (5 קבצים)
- החלפת כל "SoulStory" ל-`SolStorie's™` עם עטיפת dir="ltr" היכן שרלוונטי

### AboutSoulStoryContent.tsx (1 קובץ)
- שינוי שם הרכיב ל-`AboutSolStoriesContent` (ועדכון ה-import ב-Settings.tsx)

### 3 Edge Functions (send-password-reset, send-purchase-confirmation, send-contact-form, azure-speech-tts)
- החלפת "SoulStory" ל-"SolStorie's™" בשולח, נושא וחתימה

