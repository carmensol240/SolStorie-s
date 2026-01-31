import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, Mail, Trash2, LogOut, FileText, Shield, Coins, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import MobileNavigation from "@/components/MobileNavigation";

import profileHero from "@/assets/profile-hero.jpg";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();

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
    <div className="h-screen h-[100dvh] flex flex-col bg-gradient-to-b from-purple-100/50 to-background overflow-hidden">
      {/* Hero Section with Background Image */}
      <div 
        className="relative h-36 flex-shrink-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${profileHero})` }}
      >
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        
        {/* User info - minimal glass badge top-right */}
        {user && (
          <div className="absolute top-2 right-2">
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-2 border border-white/10">
              <button 
                onClick={() => navigate("/upgrade")}
                className="flex items-center gap-1 bg-amber-500/20 rounded-full px-1.5 py-0.5 hover:bg-amber-500/30 transition-colors"
              >
                <Coins className="w-2.5 h-2.5 text-amber-300" aria-hidden="true" />
                <span className="font-medium text-amber-200 text-[10px]">{totalCredits}</span>
              </button>
              <p className="text-white/80 text-[10px] truncate max-w-[100px]">{user.email?.split('@')[0]}</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items - Glassmorphism Style */}
      <div className="flex-1 overflow-hidden flex flex-col justify-between px-4 py-4">
        <div className="space-y-2.5">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center justify-between bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/50 dark:border-white/20 hover:bg-white/80 dark:hover:bg-white/20 transition-all text-right shadow-sm"
                aria-label={item.label}
              >
                <ArrowRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Accessibility Toggle - show if button was dismissed */}
        {isAccessibilityDismissed && (
          <button
            onClick={handleRestoreAccessibility}
            className="w-full flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 backdrop-blur-md rounded-xl px-4 py-3 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all text-right"
            aria-label="הצג כפתור נגישות"
          >
            <ArrowRight className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <span className="font-medium text-blue-700 dark:text-blue-300">הצג כפתור נגישות</span>
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Accessibility className="w-4 h-4 text-blue-500" aria-hidden="true" />
              </div>
            </div>
          </button>
        )}

        {/* Danger Zone */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-between text-muted-foreground hover:text-foreground bg-white/40 dark:bg-white/5 backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>התנתקות</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/account-exit")}
            className="w-full justify-between text-destructive hover:text-destructive hover:bg-destructive/10 bg-white/40 dark:bg-white/5 backdrop-blur-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>מחיקת חשבון</span>
          </Button>
        </div>

        {/* Footer Placeholder */}
        <div className="h-12 bg-gradient-to-t from-purple-200/50 to-transparent rounded-t-2xl mt-2 flex-shrink-0" />
      </div>
      
      <MobileNavigation />
    </div>
  );
};

export default Settings;
