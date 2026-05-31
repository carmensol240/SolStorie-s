import { useNavigate } from "react-router-dom";
import { ArrowRight, Wand2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import demoVideo from "@/assets/demo-story-video.mp4";

const DemoStory = () => {
  const navigate = useNavigate();

  const handleWhatsAppShare = () => {
    let childName = "ילד שלי";
    try {
      const stored = localStorage.getItem("guest_child_name") || localStorage.getItem("child_name");
      if (stored && stored.trim()) childName = stored.trim();
    } catch {}
    const link = "https://soulstory.co.il/demo-story";
    const text = `${childName} קיבל/ה סיפור מותאם אישית ב-SolStories 🌟 הכנסו לראות את הקסם 🎉 ${link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background" dir="rtl">
      {/* Simple read-only header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-white/30 px-3 py-2 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.85)' }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-slate-600 hover:bg-sky-100/60 min-h-[44px] p-2 gap-1"
            aria-label="חזרה"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-medium">חזרה</span>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700 truncate max-w-[180px] md:max-w-none">
              סיפור לדוגמה
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-pink-400 text-white">
              סיפור לדוגמה
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-3 py-4 md:py-8">
        <div className="w-full max-w-3xl mx-auto">
          <video
            src={demoVideo}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-white/40 bg-black"
          />
        </div>

        {/* WhatsApp share */}
        <button
          onClick={handleWhatsAppShare}
          className="mt-6 group flex items-center justify-center gap-2.5 rounded-full px-6 py-3 w-full max-w-[300px] bg-gradient-to-r from-green-500 to-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:scale-[1.03] active:scale-95 transition-all duration-300 border border-white/30"
        >
          <MessageCircle className="w-5 h-5 text-white drop-shadow-md" />
          <span className="font-black text-base text-white drop-shadow-md">
            שתפו בוואטסאפ
          </span>
        </button>

        {/* CTA to real flow */}
        <button
          onClick={() => navigate("/create#photo-upload-section")}
          className="mt-4 group flex items-center justify-center gap-2.5 rounded-full px-6 py-3 w-full max-w-[300px] bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.03] active:scale-95 transition-all duration-300 border border-white/30"
        >
          <Wand2 className="w-5 h-5 text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-300" />
          <span className="font-black text-base text-white drop-shadow-md">
            צרו את הסיפור שלכם ✨
          </span>
        </button>
      </main>
    </div>
  );
};

export default DemoStory;