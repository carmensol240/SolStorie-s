import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import PersonalizedStoryCover from "@/components/paywall/PersonalizedStoryCover";

interface DemoLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  storyId?: string;
}

const DemoLockModal = ({ open, onOpenChange, title, description, storyId }: DemoLockModalProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showFeatures, setShowFeatures] = useState(false);

  const features = [
    "🎨 אווטאר מצויר ומותאם אישית לילד שלך",
    "🎙️ הקלטה והשמעה",
    "📲 שיתוף בוואטסאפ",
    "🖨️ הדפסה עצמאית (PDF)",
    "🎨 דפי צביעה",
    "📴 שימוש ללא אינטרנט",
    "📚 ספריית לימוד — צבעים, צורות, אותיות ומספרים",
    "🌍 סיפורים בעברית ואנגלית",
  ];

  const rememberReturn = () => {
    try {
      const page = sessionStorage.getItem(`storyReturnPage:${location.pathname}`);
      sessionStorage.setItem(
        "pendingStoryReturn",
        JSON.stringify({ path: location.pathname, page: page ? Number(page) : 0 })
      );
    } catch {}
  };

  const goPackage = () => {
    onOpenChange(false);
    rememberReturn();
    navigate(storyId ? `/upgrade?firstStory=${storyId}` : "/upgrade");
  };

  const goSingle = () => {
    if (!storyId) return;
    onOpenChange(false);
    rememberReturn();
    navigate(`/upgrade?firstStory=${storyId}&mode=single`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-md text-center border-white/20 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)] text-white p-5"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
            {title ?? "רוצים להמשיך לקרוא? 📖"}
          </DialogTitle>
          <p className="text-sm text-white/80 pt-1 text-center">
            {"\u200B"}
          </p>
          {description && (
            <DialogDescription className="text-sm text-white/80 pt-1 text-center">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {storyId && (
          <div className="pt-2">
            <PersonalizedStoryCover storyId={storyId} />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {/* Primary: digital story */}
          <button
            onClick={goPackage}
            className="w-auto max-w-[280px] mx-auto relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 text-white font-black text-sm py-3 px-6 rounded-xl shadow-xl text-center"
            style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)' }}
          >
            רכישת הסיפור הדיגיטלי 📱 – 29.90₪
          </button>
          <p className="text-white/80 text-[11px] font-bold text-center -mt-1">
            🎁 + סיפור נוסף במתנה לרוכשים חדשים!
          </p>

          {storyId && (
            <>
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/30 to-transparent" />
                <span className="text-white/70 text-xs font-bold px-2">או</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>

              {/* Secondary: story + print file */}
              <button
                onClick={goSingle}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-colors rounded-xl px-4 py-3 text-center"
              >
                <div className="text-white font-black text-sm">
                  רכישת הסיפור + קובץ להדפסה 📖 – 79.90₪
                </div>
                <div className="text-white/60 text-[11px] font-semibold mt-0.5">
                  קריאה מלאה + שיתוף בוואטסאפ + הקלטת קול
                </div>
              </button>
            </>
          )}

          <p className="text-white/60 text-[11px] font-semibold text-center pt-1">
            📚 הסיפור נשמר בספרייה החינמית שלך לכל החיים
          </p>

          <button
            onClick={() => onOpenChange(false)}
            className="text-white/50 text-xs font-semibold hover:text-white/80 transition-colors py-2 mt-1"
          >
            לא עכשיו
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoLockModal;