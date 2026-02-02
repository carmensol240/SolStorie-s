import { useState, useEffect } from "react";
import { Wand2, Coins, BookOpen, ArrowLeft, Gift, Sparkles, Book } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import heroChildReading from "@/assets/hero-child-reading.jpg";

interface Story {
  id: string;
  cover_url: string | null;
  topic: string;
  child_name: string;
}

interface LoggedInHomeProps {
  user: any;
  displayName: string | null;
}

const LoggedInHome = ({ user, displayName }: LoggedInHomeProps) => {
  const navigate = useNavigate();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { avatarUrl } = useChildAvatar();
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);

  const totalCredits = (credits ?? 0) + shareCoins;

  useEffect(() => {
    const fetchStories = async () => {
      if (!user?.id || user.id === '00000000-0000-0000-0000-000000000000') {
        setLoadingStories(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("stories")
          .select("id, cover_url, topic, child_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentStories(data || []);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoadingStories(false);
      }
    };

    fetchStories();
  }, [user]);

  const hasStories = recentStories.length > 0;

  // Action Cards
  const actionCards = [
    {
      icon: Wand2,
      title: "יוצאים להרפתקה חדשה",
      description: "סיפור מותאם אישית לילד שלך",
      path: "/create",
      iconBg: "bg-gradient-to-br from-purple-100 to-purple-200",
      iconColor: "text-purple-600",
      cardBg: "bg-gradient-to-r from-purple-50 to-pink-50",
    },
    {
      icon: BookOpen,
      title: "הספרייה הקסומה שלי",
      description: "צפה בכל הסיפורים שיצרת",
      path: "/library",
      iconBg: "bg-gradient-to-br from-amber-100 to-amber-200",
      iconColor: "text-amber-600",
      cardBg: "bg-gradient-to-r from-amber-50 to-orange-50",
    },
    {
      icon: Gift,
      title: "הרויחו סיפורים חינם",
      description: "הזמינו חברים וקבלו קרדיטים",
      path: "/upgrade",
      iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
      iconColor: "text-emerald-600",
      cardBg: "bg-gradient-to-r from-emerald-50 to-teal-50",
    },
  ];

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      {/* Header - Greeting on Right, Credits on Left (RTL) */}
      <header className="flex items-center justify-between mb-2">
        {/* Left side: Credits + Avatar */}
        <div className="flex items-center gap-2">
          {avatarUrl && (
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary shadow-sm">
              <img 
                src={avatarUrl} 
                alt="דמות הילד" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <button 
            onClick={() => navigate("/upgrade")}
            className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-full px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-sm"
            aria-label="צפה בקרדיטים ושדרג"
          >
            <Coins className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">{totalCredits}</span>
          </button>
        </div>
        {/* Right side: Greeting */}
        <h1 className="text-xl font-black text-foreground">
          שלום, {displayName || user?.email?.split('@')[0] || "משתמש"} 👋
        </h1>
      </header>

      {/* Conditional Content: Stories Carousel or Empty State */}
      {!loadingStories && hasStories ? (
        /* Stories Carousel */
        <div className="mb-3">
          <h2 className="text-sm font-bold text-muted-foreground mb-2">הסיפורים האחרונים שלך:</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {recentStories.map((story) => (
              <button
                key={story.id}
                onClick={() => navigate(`/story/${story.id}`)}
                className="flex-shrink-0 w-24 group"
              >
                <div className="w-24 h-32 rounded-lg overflow-hidden shadow-md border-2 border-border group-hover:border-primary transition-colors">
                  {story.cover_url ? (
                    <img 
                      src={story.cover_url} 
                      alt={story.topic} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Book className="w-8 h-8 text-purple-400" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 truncate text-center">{story.child_name}</p>
              </button>
            ))}
          </div>
        </div>
      ) : !loadingStories ? (
        /* Empty State - Magic Book */
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-3 text-center shadow-sm border border-purple-100">
          <div className="w-20 h-20 mx-auto mb-2 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-pink-200 rounded-xl transform rotate-3"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl transform -rotate-2"></div>
            <div className="relative w-full h-full bg-white rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-10 h-10 text-purple-500" />
            </div>
          </div>
          <p className="text-purple-800 font-bold text-sm mb-1">הספרייה שלך מחכה לסיפור הראשון!</p>
          <p className="text-purple-600 text-xs">בואו נתחיל?</p>
        </div>
      ) : (
        /* Loading State */
        <div className="h-32 bg-muted/30 rounded-2xl animate-pulse mb-3"></div>
      )}

      {/* Action Cards - Larger and Colorful */}
      <div className="space-y-2.5 flex-1">
        {actionCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(card.path)}
              className={`w-full flex items-center gap-3 ${card.cardBg} rounded-2xl p-3.5 shadow-sm border border-border/50 hover:shadow-lg hover:scale-[1.01] transition-all text-right`}
            >
              <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base text-foreground">{card.title}</h3>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LoggedInHome;
