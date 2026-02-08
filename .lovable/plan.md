
# תוכנית: שיפור תהליך הניווט באפליקציה ותיקון יצירת דמות

## סקירת השינויים הנדרשים

### 1. דף נחיתה אוניברסלי (Universal Landing Page)
**סטטוס נוכחי:** דף הבית (Home.tsx) מציג תצוגות שונות לאורחים ולמשתמשים מחוברים.

**שינוי נדרש:** כל המשתמשים (חדשים ורשומים) יראו את דף הנחיתה עם תמונת הילדים המעופפים (GuestLanding) כברירת מחדל.

**קבצים לשינוי:**
- `src/pages/Home.tsx` - הצגת GuestLanding לכולם, עם כפתור "התחל" שמפנה למקום המתאים

### 2. קיצור דרך למשתמשים מחוברים
**לוגיקה חדשה:**
- אם המשתמש **לא מחובר** → לחיצה על "התחל" → מסך Auth
- אם המשתמש **מחובר + אישר תנאים** → לחיצה על "התחל" → ישירות לספרייה (Library)
- אם המשתמש **מחובר + לא אישר תנאים** → לחיצה על "התחל" → מסך Onboarding

**קבצים לשינוי:**
- `src/components/home/GuestLanding.tsx` - הוספת לוגיקת הפניה חכמה

### 3. מסך השראה ("סול על העץ")
**סטטוס נוכחי:** התמונה soli-tree-background.png מוצגת ב-LoggedInHome כרקע.

**שינוי נדרש:** הצגת המסך כשער מעבר לפני תהליך יצירת סיפור.

**יישום:** נוסיף מסך ביניים קצר או אנימציה שמציגה את התמונה לפני הכניסה ל-CreateStory.

**קבצים לשינוי:**
- `src/pages/CreateStory.tsx` - הוספת מסך "השראה" כשלב פתיחה

### 4. מסך About/Terms (פעם אחת בלבד)
**סטטוס נוכחי:** מסך Onboarding.tsx מוצג למשתמשים חדשים לאחר הרשמה.

**שינוי נדרש:** וידוא שכולל הודעה על תשלום בכרטיס אשראי ומוצג רק פעם אחת.

**קבצים לבדיקה:**
- `src/pages/Onboarding.tsx` - כבר כולל את ההודעה ✅

### 5. תיקון יצירת דמות (Edge Function)

**בעיה שזוהתה מהלוגים:**
```
Auth header present: true starts with Bearer: true
getUser result - user exists: false error: Auth session missing!
```

**גורם הבעיה:**
הפונקציה משתמשת ב-`SUPABASE_SERVICE_ROLE_KEY` אבל מעבירה את ה-Authorization header כ-global header לקליינט. זה לא עובד - כאשר משתמשים ב-Service Role Key, צריך לקרוא ל-`getUser(token)` עם הטוקן ישירות, לא דרך ה-global headers.

**פתרון:**
```typescript
// במקום:
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: { headers: { Authorization: authHeader } }
});
const { data: { user } } = await supabase.auth.getUser();

// צריך להיות:
const token = authHeader.replace("Bearer ", "");
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const { data: { user }, error } = await supabase.auth.getUser(token);
```

**קבצים לשינוי:**
- `supabase/functions/preview-child-avatar/index.ts` - תיקון קריאת getUser

### 6. הסרת כפתורי הקראה ונגישות
**סטטוס:** כבר הוסרו בגרסה הנוכחית ✅ (מאומת מקוד use-sound-effects.ts)

---

## פירוט טכני של השינויים

### A. Home.tsx - דף נחיתה אוניברסלי

```typescript
// לפני:
{isLoggedIn ? (
  <LoggedInHome user={user} displayName={displayName} />
) : (
  <GuestLanding />
)}

// אחרי:
<GuestLanding user={user} isLoggedIn={isLoggedIn} />
```

### B. GuestLanding.tsx - הוספת לוגיקת הפניה

```typescript
interface GuestLandingProps {
  user?: any;
  isLoggedIn?: boolean;
}

const GuestLanding = ({ user, isLoggedIn }: GuestLandingProps) => {
  const navigate = useNavigate();
  
  const handleStart = async () => {
    if (!isLoggedIn) {
      // לא מחובר - לדף התחברות
      navigate("/auth");
      return;
    }
    
    // מחובר - בדוק אם אישר תנאים
    const { data } = await supabase
      .from("profiles")
      .select("terms_accepted_at")
      .eq("id", user.id)
      .maybeSingle();
    
    if (data?.terms_accepted_at) {
      // אישר תנאים - ישר לספרייה
      navigate("/library");
    } else {
      // לא אישר - למסך onboarding
      navigate("/onboarding");
    }
  };
  
  return (
    // ... שאר הקומפוננטה עם onClick={handleStart}
  );
};
```

### C. CreateStory.tsx - מסך השראה

נוסיף שלב פתיחה (step 0) שמציג את תמונת "סול על העץ":

```typescript
const [step, setStep] = useState(0); // התחל מ-0 במקום 1

// מסך השראה - step 0
{step === 0 && (
  <div className="relative flex-1 flex flex-col items-center justify-center">
    <img 
      src={soliTreeBackground} 
      alt="סול על העץ" 
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="relative z-10 text-center p-8">
      <h2 className="text-3xl font-black text-white drop-shadow-lg">
        מוכנים ליצור סיפור קסום? ✨
      </h2>
      <Button onClick={() => setStep(1)} className="mt-6">
        בואו נתחיל!
      </Button>
    </div>
  </div>
)}
```

### D. preview-child-avatar/index.ts - תיקון אימות

```typescript
// שינוי בלוק האימות (שורות 28-54):
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// יצירת קליינט ללא Authorization header
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// חילוץ הטוקן והעברתו ישירות ל-getUser
const token = authHeader.replace("Bearer ", "");
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

console.log("getUser result - user exists:", !!user, "error:", authError?.message);
```

---

## סיכום הקבצים לשינוי

| קובץ | פעולה |
|------|--------|
| `src/pages/Home.tsx` | הצגת GuestLanding לכולם עם props |
| `src/components/home/GuestLanding.tsx` | הוספת לוגיקת הפניה חכמה |
| `src/pages/CreateStory.tsx` | הוספת מסך השראה (step 0) |
| `supabase/functions/preview-child-avatar/index.ts` | תיקון קריאת getUser עם טוקן ישיר |

## תוצאה צפויה

1. כל משתמש רואה את דף הנחיתה הקסום עם הילדים המעופפים
2. משתמשים מחוברים עוברים ישירות לספרייה בלחיצה על "התחל"
3. משתמשים חדשים רואים את מסך About/Terms פעם אחת בלבד
4. מסך השראה עם "סול על העץ" מופיע לפני יצירת סיפור
5. יצירת דמות עובדת ללא שגיאות אימות
