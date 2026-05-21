## הוספת עמודי טקסט ועדכון overlay הכריכה במודאל preview הספר המודפס

### שינויים ב-`src/components/story/PrintBookPreviewModal.tsx`

#### 1. החלפת prop `illustrations` ב-`pages`
- במקום `illustrations: string[]` יקבל `pages: { illustration_url: string | null; text: string }[]`
- הוספת prop חדש: `storyTitle: string`

#### 2. בניית רצף slides לסירוגין
מערך ה-slides ייבנה כך:
- Slide 0: כריכה (cover)
- ואז לכל עמוד: slide איור + slide טקסט (לסירוגין: איור→טקסט→איור→טקסט)
- מגביל ל-4 עמודים ראשונים (כלומר עד 8 slides + כריכה ≈ 9 slides max)

כל slide יהיה אובייקט: `{ type: 'cover' | 'image' | 'text', src?: string, text?: string }`

#### 3. רנדור slide לפי סוג
- **cover / image**: כמו היום — `<img className="fba-cover-img">` עם אנימציית flip
- **text**: `<div>` עם רקע כהה (`bg-gradient-to-b from-[#1a0a3e] to-[#2a1050]`), טקסט לבן בגודל קריא, ממורכז, padding, באותם מימדים של ה-`fba-cover-img` ועם אותו flip animation

#### 4. עדכון overlay הכריכה
החלפת הטקסטים הקיימים ב-`fba-overlay`:
- שורה ראשונה: **שם הסיפור** (`storyTitle`) — לבן, מודגש, גדול
- שורה שנייה: **שם הילד** (`childName`) — צהוב (`text-amber-400`), מודגש
- הסרת `fba-subtitle` ו-`fba-logo-text` (שם הילד עובר למקום ה-title הראשי, ושם הסיפור נכנס במקומו)

### שינויים ב-`src/pages/StoryViewer.tsx` (קריאה למודאל בלבד)
- העברת `pages={story.pages.slice(0, 4).map(p => ({ illustration_url: p.illustration_url, text: p.text }))}` במקום `illustrations`
- העברת `storyTitle={translateTopic(story.topic)}` (או `story.topic` אם אין יבוא — נבדוק)

### מה לא ישתנה
- כפתור הורדת PDF ולוגיקת `onDownload`
- אנימציית flip, perspective, spine, dots
- כל שאר הקבצים והפלואו