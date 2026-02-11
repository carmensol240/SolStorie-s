import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, Save, Notebook, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MobileNavigation from "@/components/MobileNavigation";
import { SignedImage } from "@/components/ui/signed-image";

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
      {/* Magical dark background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)] -z-10" />

      <div className="w-full max-w-[550px] lg:max-w-[450px] mx-auto px-4 py-6 space-y-6">
        {/* Child Photo + Title */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="w-44 h-44 rounded-full overflow-hidden border-[3px] border-transparent bg-gradient-to-br from-purple-400 to-pink-400 p-[4px] shadow-xl shadow-purple-500/30">
            <div className="w-full h-full rounded-full overflow-hidden bg-[hsl(260,60%,15%)]">
              {firstChild?.photo_url ? (
                <SignedImage
                  src={firstChild.photo_url}
                  alt={`תמונת ${childName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-6xl font-bold">
                  {childName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <h1 className="text-white text-2xl font-black">
            העולם של {childName} ✨
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Stories count */}
          <div className="bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-300" />
            </div>
            <span className="text-white text-3xl font-black">{storyCount}</span>
            <span className="text-white/60 text-xs font-medium text-center">סיפורים שיצרנו יחד</span>
          </div>

          {/* Favorite story */}
          <div className="bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-white text-sm font-bold text-center leading-tight line-clamp-2 min-h-[2.5rem] flex items-center">
              {favoriteStory || "עדיין אין"}
            </span>
            <span className="text-white/60 text-xs font-medium text-center">
              הסיפור ש{isFemale ? "הכי אוהבת" : "הכי אוהב"}
            </span>
          </div>
        </div>

        {/* Parent Notebook */}
        <section className="space-y-3">
          <h2 className="font-bold text-sm text-white/90 flex items-center gap-2">
            <span className="w-7 h-7 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Notebook className="w-4 h-4 text-amber-300" />
            </span>
            מחברת ההורה
          </h2>

          <div className="rounded-2xl overflow-hidden">
            <textarea
              value={parentNote}
              onChange={(e) => setParentNote(e.target.value)}
              placeholder="תחומי עניין, אבני דרך, פחדים — כל מה שחשוב לכלול בסיפורים הבאים..."
              rows={5}
              className="w-full bg-amber-50/90 border-0 rounded-t-2xl px-4 py-4 text-sm text-amber-950 placeholder:text-amber-700/40 resize-none focus:outline-none leading-relaxed"
              style={{ fontFamily: "'Heebo', sans-serif" }}
              dir="rtl"
            />
            <div className="bg-amber-50/70 px-4 py-2 flex items-center justify-between border-t border-amber-200/50">
              <p className="text-[10px] text-amber-700/50">
                🔒 פנקס פרטי — רק אתם רואים
              </p>
              <Button
                onClick={saveParentNote}
                disabled={savingNote}
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs px-4 h-8"
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
          className="w-full py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-amber-500/30"
        >
          <Crown className="w-5 h-5 ml-2" />
          לארגז הכלים של SoulStory
          <Sparkles className="w-4 h-4 mr-2" />
        </Button>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default Profile;
