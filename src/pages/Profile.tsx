import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, Save, Notebook, Crown, Sparkles, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MobileNavigation from "@/components/MobileNavigation";
import { SignedImage } from "@/components/ui/signed-image";
import GlobalFooter from "@/components/shared/GlobalFooter";
import GoldenHeartRewards from "@/components/profile/GoldenHeartRewards";
import heroBackground from "@/assets/hero-solstories-library.png";
import useEmblaCarousel from "embla-carousel-react";

// Character assets
import castSol from "@/assets/cast-sol-adventure.jpg";
import castBen from "@/assets/cast-ben-art.jpg";
import castMia from "@/assets/cast-mia-nature.jpg";
import castLeo from "@/assets/cast-leo-science.jpg";
import castZoe from "@/assets/cast-zoe-sports.jpg";

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  gender: string | null;
  photo_url: string | null;
}

const CHARACTER_AVATARS = [
  { id: "sol", name: "סול", image: castSol },
  { id: "ben", name: "בן", image: castBen },
  { id: "mia", name: "מיה", image: castMia },
  { id: "leo", name: "ליאו", image: castLeo },
  { id: "zoe", name: "זואי", image: castZoe },
] as const;

interface Badge {
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockHint: string;
}

interface FavoriteStory {
  id: string;
  topic: string;
  cover_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firstChild, setFirstChild] = useState<ChildProfile | null>(null);
  const [storyCount, setStoryCount] = useState(0);
  const [favoriteStory, setFavoriteStory] = useState<string | null>(null);
  const [parentNote, setParentNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [topStories, setTopStories] = useState<FavoriteStory[]>([]);
  const [emblaRef] = useEmblaCarousel({ direction: "rtl", align: "start" });

  // Fetch first child
  useEffect(() => {
    if (!user) return;
    supabase
      .from("children")
      .select("id, name, age, gender, photo_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFirstChild(data as ChildProfile);
      });
  }, [user]);

  // Fetch avatar selection
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_emoji")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_emoji && ["sol", "ben", "mia", "leo", "zoe"].includes(data.avatar_emoji)) {
          setSelectedAvatar(data.avatar_emoji);
        }
      });
  }, [user]);

  // Fetch story count + favorite story + badges + top stories
  useEffect(() => {
    if (!user) return;

    // Story count + themes for badges
    supabase
      .from("stories")
      .select("id, theme, topic, cover_url")
      .eq("user_id", user.id)
      .then(({ data, count }) => {
        const stories = data ?? [];
        setStoryCount(stories.length);

        const hasAdventure = stories.some((s) => s.theme === "adventure");
        const hasEmotional = stories.some((s) => s.theme === "emotional");

        setBadges([
          { emoji: "🌱", name: "נבט הדמיון", description: "יצירת סיפור ראשון", unlocked: stories.length >= 1, unlockHint: "צרו את הסיפור הראשון שלכם כדי לפתוח את הנבט!" },
          { emoji: "⭐", name: "חוקר כוכבים", description: "סיפורי הרפתקה", unlocked: hasAdventure, unlockHint: "קראו 5 סיפורי הרפתקה כדי להפוך לחוקרי כוכבים!" },
          { emoji: "💛", name: "לב זהב", description: "סיפורים רגשיים", unlocked: hasEmotional, unlockHint: "כדי לפתוח את לב הזהב של סול ולהפוך לחברים הכי טובים, המשיכו להיכנס וליצור סיפורים במשך 7 ימים רצופים. אתם כמעט שם!" },
          { emoji: "📖", name: "קוסם מילים", description: "5+ סיפורים", unlocked: stories.length >= 5, unlockHint: "צרו 5 סיפורים או יותר כדי להפוך לקוסמי מילים!" },
          { emoji: "🤝", name: "החבר/ה של סול", description: "10+ סיפורים", unlocked: stories.length >= 10, unlockHint: "צרו 10 סיפורים כדי להפוך לחברים הכי טובים של סול!" },
        ]);
      });

    // Favorite story: most read from user_story_stats
    supabase
      .from("user_story_stats" as any)
      .select("story_id, read_count")
      .eq("user_id", user.id)
      .order("read_count", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data }: any) => {
        if (data?.story_id) {
          const { data: story } = await supabase
            .from("stories")
            .select("topic")
            .eq("id", data.story_id)
            .maybeSingle();
          if (story?.topic) {
            setFavoriteStory(story.topic);
            return;
          }
        }
        const { data: latest } = await supabase
          .from("stories")
          .select("topic")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setFavoriteStory(latest?.topic ?? null);
      });

    // Top 3 stories by read count
    supabase
      .from("user_story_stats" as any)
      .select("story_id, read_count")
      .eq("user_id", user.id)
      .order("read_count", { ascending: false })
      .limit(3)
      .then(async ({ data }: any) => {
        if (!data?.length) return;
        const storyIds = data.map((d: any) => d.story_id);
        const { data: stories } = await supabase
          .from("stories")
          .select("id, topic, cover_url")
          .in("id", storyIds);
        if (stories) setTopStories(stories as FavoriteStory[]);
      });
  }, [user]);

  // Fetch parent notes
  useEffect(() => {
    if (!user) return;
    supabase
      .from("parent_notes")
      .select("discussion_topics")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.discussion_topics) setParentNote(data.discussion_topics);
      });
  }, [user]);

  const saveParentNote = useCallback(async () => {
    if (!user) return;
    setSavingNote(true);
    try {
      const { error } = await supabase
        .from("parent_notes")
        .upsert(
          { user_id: user.id, discussion_topics: parentNote },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      setNoteSaved(true);
      toast.success("המחברת נשמרה בהצלחה ✨");
      setTimeout(() => setNoteSaved(false), 2000);
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSavingNote(false);
    }
  }, [user, parentNote]);

  const handleAvatarSelect = async (avatarId: string) => {
    if (!user) return;
    setSelectedAvatar(avatarId);
    await supabase
      .from("profiles")
      .update({ avatar_emoji: avatarId })
      .eq("id", user.id);
    toast.success("הדמות נבחרה! ✨");
  };

  const childName = firstChild?.name ?? "הילד/ה";
  const isFemale = firstChild?.gender === "female";
  const avatarChar = CHARACTER_AVATARS.find((c) => c.id === selectedAvatar);

  return (
    <div
      className="min-h-[100dvh] flex flex-col pb-20 overflow-y-auto relative"
      dir="rtl"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Blurred magical background */}
      <div className="fixed inset-0 -z-10">
        <img
          src={heroBackground}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
          style={{ filter: "blur(25px) brightness(1.15) saturate(1.2)", transform: "scale(1.1)" }}
        />
        <div className="absolute inset-0 bg-white/30" />
      </div>

      <div className="w-full max-w-[550px] lg:max-w-[450px] mx-auto px-4 py-6 space-y-6">
        {/* Back button - desktop only */}
        <Button variant="outline" size="icon" onClick={() => navigate("/")} className="hidden md:flex" aria-label="חזרה לדף הבית">
          <ArrowRight className="h-5 w-5" />
        </Button>
        {/* Avatar + Title */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div
            className="w-44 h-44 rounded-full overflow-hidden shadow-xl p-[5px]"
            style={{
              background: "linear-gradient(135deg, hsl(45, 90%, 55%), hsl(35, 95%, 65%), hsl(45, 90%, 55%))",
              boxShadow: "0 0 30px rgba(212, 175, 55, 0.4), 0 8px 32px rgba(0,0,0,0.15)",
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              {avatarChar ? (
                <img
                  src={avatarChar.image}
                  alt={avatarChar.name}
                  className="w-full h-full object-cover"
                />
              ) : firstChild?.photo_url ? (
                <SignedImage
                  src={firstChild.photo_url}
                  alt={`תמונת ${childName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400 text-white text-6xl font-bold">
                  {childName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <h1
            className="text-2xl font-black text-center"
            style={{ color: "hsl(260, 50%, 25%)", textShadow: "0 1px 2px rgba(255,255,255,0.6)" }}
          >
            העולם של {childName} ✨
          </h1>
        </div>

        {/* Avatar Selection */}
        <section className="space-y-2">
          <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "hsl(260, 40%, 30%)" }}>
            <span className="text-lg">🎭</span>
            בחרו דמות מלווה
          </h2>
          <div className="flex justify-center gap-3">
            {CHARACTER_AVATARS.map((char) => (
              <button
                key={char.id}
                onClick={() => handleAvatarSelect(char.id)}
                className={`flex flex-col items-center gap-1 transition-all ${
                  selectedAvatar === char.id ? "scale-110" : "opacity-70 hover:opacity-100"
                }`}
              >
                <div
                  className="w-14 h-14 rounded-full overflow-hidden"
                  style={{
                    border: selectedAvatar === char.id
                      ? "3px solid hsl(45, 90%, 55%)"
                      : "2px solid rgba(255,255,255,0.5)",
                    boxShadow: selectedAvatar === char.id
                      ? "0 0 16px rgba(212, 175, 55, 0.5)"
                      : "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-bold" style={{ color: "hsl(260, 40%, 30%)" }}>
                  {char.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="backdrop-blur-xl rounded-[20px] p-4 flex flex-col items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-3xl font-black" style={{ color: "hsl(260, 50%, 30%)" }}>{storyCount}</span>
            <span className="text-xs font-medium text-center" style={{ color: "hsl(260, 30%, 40%)" }}>סיפורים שיצרנו יחד</span>
          </div>

          <div
            className="backdrop-blur-xl rounded-[20px] p-4 flex flex-col items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-center leading-tight line-clamp-2 min-h-[2.5rem] flex items-center" style={{ color: "hsl(260, 50%, 30%)" }}>
              {favoriteStory || "עדיין אין"}
            </span>
            <span className="text-xs font-medium text-center" style={{ color: "hsl(260, 30%, 40%)" }}>
              הסיפור ש{isFemale ? "הכי אוהבת" : "הכי אוהב"}
            </span>
          </div>
        </div>

        {/* Badge Case - My Journey */}
        <section className="space-y-3">
          <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "hsl(260, 40%, 30%)" }}>
            <span className="text-lg">🏅</span>
            המסע שלי
          </h2>
          <div
            className="backdrop-blur-xl rounded-[20px] p-4"
            style={{
              background: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
            }}
          >
            <div className="grid grid-cols-5 gap-2">
              {badges.map((badge, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    badge.unlocked ? "" : "opacity-40 grayscale cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!badge.unlocked) {
                      toast(badge.name, {
                        description: badge.unlockHint,
                        icon: badge.emoji,
                      });
                    }
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      background: badge.unlocked
                        ? "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(236,72,153,0.15))"
                        : "rgba(200,200,200,0.2)",
                      border: badge.unlocked
                        ? "1.5px solid rgba(245,158,11,0.4)"
                        : "1.5px solid rgba(200,200,200,0.3)",
                    }}
                  >
                    {badge.unlocked ? badge.emoji : <Lock className="w-4 h-4 text-gray-400" />}
                  </div>
                  <span className="text-[9px] font-bold text-center leading-tight" style={{ color: "hsl(260, 30%, 40%)" }}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Golden Heart Rewards */}
        <GoldenHeartRewards
          childName={childName}
          isUnlocked={badges.find(b => b.emoji === "💛")?.unlocked ?? false}
        />

        {/* Favorites Slider */}
        {topStories.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "hsl(260, 40%, 30%)" }}>
              <span className="text-lg">📚</span>
              הסיפורים האהובים
            </h2>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-3">
                {topStories.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => navigate(`/story/${story.id}`)}
                    className="flex-shrink-0 w-28 rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105"
                    style={{
                      border: "2px solid rgba(255,255,255,0.5)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    }}
                  >
                    {story.cover_url ? (
                      <SignedImage
                        src={story.cover_url}
                        alt={story.topic}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center p-2">
                        <span className="text-xs font-bold text-white text-center">{story.topic}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Parent Notebook */}
        <section className="space-y-3">
          <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "hsl(260, 40%, 30%)" }}>
            <span className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center">
              <Notebook className="w-4 h-4 text-amber-700" />
            </span>
            מחברת ההורה
            <span className="text-sm">✏️</span>
          </h2>

          <div
            className="rounded-[20px] overflow-hidden"
            style={{
              background: "#FFFDF5",
              border: "1px solid rgba(180, 160, 120, 0.3)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            <textarea
              value={parentNote}
              onChange={(e) => setParentNote(e.target.value)}
              placeholder="תחומי עניין, אבני דרך, פחדים — כל מה שחשוב לכלול בסיפורים הבאים..."
              rows={6}
              className="w-full border-0 rounded-t-[20px] px-4 py-4 text-sm text-amber-950 placeholder:text-amber-700/40 resize-none focus:outline-none leading-[2]"
              style={{
                fontFamily: "'Heebo', sans-serif",
                background: "repeating-linear-gradient(transparent, transparent 31px, rgba(180,160,120,0.15) 31px, rgba(180,160,120,0.15) 32px)",
                backgroundPositionY: "27px",
              }}
              dir="rtl"
            />
            <div className="px-4 py-2 flex items-center justify-between border-t" style={{ borderColor: "rgba(180,160,120,0.2)", background: "#FDF8EC" }}>
              <p className="text-[10px]" style={{ color: "rgba(120,100,60,0.6)" }}>
                🔒 פנקס פרטי — רק אתם רואים
              </p>
              <Button
                onClick={saveParentNote}
                disabled={savingNote}
                size="sm"
                className={`font-bold rounded-xl text-xs px-4 h-8 transition-all ${
                  noteSaved
                    ? "bg-green-500 hover:bg-green-500 text-white"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                }`}
                style={{ boxShadow: "0 0 16px rgba(245, 158, 11, 0.4)" }}
              >
                <Save className="w-3.5 h-3.5 ml-1" />
                {noteSaved ? "נשמר! ✓" : savingNote ? "שומר..." : "שמירה"}
              </Button>
            </div>
          </div>
        </section>

        {/* Toolkit Navigation */}
        <Button
          onClick={() => navigate("/toolkit")}
          className="w-full py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg rounded-2xl"
          style={{ boxShadow: "0 0 24px rgba(245, 158, 11, 0.35), 0 8px 20px rgba(0,0,0,0.1)" }}
        >
          <Crown className="w-5 h-5 ml-2" />
          לארגז הכלים של <span dir="ltr">SolStorie's™</span>
          <span className="mr-2 text-xs bg-white/30 px-2 py-0.5 rounded-full font-bold">בקרוב</span>
        </Button>

        {/* Branded Footer */}
        <div className="pt-2">
          <GlobalFooter />
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Profile;
