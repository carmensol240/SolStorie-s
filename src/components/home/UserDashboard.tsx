import { BookOpen, Coins, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface UserDashboardProps {
  displayName: string | null;
  storyCount: number;
  credits: number | null;
  shareCoins: number;
}

const UserDashboard = ({ displayName, storyCount, credits, shareCoins }: UserDashboardProps) => {
  const navigate = useNavigate();
  const totalCoins = (credits ?? 0) + shareCoins;

  return (
    <div className="bg-card rounded-2xl p-5 comic-shadow border-2 border-foreground/10 space-y-4">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          שלום, {displayName || "אורח"} 👋
        </h2>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 bg-secondary/10 rounded-xl px-4 py-2">
          <BookOpen className="w-5 h-5 text-secondary" aria-hidden="true" />
          <span className="font-bold text-secondary">{storyCount}</span>
          <span className="text-sm text-muted-foreground">סיפורים</span>
        </div>

        <div className="flex items-center gap-2 bg-accent/20 rounded-xl px-4 py-2">
          <Coins className="w-5 h-5 text-accent" aria-hidden="true" />
          <span className="font-bold text-foreground">{totalCoins}</span>
          <span className="text-sm text-muted-foreground">קרדיטים</span>
        </div>
      </div>

      {/* Quick Create Button */}
      <Button
        onClick={() => navigate("/create")}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 rounded-xl comic-shadow hover:scale-[1.02] transition-transform"
      >
        <Sparkles className="w-5 h-5 ml-2" aria-hidden="true" />
        צור סיפור חדש
      </Button>
    </div>
  );
};

export default UserDashboard;
