import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, Mail, Trash2, LogOut, FileText, Shield, Coins, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
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
  const [aboutOpen, setAboutOpen] = useState(false);

  const totalCredits = (credits ?? 0) + shareCoins;
  
  // Accessibility button visibility
  const isAccessibilityDismissed = localStorage.getItem('accessibility_dismissed') === 'true';
  
  const handleRestoreAccessibility = () => {
    localStorage.removeItem('accessibility_dismissed');
    window.location.reload();
  };

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
        className="relative h-24 flex-shrink-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${profileHero})` }}
      >
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 to-purple-900/70" />
        
        {/* User info - minimal glass badge top-right */}
        {user && (
          <div className="absolute top-1.5 right-1.5">
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-1.5 py-0.5 flex items-center gap-1.5 border border-white/10">
              <button 
                onClick={() => navigate("/upgrade")}
                className="flex items-center gap-0.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full px-1 py-0.5 hover:from-purple-500/40 hover:to-pink-500/40 transition-colors"
              >
                <Coins className="w-2.5 h-2.5 text-purple-200" aria-hidden="true" />
                <span className="font-medium text-purple-100 text-[9px]">{totalCredits}</span>
              </button>
              <p className="text-white/80 text-[9px] truncate max-w-[80px]">{user.email?.split('@')[0]}</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items - Compact Layout */}
      <div className="flex-1 flex flex-col justify-between px-3 py-2">
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
            onClick={handleRestoreAccessibility}
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
              <span className="font-medium text-sm text-foreground">אודות</span>
              <div className="w-7 h-7 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
              </div>
            </div>
          </button>
        </div>

        {/* Danger Zone - Compact */}
        <div className="space-y-1 pt-1.5 border-t border-purple-200/50">
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
    </div>
  );
};

export default Settings;
