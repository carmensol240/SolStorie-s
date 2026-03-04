import { useState, useEffect } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosDismissed, setIosDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (localStorage.getItem("pwa-installed") === "true") {
      setInstalled(true);
      return;
    }

    if (standalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      const dismissed = sessionStorage.getItem("pwa-ios-dismissed");
      if (dismissed) setIosDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
      setInstalled(true);
    }
  };

  const handleIOSDismiss = () => {
    setIosDismissed(true);
    sessionStorage.setItem("pwa-ios-dismissed", "true");
  };

  // Don't show if installed or standalone
  if (isStandalone || installed) return null;

  // iOS instructions
  if (isIOS && !iosDismissed) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200]" dir="rtl">
        <div className="bg-gradient-to-l from-primary to-accent text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-lg">
          <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Share className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs leading-tight">התקינו את האפליקציה לגישה מהירה</p>
            <p className="text-[10px] opacity-80 leading-tight mt-0.5">
              לחצו <Share className="w-3 h-3 inline mx-0.5" /> ואז "הוסף למסך הבית"
            </p>
          </div>
          <button
            onClick={handleIOSDismiss}
            className="p-1.5 hover:bg-primary-foreground/20 rounded-full transition-colors flex-shrink-0"
            aria-label="סגור"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop with beforeinstallprompt
  if (deferredPrompt) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200]" dir="rtl">
        <div className="bg-gradient-to-l from-primary to-accent text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-lg">
          <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <p className="flex-1 font-bold text-xs">התקינו את האפליקציה לגישה מהירה</p>
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-background text-primary hover:bg-background/90 font-bold text-xs px-3 h-7"
          >
            התקנה
          </Button>
        </div>
      </div>
    );
  }

  // Fallback: always show banner for users who haven't installed yet
  return (
    <div className="fixed top-0 left-0 right-0 z-[200]" dir="rtl">
      <div className="bg-gradient-to-l from-primary to-accent text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-lg">
        <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs leading-tight">הוסיפו קיצור דרך למסך הבית</p>
          <p className="text-[10px] opacity-80 leading-tight mt-0.5">
            פתחו את התפריט של הדפדפן ולחצו "הוסף למסך הבית"
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
