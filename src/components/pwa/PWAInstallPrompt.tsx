import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      return; // Already installed, don't show prompts
    }

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOS) {
      // Show iOS tip after a short delay
      const timer = setTimeout(() => setShowIOSTip(true), 2000);
      return () => clearTimeout(timer);
    }

    // For Android/Desktop - listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setShowIOSTip(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (dismissed) return null;

  // Android/Desktop install banner
  if (showInstallBanner && deferredPrompt) {
    return (
      <div 
        className="fixed bottom-20 left-4 right-4 z-50 animate-fade-in"
        dir="rtl"
      >
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-2xl p-4 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">הוסיפו את StoryTime למסך הבית</p>
            <p className="text-xs opacity-80">לגישה מהירה בלי דפדפן</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="bg-background text-primary hover:bg-background/90 font-bold text-xs px-3 h-8"
            >
              התקנה
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-primary-foreground/20 rounded-full transition-colors"
              aria-label="סגור"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS install tip
  if (showIOSTip) {
    return (
      <div 
        className="fixed bottom-20 left-4 right-4 z-50 animate-fade-in"
        dir="rtl"
      >
        <div className="bg-gradient-to-r from-secondary to-accent text-secondary-foreground rounded-2xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-secondary-foreground/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Share className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm mb-1">הוסיפו את StoryTime למסך הבית</p>
              <p className="text-xs opacity-90 leading-relaxed">
                לחצו על כפתור השיתוף 
                <Share className="w-3 h-3 inline mx-1" />
                בסרגל הדפדפן, ואז בחרו "הוסף למסך הבית"
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-secondary-foreground/20 rounded-full transition-colors flex-shrink-0"
              aria-label="סגור"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;
