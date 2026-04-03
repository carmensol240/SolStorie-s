import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "install_prompt_seen";

interface InstallAppPromptProps {
  justCreatedFirstStory: boolean;
}

const InstallAppPrompt = ({ justCreatedFirstStory }: InstallAppPromptProps) => {
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already seen, not a new story, or already installed as standalone
    if (!justCreatedFirstStory) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Show only after user has been reading for at least 30 seconds
    const timer = setTimeout(() => {
      setOpen(true);
      localStorage.setItem(STORAGE_KEY, "true");
    }, 30000);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [justCreatedFirstStory]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[340px] rounded-2xl p-0 border-0 overflow-hidden" dir="rtl">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-6 pt-6 pb-4 text-center text-white">
          <p className="text-3xl mb-1">🌟</p>
          <p className="font-bold text-lg leading-tight">נהנית מהסיפור?</p>
          <p className="text-sm opacity-90 mt-1 leading-snug">
            שמרי את SolStories על המסך הבית שלך לגישה מהירה בכל רגע!
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-5 pt-4 space-y-4">
          {isIOS ? (
            /* iOS instructions */
            <div className="bg-purple-50 rounded-xl p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-purple-700 font-bold text-sm">
                <Share className="w-5 h-5" />
                <span>שלב 1</span>
              </div>
              <p className="text-sm text-purple-900 leading-relaxed">
                לחצי על <Share className="w-4 h-4 inline mx-0.5 text-purple-600" /> בתחתית הדפדפן
              </p>
              <p className="text-sm text-purple-900 leading-relaxed font-bold">
                ואז בחרי ״הוסף למסך הבית״
              </p>
            </div>
          ) : deferredPrompt ? (
            /* Android / desktop with install prompt */
            <Button
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-bold text-base py-5 rounded-xl shadow-lg"
            >
              <Download className="w-5 h-5 ml-2" />
              הורידי את האפליקציה לאנדרואיד 📲
            </Button>
          ) : (
            /* Fallback instructions */
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-sm text-purple-900 leading-relaxed">
                פתחי את התפריט של הדפדפן ולחצי על ״הוסף למסך הבית״
              </p>
            </div>
          )}

          <button
            onClick={() => setOpen(false)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            אולי אחר כך
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallAppPrompt;
