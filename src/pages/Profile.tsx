import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, Users, ChevronLeft, Heart, BookOpen, Star, Notebook, MessageCircle, Target, Sparkles, Save, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MobileNavigation from "@/components/MobileNavigation";

const CARMIT_TIPS = [
  "כשקוראים סיפור יחד, נסו לעצור רגע ולשאול: מה הגיבור מרגיש עכשיו? זה מפתח אמפתיה מדהימה.",
  "תנו לילד לבחור את הנושא של הסיפור — כשהוא מרגיש שליטה, הוא נפתח רגשית.",
  "אחרי סיפור, שאלו: מה היית עושה במקום הגיבור? זה בונה חשיבה ביקורתית וביטחון.",
  "הקריאה המשותפת היא לא רק על הסיפור — זה הזמן שלכם יחד. תחבקו חזק.",
  "ילדים לומדים הכי טוב דרך דמויות שהם מזדהים איתן. לכן הילד שלכם הוא תמיד הגיבור.",
  "אל תפחדו מנושאים קשים בסיפור — ילדים צריכים מרחב בטוח לעבד רגשות.",
];

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  gender: string | null;
  hobbies: string | null;
  challenges: string | null;
  favorite_friends: string | null;
}

interface ParentNotes {
  discussion_topics: string;
  goals_reinforcements: string;
  magic_moments: string;
}

