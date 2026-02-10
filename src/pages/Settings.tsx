import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail, Trash2, LogOut, FileText, Shield, Eye, Info, Accessibility, Volume2, Type, MousePointer, Link2, MonitorOff, Wand2, Sparkles, Download, Share, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useAccessibility, type FontSize } from "@/hooks/use-accessibility";
import MobileNavigation from "@/components/MobileNavigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AboutStoryTimeContent } from "@/components/shared/AboutStoryTimeContent";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { visualAidMode, setVisualAidMode, audioSupport, setAudioSupport, fontSize, setFontSize } = useAccessibility();
  const { canPrompt, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(() => document.documentElement.classList.contains('highlight-links'));
  const [reducedMotion, setReducedMotion] = useState(() => document.documentElement.classList.contains('reduced-motion'));
  const [largeCursor, setLargeCursor] = useState(() => document.documentElement.classList.contains('large-cursor'));

  

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem('returnTo');
    // Clear dev mode from sessionStorage as a safety measure
    sessionStorage.removeItem('devMode');
    window.location.replace("/");
  };

  // Settings menu items - legal & support only
  const menuItems = [
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
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-purple-50/50 to-background pb-20 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Simple header */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-50 px-4 py-4 border-b border-purple-100">
        <h1 className="text-lg font-bold text-purple-800">הגדרות</h1>
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

          {/* Buy Credits / Premium Upgrade Box */}
          <button
            onClick={() => navigate("/upgrade")}
            className="w-full flex items-center justify-between bg-gradient-to-r from-purple-600/90 via-pink-500/90 to-orange-400/90 backdrop-blur-md rounded-lg px-3 py-3 border border-white/20 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 transition-all text-right shadow-lg"
            aria-label="רכישת חבילת סיפורים"
          >
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" aria-hidden="true" />
              <ArrowRight className="w-3.5 h-3.5 text-white/70" aria-hidden="true" />
            </span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="font-bold text-sm text-white block">רכישת חבילת סיפורים</span>
                <span className="text-[11px] text-white/80 block">המשיכו את הקסם עם חבילת קרדיטים חדשה</span>
              </div>
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Wand2 className="w-4 h-4 text-yellow-200" aria-hidden="true" />
              </div>
            </div>
          </button>

          {/* PWA Install - Home Screen Shortcut */}
          {!isInstalled && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg px-3 py-3 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2 justify-end">
                <div className="text-right">
                  <span className="font-bold text-sm text-foreground block">קיצור דרך למסך הבית</span>
                  <span className="text-[11px] text-muted-foreground block">גישה מהירה לכל הסיפורים שלכם ישירות ממסך הבית.</span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              {canPrompt ? (
                <button
                  onClick={promptInstall}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  הוסף קיצור דרך למסך הבית
                </button>
              ) : isIOS ? (
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  לחצו על <Share className="w-3 h-3 inline mx-0.5" /> בסרגל הדפדפן ובחרו "הוסף למסך הבית"
                </p>
              ) : null}
            </div>
          )}


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
            <AboutStoryTimeContent />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Accessibility Dialog */}
      <Dialog open={accessibilityOpen} onOpenChange={setAccessibilityOpen}>
        <DialogContent className="max-w-sm max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold flex items-center justify-center gap-2">
              <Accessibility className="h-5 w-5 text-purple-500" />
              הגדרות נגישות
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-2">
            <div className="space-y-3 py-2">
              {/* High Contrast Mode */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-foreground">ניגודיות גבוהה</p>
                    <p className="text-xs text-muted-foreground">צבעים בולטים וברורים</p>
                  </div>
                </div>
                <Switch checked={visualAidMode} onCheckedChange={setVisualAidMode} aria-label="הפעל ניגודיות גבוהה" />
              </div>

              {/* Font Size */}
              <div className="p-3 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Type className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-foreground">גודל גופן</p>
                    <p className="text-xs text-muted-foreground">בחרו גודל נוח לקריאה</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {([
                    { value: 'small' as FontSize, label: 'קטן' },
                    { value: 'medium' as FontSize, label: 'בינוני' },
                    { value: 'large' as FontSize, label: 'גדול' },
                  ]).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFontSize(option.value)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        fontSize === option.value
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-background hover:bg-muted border border-border'
                      }`}
                      aria-label={`גודל גופן ${option.label}`}
                      aria-pressed={fontSize === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Support */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Volume2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-foreground">הקראה קולית</p>
                    <p className="text-xs text-muted-foreground">הפעלת כפתור הקראה בסיפורים</p>
                  </div>
                </div>
                <Switch checked={audioSupport} onCheckedChange={setAudioSupport} aria-label="הפעל הקראה קולית" />
              </div>

              {/* Highlight Links */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-foreground">הדגשת קישורים</p>
                    <p className="text-xs text-muted-foreground">סימון בולט לכל הקישורים</p>
                  </div>
                </div>
                <Switch
                  checked={highlightLinks}
                  onCheckedChange={(val) => {
                    setHighlightLinks(val);
                    document.documentElement.classList.toggle('highlight-links', val);
                    localStorage.setItem('a11y_highlight_links', String(val));
                  }}
                  aria-label="הדגשת קישורים"
                />
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <MonitorOff className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-foreground">הפחתת אנימציות</p>
                    <p className="text-xs text-muted-foreground">הפסקת תנועות והנפשות</p>
                  </div>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={(val) => {
                    setReducedMotion(val);
                    document.documentElement.classList.toggle('reduced-motion', val);
                    localStorage.setItem('a11y_reduced_motion', String(val));
                  }}
                  aria-label="הפחתת אנימציות"
                />
              </div>

              {/* Large Cursor */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <MousePointer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-foreground">סמן מוגדל</p>
                    <p className="text-xs text-muted-foreground">הגדלת סמן העכבר</p>
                  </div>
                </div>
                <Switch
                  checked={largeCursor}
                  onCheckedChange={(val) => {
                    setLargeCursor(val);
                    document.documentElement.classList.toggle('large-cursor', val);
                    localStorage.setItem('a11y_large_cursor', String(val));
                  }}
                  aria-label="סמן מוגדל"
                />
              </div>

              {/* Accessibility Statement */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  אתר זה פועל בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות ותקן WCAG 2.1 AA.
                  נתקלתם בבעיית נגישות? <button onClick={() => { setAccessibilityOpen(false); navigate('/contact'); }} className="text-primary underline font-medium">צרו קשר</button>
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
