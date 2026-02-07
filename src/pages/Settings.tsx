import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, Mail, Trash2, LogOut, FileText, Shield, Coins, Eye, Info, Volume2, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useAccessibility } from "@/hooks/use-accessibility";
import MobileNavigation from "@/components/MobileNavigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import profileHero from "@/assets/profile-hero.jpg";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { visualAidMode, audioSupport, setVisualAidMode, setAudioSupport } = useAccessibility();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);

  const totalCredits = (credits ?? 0) + shareCoins;

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem('returnTo');
    window.location.replace("/");
  };

  // All menu items combined
  const menuItems = [
    {
      icon: Users,
      label: "ניהול ילדים",
      onClick: () => navigate("/children"),
    },
    {
      icon: Mail,
      label: "יצירת קשר",
      onClick: () => navigate("/contact"),
    },
    {
      icon: FileText,
      label: "תנאי שימוש",
      onClick: () => navigate("/terms"),
    },
    {
      icon: Shield,
      label: "מדיניות פרטיות",
      onClick: () => navigate("/privacy"),
    },
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-purple-50/50 to-background overflow-hidden">
      {/* Hero Section with Background Image */}
      <div 
        className="relative h-32 flex-shrink-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${profileHero})` }}
      >
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 to-purple-900/70" />
        
        {/* User info - transparent glass badge bottom-right */}
        {user && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 border border-white/10 shadow-lg">
              <button 
                onClick={() => navigate("/upgrade")}
                className="flex items-center gap-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full px-2 py-1 hover:from-purple-500/40 hover:to-pink-500/40 transition-colors"
              >
                <Coins className="w-4 h-4 text-purple-200" aria-hidden="true" />
                <span className="font-bold text-purple-100 text-sm">{totalCredits}</span>
              </button>
              <p className="text-white/90 text-sm truncate max-w-[120px] font-medium">{user.email?.split('@')[0]}</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items - Compact Layout */}
      <div className="flex-1 flex flex-col px-3 py-2 overflow-y-auto">
        <div className="space-y-1.5">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center justify-between bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-right shadow-sm"
                aria-label={item.label}
              >
                <ArrowRight className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{item.label}</span>
                  <div className="w-7 h-7 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                  </div>
                </div>
              </button>
            );
          })}

          {/* Accessibility Settings - Purple Gradient Button */}
          <button
            onClick={() => setAccessibilityOpen(true)}
            className="w-full flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 backdrop-blur-md rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 transition-all text-right shadow-sm"
            aria-label="הגדרות נגישות"
          >
            <ArrowRight className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">הגדרות נגישות</span>
              <div className="w-7 h-7 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
              </div>
            </div>
          </button>

          {/* About Button */}
          <button
            onClick={() => setAboutOpen(true)}
            className="w-full flex items-center justify-between bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-right shadow-sm"
            aria-label="אודות StoryTime"
          >
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">אודות StoryTime</span>
              <div className="w-7 h-7 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
              </div>
            </div>
          </button>
        </div>

        {/* Danger Zone - Accessible */}
        <div className="space-y-1.5 mt-3 pt-2 border-t border-purple-200/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-between text-muted-foreground hover:text-foreground bg-white/70 dark:bg-white/10 backdrop-blur-sm text-sm h-9 border border-purple-100"
          >
            <LogOut className="w-4 h-4" />
            <span>התנתקות</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/account-exit")}
            className="w-full justify-between text-destructive hover:text-destructive hover:bg-destructive/10 bg-white/70 dark:bg-white/10 backdrop-blur-sm text-sm h-9 border border-red-100"
          >
            <Trash2 className="w-4 h-4" />
            <span>מחיקת חשבון</span>
          </Button>
        </div>
      </div>
      
      <MobileNavigation />

      {/* About Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              📖 להפוך את הקושי לסיפור קסום – StoryTime ✨
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
              <p>כאימא יחידנית לילדה על הרצף, מצאתי את עצמי כל ערב יושבת ליד המיטה שלה וממציאה סיפורים. לא סתם סיפורים, אלא כאלו שעוזרים לה לעבד את היום שעבר, להתמודד עם קשיים בגן ולמצוא כוחות.</p>
              
              <p>מתוך הצורך האישי שלי, ומהידע המקצועי שצברתי בלימודי NLP, נולדה StoryTime. באפליקציה הזו הטמעתי כלים מעולם ה-NLP בתוך הלוגיקה של הסיפורים, כך שהם מדברים לילד בשפה הנכונה לו, משתמשים בסוגסטיות מעצימות ועוזרים לו לבנות ביטחון עצמי וחוסן פנימי דרך חוויית הקריאה.</p>
              
              <p className="font-semibold text-foreground">למה כדאי לכם להצטרף למשפחה שלנו?</p>
              
              <p>🌟 <strong>הילד שלכם הוא הגיבור האמיתי:</strong> אתם מעלים תמונה של הילד, והיא הופכת לדמות מצוירת מרהיבה בסגנון אנימציה קלאסי! הדמות הזו תלווה אותו בכל הסיפורים, בכל הרפתקה וברקעים ייחודיים שהושקעו בהם שעות של מחשבה על כל פרט ופרט.</p>
              
              <p>🛡️ <strong>כלים להתמודדות ועיבוד:</strong> האפליקציה כוללת נושאים מובנים שיעזרו לכם ולילדכם לצלוח סיטואציות מאתגרות בבית או בבית הספר. ניתן לחבר סיפור על כל נושא שקרה באותו יום, לגרום לילד להזדהות עם הגיבור ולגעת בבעיה בצורה רכה ומעצימה.</p>
              
              <p>👨‍👩‍👧‍👦 <strong>פרופיל לכל ילד:</strong> יש לכם יותר מילד אחד? אין בעיה! ניתן להכניס יותר מפרופיל אחד, לשמור את כל הילדים באפליקציה ולנהל לכל אחד גלריית סיפורים וזיכרונות משלו.</p>
              
              <p>📚 <strong>ממוקדת ללמידת קריאה:</strong> האפליקציה הונגשה במיוחד לילדים בשלבי רכישת קריאה, עם פיסוק מלא ומדויק שנועד לסייע להם להבין את הטונציה והמבנה של השפה.</p>
              
              <p>♿ <strong>נגישות מעל הכל:</strong> האפליקציה הונגשה לנכים ועוצבה במחשבה רבה כדי שכל הורה וילד יוכלו להשתמש בה בקלות ובנוחות.</p>
              
              <p>📸 <strong>ספר זיכרונות שנשמר לתמיד:</strong> כל הסיפורים שלכם נשמרים בגלריה אישית בחינם.</p>
              
              <p>🖨️ <strong>רוצים ספר פיזי על המדף?</strong> ניתן להפיק קובץ PDF מעוצב להדפסה ללא תוספת תשלום (כלול בעלות החבילה!), ופשוט לשלוח לבית דפוס.</p>
              
              <p>🤖 אנחנו יודעים שה-AI מושלם, אבל לא תמיד... לכן על כל חבילה שתבחרו, תקבלו מספר עריכות חינם לכל סיפור שתיצרו.</p>
              
              <p>📱 <strong>ללא תפיסת מקום בנייד:</strong> מדובר ב-Web App, כך שאין צורך להוריד מחנות האפליקציות והיא לא תופסת מקום באחסון. ניתן להשאיר אותה בנייד ללא עלות גם אם לא מחדשים את חבילת הסיפורים</p>
              
              <p className="text-muted-foreground">רוצים גישה מהירה? הוסיפו את StoryTime למסך הבית שלכם: לחצו על 'שיתוף' (ב-iPhone) או על שלוש הנקודות (באנדרואיד) ובחרו ב-'הוספה למסך הבית'.</p>
              
              <p className="font-semibold text-foreground">והמחיר? שווה לכל כיס.</p>
              
              <p>כי אני יודעת בדיוק מה חסר לנו ההורים ומצאתי פתרון עבור כולנו.</p>
              
              <p className="text-center pt-2 border-t border-purple-100">
                נבנה באהבה גדולה עבור הילדים של כולנו.<br />
                מקווה שתהנו מכל רגע של סיפור,<br />
                <span className="font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">כרמן.</span>
              </p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Accessibility Dialog */}
      <Dialog open={accessibilityOpen} onOpenChange={setAccessibilityOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold flex items-center justify-center gap-2">
              <Accessibility className="h-5 w-5 text-purple-500" />
              הגדרות נגישות
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Visual Aid Mode */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-foreground">מצב ניגודיות גבוהה</p>
                  <p className="text-xs text-muted-foreground">גופן גדול וצבעים ברורים</p>
                </div>
              </div>
              <Switch
                checked={visualAidMode}
                onCheckedChange={setVisualAidMode}
                aria-label="הפעל מצב ניגודיות גבוהה"
              />
            </div>

            {/* Audio Support */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-foreground">תמיכה קולית</p>
                  <p className="text-xs text-muted-foreground">הצג כפתור הקראה בסיפורים</p>
                </div>
              </div>
              <Switch
                checked={audioSupport}
                onCheckedChange={setAudioSupport}
                aria-label="הפעל תמיכה קולית"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
