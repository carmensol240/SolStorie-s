

## תוכנית: תיקון כפילות ושדרוג תמונות לסגנון Pixar 3D

### בעיה 1: כפילות תמונה
הנושא **"מעגל השנה — חגים ועונות"** (`holidays-seasons-edu`, שורה 224) משתמש ב-`topicRainParty` — אותה תמונה כמו **"רוקדים בגשם"** (`rain-party`, שורה 187).

**פתרון:** ייצור תמונה ייחודית לנושא `holidays-seasons-edu` — סול והקאסט חוגגים עם קישוטי חגים ועונות השנה.

### בעיה 2: תמונות שלא תואמות סגנון
התמונות שנוצרו ב-flux.schnell אינן תואמות את הסגנון של שאר הגלריה (דמויות Pixar 3D עם עיניים גדולות, תאורה חמה, צבעים עשירים). 

**רשימת 20 תמונות להחלפה** (כולן נוצרו ב-flux.schnell ואינן בסגנון הנכון):
1. `topic-find-a-friend.jpg`
2. `topic-screen-time.jpg`
3. `topic-divorce.jpg`
4. `topic-sick-grandparent.jpg`
5. `topic-making-mistakes.jpg`
6. `topic-crying-is-ok.jpg`
7. `topic-cloud-kingdom.jpg`
8. `topic-dragon-party.jpg`
9. `topic-strange-inventions.jpg`
10. `topic-space-journey.jpg`
11. `topic-friendship-courage.jpg`
12. `topic-accepting-differences.jpg`
13. `topic-how-body-works.jpg`
14. `topic-waiting-in-line.jpg`
15. `topic-politeness.jpg`
16. `topic-emotion-regulation.jpg`
17. `topic-patience.jpg`
18. `topic-play-rules.jpg`
19. `topic-self-confidence.jpg`
20. `topic-nature-secrets.jpg`

**+ תמונה חדשה** לנושא `holidays-seasons-edu`

### פתרון
ייצור 21 תמונות באמצעות **Gemini 3 Pro Image** (`google/gemini-3-pro-image-preview`) דרך Edge Function, עם פרומפטים מותאמים לכל נושא בסגנון:

> *3D Disney Pixar cartoon animation style. Adorable cartoon doll characters with big round expressive eyes with sparkling highlights, soft rounded cute faces, smooth stylized skin. Vibrant rich saturated colors, warm magical golden lighting. Clean sharp 3D rendering. Characters must NEVER look like real humans.*

כל פרומפט ישלב את דמויות הקאסט הרלוונטיות (סול בתלבושת גיבורת-על: גלימה אדומה, חולצה תכלת עם כוכב, מכנסיים סגולים; בן בשיער מתולתל כהה וחולצה ירוקה; וכו').

### שלבי ביצוע
1. עדכון Edge Function `generate-topic-images` עם 21 פרומפטים חדשים
2. ייצור התמונות דרך ה-Edge Function והעלאה ל-storage bucket `topic-images`
3. עדכון `topic-data.ts` — שינוי ה-image reference של `holidays-seasons-edu` לתמונה הייחודית החדשה, ומעבר ל-storage URLs עבור כל 21 הנושאים

### מה לא משתנה
- טקסטים, keywords, ageRange — ללא שינוי
- נושאים שכבר יש להם תמונות מתאימות בסגנון הנכון — ללא שינוי
- אין שינויי DB או RLS

