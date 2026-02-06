import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, Mail, Trash2, LogOut, FileText, Shield, Coins, Accessibility, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="h-screen h-[100dvh] flex flex-col bg-gradient-to-b from-purple-50/50 to-background overflow-hidden">
      {/* Hero Section with Background Image */}
      <div 
        className="relative h-28 flex-shrink-0 bg-cover bg-center"
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

      {/* Menu Items - Glassmorphism Style */}
      <div className="flex-1 overflow-hidden flex flex-col justify-between px-3 py-3">
        <div className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center justify-between bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-lg px-3 py-2.5 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-right shadow-sm"
                aria-label={item.label}
              >
                <ArrowRight className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
                <div className="flex items-center gap-2.5">
                  <span className="font-medium text-sm text-foreground">{item.label}</span>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                  </div>
                </div>
              </button>
            );
          })}

          {/* Accessibility Settings - Purple Gradient Button */}
          <button
            onClick={handleRestoreAccessibility}
            className="w-full flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 backdrop-blur-md rounded-lg px-3 py-2.5 border border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 transition-all text-right shadow-sm"
            aria-label="הגדרות נגישות"
          >
            <ArrowRight className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <span className="font-medium text-sm bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">הגדרות נגישות</span>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
              </div>
            </div>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="space-y-1.5 pt-2 border-t border-purple-200/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-between text-muted-foreground hover:text-foreground bg-white/40 dark:bg-white/5 backdrop-blur-sm text-sm h-9"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>התנתקות</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/account-exit")}
            className="w-full justify-between text-destructive hover:text-destructive hover:bg-destructive/10 bg-white/40 dark:bg-white/5 backdrop-blur-sm text-sm h-9"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>מחיקת חשבון</span>
          </Button>
        </div>

        {/* Footer Placeholder */}
        <div className="h-8 bg-gradient-to-t from-purple-100/50 to-transparent rounded-t-2xl mt-1 flex-shrink-0" />
      </div>
      
      <MobileNavigation />
    </div>
  );
};

export default Settings;