const AGE_RANGE_MAP: Record<number, string> = {
  0: "0-2", 1: "0-2", 2: "0-2",
  3: "3-6", 4: "3-6", 5: "3-6", 6: "3-6",
  7: "7-8", 8: "7-8",
};

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits } = useCredits();
  const { avatarUrl } = useChildAvatar();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [childEdits, setChildEdits] = useState<Record<string, Partial<ChildProfile>>>({});
  const [parentNotes, setParentNotes] = useState<ParentNotes>({
    discussion_topics: "",
    goals_reinforcements: "",
    magic_moments: "",
  });
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingChild, setSavingChild] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * CARMIT_TIPS.length));

  // Rotate tip every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % CARMIT_TIPS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Fetch child photo URL for the first child
  const [childPhotoUrl, setChildPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(data?.display_name || user.email?.split("@")[0] || null);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("children")
        .select("id, name, age, gender, hobbies, challenges, favorite_friends, photo_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const childrenData = (data as (ChildProfile & { photo_url?: string })[]) ?? [];
      setChildren(childrenData);
      // Set the first child's photo
      if (childrenData.length > 0 && childrenData[0].photo_url) {
        setChildPhotoUrl(childrenData[0].photo_url);
      }
    };
    fetchChildren();
  }, [user]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("parent_notes")
        .select("discussion_topics, goals_reinforcements, magic_moments")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setParentNotes({
          discussion_topics: data.discussion_topics || "",
          goals_reinforcements: data.goals_reinforcements || "",
          magic_moments: data.magic_moments || "",
        });
      }
    };
    fetchNotes();
  }, [user]);

  const handleChildFieldChange = (childId: string, field: string, value: string) => {
    setChildEdits((prev) => ({
      ...prev,
      [childId]: { ...prev[childId], [field]: value },
    }));
  };

  const saveChildDetails = useCallback(async (childId: string) => {
    const edits = childEdits[childId];
    if (!edits) return;
    setSavingChild(childId);
    try {
      const { error } = await supabase
        .from("children")
        .update({
          hobbies: edits.hobbies ?? undefined,
          challenges: edits.challenges ?? undefined,
          favorite_friends: edits.favorite_friends ?? undefined,
        })
        .eq("id", childId);
      if (error) throw error;
      setChildren((prev) =>
        prev.map((c) => (c.id === childId ? { ...c, ...edits } : c))
      );
      setChildEdits((prev) => {
        const next = { ...prev };
        delete next[childId];
        return next;
      });
      toast.success("הפרטים נשמרו בהצלחה ✨");
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSavingChild(null);
    }
  }, [childEdits]);

  const saveParentNotes = useCallback(async () => {
    if (!user) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("parent_notes")
        .upsert(
          {
            user_id: user.id,
            discussion_topics: parentNotes.discussion_topics,
            goals_reinforcements: parentNotes.goals_reinforcements,
            magic_moments: parentNotes.magic_moments,
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      toast.success("הפנקס נשמר בהצלחה ✨");
    } catch {
      toast.error("שגיאה בשמירת הפנקס");
    } finally {
      setSavingNotes(false);
    }
  }, [user, parentNotes]);

  const getChildValue = (child: ChildProfile, field: keyof ChildProfile) => {
    return (childEdits[child.id]?.[field] as string) ?? (child[field] as string) ?? "";
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col pb-20 overflow-y-auto relative"
      dir="rtl"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Magical dark background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)] -z-10" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              boxShadow: `0 0 ${4 + Math.random() * 8}px ${2 + Math.random() * 4}px rgba(255, 255, 255, 0.6)`,
            }}
          />
        ))}
      </div>

      {/* Centered container */}
      <div className="w-full max-w-[550px] lg:max-w-[450px] mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          {avatarUrl && (
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0">
              <img src={avatarUrl} alt="אווטר" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-lg font-bold truncate">
              שלום, {displayName || "משתמש"} 👋
            </h1>
            <p className="text-white/60 text-xs truncate">{user?.email}</p>
          </div>
          {/* Credits badge */}
          <button
            onClick={() => navigate("/upgrade")}
            className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 hover:bg-white/25 transition-all"
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span className="text-white font-bold text-sm">{credits ?? 0}</span>
            <span className="text-white/70 text-[10px]">קרדיטים</span>
          </button>
        </div>

        {/* Section A: The Child's World */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-white/90 flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Star className="w-4 h-4 text-amber-300" />
              </span>
              עולם הילד
            </h2>
            <button
              onClick={() => navigate("/children")}
              className="text-xs text-purple-300 hover:text-white flex items-center gap-0.5 font-medium transition-colors"
            >
              ניהול
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {children.length === 0 ? (
            <button
              onClick={() => navigate("/children")}
              className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-white/50 text-sm hover:border-white/40 hover:text-white/70 transition-colors backdrop-blur-sm"
            >
              + הוסיפו ילד/ה
            </button>
          ) : (
            <div className="space-y-3">
              {children.map((child) => {
                const isExpanded = expandedChild === child.id;
                const hasUnsaved = !!childEdits[child.id];
                return (
                  <div
                    key={child.id}
                    className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all"
                  >
                    {/* Child header */}
                    <button
                      onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-right"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                          {child.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{child.name}</p>
                          <p className="text-[10px] text-white/50">
                            גיל {child.age} · {child.gender === "female" ? "גיבורה" : "גיבור"} · טווח {AGE_RANGE_MAP[child.age] || `${child.age}`}
                          </p>
                        </div>
                      </div>
                      <ChevronLeft className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {/* Expandable fields */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                        <ChildField
                          icon={<Heart className="w-3.5 h-3.5 text-pink-300" />}
                          label="תחביבים ואהבות"
                          placeholder="למשל: דינוזאורים, חלל, ציור, כדורגל..."
                          value={getChildValue(child, "hobbies")}
                          onChange={(v) => handleChildFieldChange(child.id, "hobbies", v)}
                        />
                        <ChildField
                          icon={<BookOpen className="w-3.5 h-3.5 text-amber-300" />}
                          label="אתגרים נוכחיים"
                          placeholder="למשל: פחד מהחושך, בית ספר חדש..."
                          value={getChildValue(child, "challenges")}
                          onChange={(v) => handleChildFieldChange(child.id, "challenges", v)}
                        />
                        <ChildField
                          icon={<Users className="w-3.5 h-3.5 text-purple-300" />}
                          label="חברים וצעצועים אהובים"
                          placeholder="למשל: דובי הדוב, יואב מהגן..."
                          value={getChildValue(child, "favorite_friends")}
                          onChange={(v) => handleChildFieldChange(child.id, "favorite_friends", v)}
                        />
                        {hasUnsaved && (
                          <Button
                            onClick={() => saveChildDetails(child.id)}
                            disabled={savingChild === child.id}
                            size="sm"
                            className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-bold rounded-xl"
                          >
                            <Save className="w-3.5 h-3.5 ml-1" />
                            {savingChild === child.id ? "שומר..." : "שמירת שינויים"}
                          </Button>
                        )}
                        <p className="text-[10px] text-white/40 text-center">
                          ✨ פרטים אלו ישולבו אוטומטית בסיפורים חדשים
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section B: Parent's Magic Notebook */}
        <section className="space-y-3">
          <h2 className="font-bold text-sm text-white/90 flex items-center gap-2">
            <span className="w-7 h-7 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Notebook className="w-4 h-4 text-amber-300" />
            </span>
            פנקס הקסם להורה
          </h2>

          <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-4">
            <NotebookField
              icon={<MessageCircle className="w-3.5 h-3.5 text-purple-300" />}
              label="נקודות לשיחה"
              placeholder="נושאים שתרצו לדבר עליהם עם הילד/ה אחרי הקריאה..."
              value={parentNotes.discussion_topics}
              onChange={(v) => setParentNotes((p) => ({ ...p, discussion_topics: v }))}
            />
            <NotebookField
              icon={<Target className="w-3.5 h-3.5 text-green-300" />}
              label="משימות וחיזוקים"
              placeholder="מטרות חיוביות ומשימות קטנות לעידוד..."
              value={parentNotes.goals_reinforcements}
              onChange={(v) => setParentNotes((p) => ({ ...p, goals_reinforcements: v }))}
            />
            <NotebookField
              icon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              label="רגעים של קסם"
              placeholder="אבני דרך מיוחדות ורגעים קסומים שכדאי לזכור..."
              value={parentNotes.magic_moments}
              onChange={(v) => setParentNotes((p) => ({ ...p, magic_moments: v }))}
            />
            <Button
              onClick={saveParentNotes}
              disabled={savingNotes}
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl"
            >
              <Save className="w-3.5 h-3.5 ml-1" />
              {savingNotes ? "שומר..." : "שמירת הפנקס"}
            </Button>
            <p className="text-[10px] text-white/40 text-center">
              🔒 פנקס פרטי — רק אתם רואים את התוכן
            </p>
          </div>
        </section>
      </div>

      <MobileNavigation />
    </div>
  );
};

/* Reusable child field component */
const ChildField = ({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
    <label className="flex items-center gap-1.5 text-xs font-medium text-white/70">
      {icon}
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-purple-400/50 transition-colors"
    />
  </div>
);

/* Reusable notebook field component */
const NotebookField = ({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-bold text-white/80">
      {icon}
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-amber-400/50 transition-colors leading-relaxed"
      style={{ fontFamily: "'Heebo', sans-serif" }}
    />
  </div>
);

export default Profile;
