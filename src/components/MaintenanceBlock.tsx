import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MaintenanceBlock = () => {
  const navigate = useNavigate();
  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-[#1a0533] to-[#2d1b69] px-6 text-center"
    >
      <div className="max-w-md space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black leading-relaxed text-white">
          🔧 האתר בשיפוצים קלים — נחזור בקרוב! 💜
        </h1>
        <p className="text-white/70 text-base">
          ניתן להמשיך לקרוא סיפורים קיימים בספרייה.
        </p>
        <Button
          onClick={() => navigate("/library")}
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl"
        >
          לספרייה שלי
        </Button>
      </div>
    </div>
  );
};

export default MaintenanceBlock;