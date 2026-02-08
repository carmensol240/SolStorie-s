

# 🛡️ תוכנית: לוגיקת מניעת שימוש מסחרי

## סקירה

המערכת תזהה ותחסום משתמשים שמייצרים סיפורים למספר גדול של ילדים שונים (מעל 7 שמות ייחודיים ב-30 יום), מה שמעיד על שימוש מסחרי אסור.

---

## ארכיטקטורה

```text
┌─────────────────────────────────────────────────────────────────┐
│                     לוגיקת מניעת שימוש מסחרי                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐ │
│  │ generate-   │ => │ בדיקת מספר   │ => │ אם > 7 שמות:      │ │
│  │ story       │    │ שמות ייחודיים │    │ חסום + התראה      │ │
│  └─────────────┘    └──────────────┘    └────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      טבלת profiles                         ││
│  │  + commercial_abuse_flagged (boolean)                      ││
│  │  + commercial_abuse_flagged_at (timestamp)                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    טבלת admin_alerts                       ││
│  │  id, user_id, alert_type, message, created_at              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## שלב 1: עדכון מבנה מסד הנתונים

### הוספת עמודות לטבלת profiles

| עמודה | טיפוס | ברירת מחדל | תיאור |
|-------|-------|------------|--------|
| commercial_abuse_flagged | boolean | false | האם החשבון סומן כשימוש מסחרי |
| commercial_abuse_flagged_at | timestamp | null | מתי החשבון סומן |

### יצירת טבלת admin_alerts חדשה

```sql
CREATE TABLE public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  message text NOT NULL,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);
```

### RLS Policies לטבלת admin_alerts

רק אדמינים יכולים לצפות ולעדכן התראות:

```sql
-- אדמינים יכולים לקרוא את כל ההתראות
CREATE POLICY "Admins can view alerts" ON admin_alerts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- אדמינים יכולים לעדכן התראות
CREATE POLICY "Admins can update alerts" ON admin_alerts
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
```

---

## שלב 2: לוגיקת בדיקה ב-Edge Function

### עדכון generate-story/index.ts

נוסיף בדיקה לפני יצירת הסיפור:

```text
אלגוריתם:

1. בדוק אם המשתמש כבר מסומן (commercial_abuse_flagged = true)
   => אם כן: החזר שגיאה מיידית

2. ספור שמות ילדים ייחודיים ב-30 יום אחרונים:
   SELECT COUNT(DISTINCT child_name) 
   FROM stories 
   WHERE user_id = X 
   AND created_at > NOW() - INTERVAL '30 days'

3. אם מספר השמות >= 7 (לפני הסיפור הנוכחי + 1):
   - סמן את המשתמש: commercial_abuse_flagged = true
   - צור התראת אדמין בטבלת admin_alerts
   - החזר שגיאה עם הודעה מתאימה

4. אם הכל תקין: המשך ליצירת הסיפור
```

### הודעת שגיאה למשתמש

```text
"זוהי מערכת לשימוש פרטי בלבד. 
נראה שחרגת ממכסת השמות המותרת. 
לשימוש עסקי, אנא פנה לשירות הלקוחות."
```

---

## שלב 3: התראות אדמין

### שמירת התראה במסד הנתונים

בכל פעם שמשתמש מסומן:

```text
INSERT INTO admin_alerts:
  - user_id: מזהה המשתמש
  - alert_type: "commercial_abuse"
  - message: "משתמש יצר סיפורים עבור X שמות ילדים ייחודיים ב-30 יום"
```

### שליחת מייל לאדמין (אופציונלי)

ניתן להוסיף שליחת מייל דרך Resend לאותו אימייל שמקבל פניות צור קשר (`souldesign06@gmail.com`).

---

## שלב 4: עדכון ה-UI

### הוספת תמיכה בשגיאת COMMERCIAL_ABUSE

ב-`GeneratingStep.tsx` או בקומפוננט המתאים, נוסיף טיפול בשגיאה:

```typescript
if (error?.code === "COMMERCIAL_ABUSE") {
  // הצג הודעה מיוחדת
  toast({
    title: "חשבון מוגבל",
    description: error.message,
    variant: "destructive"
  });
}
```

---

## רשימת קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| Migration | הוספת עמודות ל-profiles + יצירת טבלת admin_alerts |
| `supabase/functions/generate-story/index.ts` | הוספת לוגיקת בדיקה |
| `src/components/wizard/GeneratingStep.tsx` | טיפול בשגיאת COMMERCIAL_ABUSE |

---

## פרטים טכניים

### קוד הבדיקה ב-Edge Function

```typescript
// === COMMERCIAL ABUSE CHECK ===
// Check if user is already flagged
const { data: profileData } = await supabase
  .from("profiles")
  .select("commercial_abuse_flagged")
  .eq("id", userId)
  .single();

if (profileData?.commercial_abuse_flagged) {
  return new Response(
    JSON.stringify({
      error: "זוהי מערכת לשימוש פרטי בלבד...",
      code: "COMMERCIAL_ABUSE"
    }),
    { status: 403, headers: corsHeaders }
  );
}

// Count unique child names in last 30 days
const { data: uniqueNames } = await supabase
  .from("stories")
  .select("child_name")
  .eq("user_id", userId)
  .gte("created_at", new Date(Date.now() - 30*24*60*60*1000).toISOString());

const uniqueNamesSet = new Set(
  uniqueNames?.map(s => s.child_name.toLowerCase().trim())
);

// Check if adding this new name exceeds threshold
const normalizedNewName = childName.toLowerCase().trim();
uniqueNamesSet.add(normalizedNewName);

if (uniqueNamesSet.size > 7) {
  // Flag the user
  await supabase
    .from("profiles")
    .update({
      commercial_abuse_flagged: true,
      commercial_abuse_flagged_at: new Date().toISOString()
    })
    .eq("id", userId);
  
  // Create admin alert
  await supabase
    .from("admin_alerts")
    .insert({
      user_id: userId,
      alert_type: "commercial_abuse",
      message: `משתמש יצר סיפורים עבור ${uniqueNamesSet.size} שמות ילדים ייחודיים ב-30 יום`
    });
  
  // Return error
  return new Response(...);
}
// === END COMMERCIAL ABUSE CHECK ===
```

### נורמליזציה של שמות

כדי למנוע עקיפה (למשל "סול" מול "סוֹל" מול "  סול  "):
- המרה לאותיות קטנות
- הסרת רווחים מהקצוות
- הסרת ניקוד (אופציונלי)

---

## שיקולי אבטחה

1. **RLS על admin_alerts**: רק אדמינים יכולים לראות ולעדכן התראות
2. **Service Role**: הבדיקה והעדכון נעשים עם Service Role בצד השרת
3. **אין עקיפה**: הבדיקה נעשית ב-Edge Function לפני יצירת הסיפור

---

## תוצאה צפויה

1. ✅ משתמש עם עד 7 שמות ייחודיים ב-30 יום: ממשיך ליצור סיפורים
2. ✅ משתמש שחורג מ-7 שמות: נחסם מיידית + הודעה ברורה
3. ✅ אדמין מקבל התראה בטבלת admin_alerts
4. ✅ ההגבלה נשארת גם אחרי 30 יום (עד שאדמין מסיר)
5. ✅ אפשרות עתידית: ממשק אדמין לצפייה בהתראות והסרת חסימות

