

# תיקון שוליים שחורים ב-11 תמונות נושא

## מה ייעשה
הסרת השוליים השחורים מ-11 תמונות נושא קיימות באמצעות עריכת תמונה (image editing) - **ללא יצירה מחדש**. התמונות יישארו אותו הדבר, רק ללא המסגרת השחורה.

## התמונות לתיקון

| # | קובץ | נושא |
|---|-------|------|
| 1 | `topic-body-safety.jpg` | הגוף שלי הוא רק שלי |
| 2 | `topic-just-be-me.jpg` | פשוט להיות אני |
| 3 | `topic-grandparents-night.jpg` | הלילה המיוחד בממלכת סבא וסבתא |
| 4 | `topic-stranger-danger.jpg` | שומר הסודות |
| 5 | `topic-bath-shower.jpg` | אמבטיה של כייף |
| 6 | `topic-hand-washing.jpg` | שטיפת ידיים |
| 7 | `topic-independence.jpg` | אני יכול/ה לבד! |
| 8 | `topic-new-sibling.jpeg` | נולד לי אח/ות |
| 9 | `topic-new-house.jpg` | עוברים לבית חדש |
| 10 | `topic-first-day-kindergarten.jpg` | היום הראשון בגן |
| 11 | `topic-rain-party.jpg` | רוקדים בגשם |

## שיטת העבודה
שימוש במודל עריכת תמונות (google/gemini-2.5-flash-image) עם הוראה: "Remove the black borders/letterbox bars from this image. Extend the scene content to fill the entire frame edge-to-edge. Keep the same art style, characters and composition."

כל תמונה תיערך בנפרד ותוחלף באותו שם קובץ - **ללא שינויי קוד**.

## פרטים טכניים
- כל 11 הקבצים נמצאים בתיקיית `src/assets/`
- התמונות ייערכו אחת-אחת דרך ה-AI image editing API
- אין צורך בשינוי קוד כי שמות הקבצים נשארים זהים
