import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, Save, Notebook, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MobileNavigation from "@/components/MobileNavigation";
import { SignedImage } from "@/components/ui/signed-image";
import heroBackground from "@/assets/hero-solstories-library.png";

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  gender: string | null;
  photo_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firstChild, setFirstChild] = useState<ChildProfile | null>(null);
  const [storyCount, setStoryCount] = useState(0);
  const [favoriteStory, setFavoriteStory] = useState<string | null>(null);
  const [parentNote, setParentNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

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

  // Fetch story count + favorite story
  useEffect(() => {
    if (!user) return;

    // Story count
    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setStoryCount(count ?? 0));

    // Favorite story: most read from user_story_stats, fallback to latest story
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
        // Fallback: latest story
        const { data: latest } = await supabase
          .from("stories")
          .select("topic")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setFavoriteStory(latest?.topic ?? null);
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
      toast.success("המחברת נשמרה בהצלחה ✨");
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSavingNote(false);
    }
  }, [user, parentNote]);

  const childName = firstChild?.name ?? "הילד/ה";
  const isFemale = firstChild?.gender === "female";

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
          className="w-full h-full object-cover"
          style={{ filter: "blur(25px) brightness(1.15) saturate(1.2)", transform: "scale(1.1)" }}
        />
        <div className="absolute inset-0 bg-white/30" />
      </div>

      <div className="w-full max-w-[550px] lg:max-w-[450px] mx-auto px-4 py-6 space-y-6">
        {/* Child Photo + Title */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div
            className="w-44 h-44 rounded-full overflow-hidden shadow-xl p-[5px]"
            style={{
              background: "linear-gradient(135deg, hsl(45, 90%, 55%), hsl(35, 95%, 65%), hsl(45, 90%, 55%))",
              boxShadow: "0 0 30px rgba(212, 175, 55, 0.4), 0 8px 32px rgba(0,0,0,0.15)",
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              {firstChild?.photo_url ? (
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

        {/* Stats Cards - Glassmorphism */}
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
              <span><BookOpen className="w-5 h-5 text-purple-600" /></span>
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
              <span><Heart className="w-5 h-5 text-amber-600" /></span>
            </div>
            <span className="text-sm font-bold text-center leading-tight line-clamp-2 min-h-[2.5rem] flex items-center" style={{ color: "hsl(260, 50%, 30%)" }}>
              {favoriteStory || "עדיין אין"}
            </span>
            <span className="text-xs font-medium text-center" style={{ color: "hsl(260, 30%, 40%)" }}>
              הסיפור ש{isFemale ? "הכי אוהבת" : "הכי אוהב"}
            </span>
          </div>
        </div>

        {/* Parent Notebook - Parchment Style */}
        <section className="space-y-3">
          <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "hsl(260, 40%, 30%)" }}>
            <span className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center">
              <Notebook className="w-4 h-4 text-amber-700" />
            </span>
            מחברת ההורה
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
              rows={5}
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
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs px-4 h-8"
                style={{ boxShadow: "0 0 16px rgba(245, 158, 11, 0.4)" }}
              >
                <Save className="w-3.5 h-3.5 ml-1" />
                {savingNote ? "שומר..." : "שמירה"}
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
          <span><Crown className="w-5 h-5 ml-2" /></span>
          לארגז הכלים של <span dir="ltr">SolStories</span>
          <span><Sparkles className="w-4 h-4 mr-2" /></span>
        </Button>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Profile;
