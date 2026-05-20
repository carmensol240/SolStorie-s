import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

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
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setHasDeferredPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!justCreatedFirstStory) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    setOpen(true);
  }, [justCreatedFirstStory]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return;
    await deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    deferredPromptRef.current = null;
    setHasDeferredPrompt(false);
    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
    }
    handleClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[340px] rounded-2xl p-0 border-0 overflow-hidden" dir="rtl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute left-3 top-3 z-10 rounded-full bg-white/20 p-1 text-white hover:bg-white/40 transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">סגור</span>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-6 pt-7 pb-5 text-center text-white">
          <p className="text-3xl mb-1">📲</p>
          <p className="font-bold text-lg leading-tight">התקינו את האפליקציה!</p>
          <p className="text-sm opacity-90 mt-1 leading-snug">
            גישה מהירה מהמסך הבית שלכם
          </p>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-4 space-y-3">
          {/* iPhone card */}
          <div className="bg-purple-50 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-purple-800">
              <span className="text-lg">🍎</span>
              <span>אייפון (Safari)</span>
            </div>
            <p className="text-sm text-purple-900 leading-relaxed pr-7">
              לחצו על <span className="inline-block align-middle">📤</span> בתחתית הדפדפן ואז בחרו <strong>״הוסף למסך הבית״</strong>
            </p>
          </div>

          {/* Android card */}
          <div className="bg-purple-50 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-purple-800">
              <span className="text-lg">🤖</span>
              <span>אנדרואיד (Chrome)</span>
            </div>
            <p className="text-sm text-purple-900 leading-relaxed pr-7">
              לחצו על <strong>⋮</strong> בפינת הדפדפן ואז בחרו <strong>״הוסף למסך הבית״</strong>
            </p>
            <p className="text-xs text-purple-700 leading-relaxed pr-7 pt-1">
              מומלץ להתקין דרך <strong>Chrome</strong> כדי להימנע מאזהרת Google Play Protect.
            </p>
          </div>

          {/* Native install button for Android */}
          {hasDeferredPrompt && (
            <Button
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-bold text-base py-5 rounded-xl shadow-lg"
            >
              <Download className="w-5 h-5 ml-2" />
              התקינו עכשיו בלחיצה אחת 📲
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallAppPrompt;
