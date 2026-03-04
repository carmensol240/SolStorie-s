

## שדרוג עמוד ההקדשה

### הבעיה
עמוד ההקדשה הנוכחי (שורות 949-971) מינימליסטי — רקע קשת, אמוג'י 🦄 קבוע, וטקסט "הספר מוקדש באהבה ל-". חסרים: תמונת אוואטר של הילד, רקע מותאם לנושא, ואמוג'י דינמי.

### פתרון

**`src/pages/StoryViewer.tsx`:**

1. **הוספת שליפת אוואטר מפרופיל הילד**: בזמן fetch הסיפור, לשלוף גם את `child_id` מטבלת `stories`, ואם קיים — לשלוף `child_avatar_url` מטבלת `profiles`. לשמור ב-state חדש `childAvatarUrl`.

2. **מיפוי נושא → אמוג'י ורקע**: יצירת מיפוי `TOPIC_THEME_MAP` שממפה את ה-topic string לאמוג'י גדול ולצבעי רקע גרדיאנט מותאמים. לדוגמה:
   - `bedtime` → 🌙 + רקע כחול-סגול כהה עם כוכבים
   - `space` → 🚀 + רקע כחול כהה
   - `friendship` → 🤝 + רקע ורוד-כתום חם
   - `zoo` → 🦁 + רקע ירוק
   - ברירת מחדל → ✨ + רקע הקשת הנוכחי

3. **שדרוג JSX של עמוד ההקדשה**:
   - **רקע**: גרדיאנט דינמי לפי הנושא + אפקט כוכבים/ניצוצות CSS
   - **אמוג'י נושא**: גדול (text-7xl) בחלק העליון, עם אנימציית pulse
   - **תמונת אוואטר**: אם יש `childAvatarUrl` — תמונה עגולה גדולה (w-32 h-32) עם מסגרת גרדיאנט ואנימציית glow. אם אין — אמוג'י ⭐ גדול כ-fallback
   - **טקסט**: "הספר הזה נוצר במיוחד עבורך," בשורה ראשונה, שם הילד + ❤️ בשורה שנייה בגרדיאנט מותגי גדול
   - **קישוט**: קו דקורטיבי עם אמוג'י לבבות, וניצוצות CSS ברקע

4. **הוספת state חדש**:
   ```typescript
   const [childAvatarUrl, setChildAvatarUrl] = useState<string | null>(null);
   ```

5. **הרחבת ה-fetch**: בתוך `fetchStory`, אחרי שליפת הסיפור, לשלוף את ה-avatar:
   ```typescript
   const childId = (storyData as any).child_id;
   if (childId) {
     const { data: profile } = await supabase
       .from('profiles')
       .select('child_avatar_url')
       .eq('id', childId)
       .maybeSingle();
     if (profile?.child_avatar_url) {
       setChildAvatarUrl(getPublicIllustrationUrl(profile.child_avatar_url));
     }
   }
   ```

### תוצאה
עמוד הקדשה מרגש ואישי עם תמונת הילד במרכז, טקסט חם, רקע חגיגי מותאם לנושא הסיפור, ואמוג'י הנושא בולט.
