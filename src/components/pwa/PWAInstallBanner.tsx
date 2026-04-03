import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_banner_dismissed";

const PWAInstallBanner = () => {
  const [visible, setVisible] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  const handleInstall = async () => {
    if (isIOS) return; // iOS users tap the banner for info, no native prompt
    if (!deferredRef.current) return;
    await deferredRef.current.prompt();
    const { outcome } = await deferredRef.current.userChoice;
    deferredRef.current = null;
    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
    }
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (!visible) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-[4.5rem] left-0 right-0 z-[9999] flex items-center justify-between bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white px-4 py-2.5 shadow-lg text-sm font-medium"
    >
      <button onClick={handleInstall} className="flex-1 text-right">
        📲 הוסיפו אותנו למסך הבית לגישה מהירה
      </button>
      <button
        onClick={handleDismiss}
        className="mr-3 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="סגירה"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PWAInstallBanner;
