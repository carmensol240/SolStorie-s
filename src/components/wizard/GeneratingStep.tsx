import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, BookOpen, Palette, FileText, RefreshCw, Wand2 } from "lucide-react";
import generatingHeroCast from "@/assets/generating-hero-cast.jpeg";
import { Button } from "@/components/ui/button";
import { StoryFormData } from "@/pages/CreateStory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { CHARACTER_SECTIONS } from "@/components/wizard/topic-data";
import PuzzleGame from "./PuzzleGame";

interface GeneratingStepProps {
  formData: StoryFormData;
  onComplete: (storyId: string) => void;
}

// Phase-aware loading messages
const TEXT_MESSAGES = [
  { icon: Sparkles, text: "הסיפור נכתב עבורך כעת...", color: "text-purple-500" },
  { icon: BookOpen, text: "בונים את העלילה...", color: "text-pink-500" },
  { icon: FileText, text: "יוצרים דפים קסומים...", color: "text-orange-400" },
];

const EMPOWERING_SENTENCES = [
  "במילים שאתם בוחרים היום, אתם מעצבים את עולמו הפנימי של ילדכם מחר",
  "הזמן שאתם משקיעים עכשיו בסיפור משותף, בונה את הביטחון של הילד שלכם מחר",
  "כל סיפור שאתם יוצרים הוא מתנה של דמיון ומרחב בטוח עבור ילדכם",
  "כל מילה שאתה מקריא היא זרע של סקרנות וצמיחה",
  "בזמן שהסיפור נכתב, אתה כותב ביטחון ודמיון בלב של הילד שלך",
  "יש לך את הכוח להפוך כל רגע פשוט להרפתקה שתלווה אותו לכל החיים",
  "הקריאה המשותפת היא המקום שבו הילד שלך לומד לחלום בלי גבולות",
  "אתה המדריך הכי טוב של הילד שלך בעולמות הדמיון",
];

const getTopicLabel = (topicId: string): string => {
  const topics: Record<string, string> = {
    "space-adventure": "הרפתקה בחלל - מסע בין כוכבים ופלאות",
    "magic-kingdom": "ממלכת הקסם - הרפתקה קסומה בארמון",
    "bedtime-story": "סיפור לפני השינה - סיפור מרגיע ללילה טוב עם פיל קורא ספרים",
    "body-hero": "הגיבור ששומר על הגוף - היגיינה ובריאות",
    "body-hero-teeth": "צחצוח שיניים קסום - עם פיית השיניים והדרקון",
    "body-hero-bath": "אמבטיה של כיף - בועות, ברווזון וקצף",
    "body-hero-hands": "שטיפת ידיים - מנצחים את החיידקים!",
    "body-hero-nails": "גזירת ציפורניים - עם הפיות הקסומות",
    "pacifier-fairy": "פיית המוצץ - נפרדים מהמוצץ בקסם",
    "friendship-courage": "חברות ואומץ לב - חברים חדשים והרפתקאות בגן",
    "zoo-adventure": "טיול בגן החיות - פוגשים חיות מדהימות",
    "family-trip": "טיול משפחתי - הרפתקה בטבע עם המשפחה",
    "birthday-party": "מסיבת יום הולדת - חוגגים עם החברים",
    fears: "התמודדות עם פחדים",
    friends: "חברויות חדשות",
    kindergarten: "יום ראשון בגן",
    siblings: "אח או אחות חדשה",
    confidence: "ביטחון עצמי",
    nature: "הרפתקה בטבע",
  };
  return topics[topicId] || topicId;
};

const GeneratingStep = ({ formData, onComplete }: GeneratingStepProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(() => Math.floor(Math.random() * EMPOWERING_SENTENCES.length));
  const [isSentenceVisible, setIsSentenceVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  const [phase, setPhase] = useState<'text' | 'puzzle' | 'ready'>('text');
  const [storyId, setStoryId] = useState<string | null>(null);
  const [illustrationsReady, setIllustrationsReady] = useState(false);
  const [showReadyPopup, setShowReadyPopup] = useState(false);
  const puzzleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateStory = useCallback(async () => {
    try {
      setPhase('text');

      if (!navigator.onLine) {
        setError("אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.");
        return;
      }
      const conn = (navigator as any).connection;
      if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') {
        toast({
          title: "חיבור חלש",
          description: "נראה שהחיבור לאינטרנט חלש. ייתכן שהיצירה תיקח יותר זמן.",
        });
      }

      const topicLabel = formData.topic === "custom" 
        ? formData.customTopic 
        : getTopicLabel(formData.topic);

      const allTopics = CHARACTER_SECTIONS.flatMap(s => s.topics);
      const selectedTopic = allTopics.find(t => t.id === formData.topic);
      const topicDescription = selectedTopic?.description ?? "";

      console.log("[GeneratingStep] Starting story generation...", { 
        childName: formData.childName, 
        topic: topicLabel,
        hasTopicDescription: !!topicDescription,
        attempt: retryCountRef.current + 1
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let data, apiError;
      
      try {
        const result = await supabase.functions.invoke("generate-story", {
          body: {
            childName: formData.childName,
            childGender: formData.childGender,
            ageRange: formData.ageRange,
            storyLength: formData.storyLength,
            topic: topicLabel,
            topicDescription,
            nikud: formData.nikud,
            language: formData.language,
            childPhoto: formData.childPhoto,
            childAvatarUrl: formData.childAvatarUrl,
            personalityTraits: formData.personalityTraits,
            adventureLogic: formData.adventureLogic,
            className: formData.className || undefined,
            childId: (formData as any).childId || undefined,
          },
        });
        
        data = result.data;
        apiError = result.error;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error("הבקשה נכשלה בגלל timeout. נסו שוב.");
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

      if (apiError) {
        console.error("API error:", apiError);
        if (apiError.message?.includes("401") || apiError.message?.includes("נדרשת התחברות")) {
          toast({ variant: "destructive", title: "נדרשת התחברות", description: "אנא התחברו כדי ליצור סיפורים." });
          navigate("/auth?returnTo=/create");
          return;
        }
        if (apiError.message?.includes("429")) {
          throw new Error("יותר מדי בקשות. נסו שוב בעוד מספר דקות.");
        }
        throw apiError;
      }

      if (!data?.storyId) {
        console.error("[GeneratingStep] No storyId in response:", data);
        if (data?.error) throw new Error(data.error);
        throw new Error("לא התקבל מזהה סיפור מהשרת");
      }

      console.log("[GeneratingStep] Story created successfully with ID:", data.storyId);
      
      const { data: pages, error: pagesError } = await supabase
        .from("story_pages")
        .select("id, text")
        .eq("story_id", data.storyId)
        .limit(1);
      
      if (pagesError || !pages || pages.length === 0 || !pages[0].text?.trim()) {
        console.error("[GeneratingStep] Story created but no text pages found:", { pagesError, pages });
        throw new Error("הסיפור נוצר אך ללא טקסט. מנסים שוב...");
      }

      console.log("[GeneratingStep] Text verified. Moving to puzzle phase...");
      setStoryId(data.storyId);
      setPhase('puzzle');
      setProgress(50);
      
    } catch (err) {
      console.error("[GeneratingStep] Error generating story:", err);
      
      let errorMessage = "שגיאה לא ידועה";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (errorMessage.includes("Failed to send a request to the Edge Function") || errorMessage.includes("FunctionsRelayError") || errorMessage.includes("FunctionsFetchError")) {
          errorMessage = "בעיית תקשורת. בדקו את החיבור לאינטרנט ונסו שוב.";
        } else if (errorMessage.includes("FunctionsHttpError")) {
          errorMessage = "שגיאה בשרת. נסו שוב מאוחר יותר.";
        }
      }
      
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current + 1), 10000);
        console.log(`[GeneratingStep] Auto-retrying (${retryCountRef.current}/${MAX_RETRIES}) after ${delay}ms...`);
        setProgress(0);
        await new Promise(resolve => setTimeout(resolve, delay));
        generateStory();
        return;
      }
      
      setError(`אירעה שגיאה ביצירת הסיפור: ${errorMessage}`);
      toast({ variant: "destructive", title: "שגיאה", description: "לא הצלחנו ליצור את הסיפור. אנא נסו שוב." });
    }
  }, [formData, onComplete, toast, navigate]);

  // Realtime subscription: watch for illustrations completing
  useEffect(() => {
    if (phase !== 'puzzle' || !storyId) return;

    // Check immediately if illustrations are already done
    const checkIllustrations = async () => {
      const { data: pages } = await supabase
        .from("story_pages")
        .select("id, illustration_url")
        .eq("story_id", storyId);
      
      if (pages && pages.length > 0 && pages.every(p => p.illustration_url)) {
        console.log("[GeneratingStep] All illustrations ready!");
        setIllustrationsReady(true);
        setShowReadyPopup(true);
      }
    };
    checkIllustrations();

    // Subscribe to changes
    const channel = supabase
      .channel(`puzzle-illustrations-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'story_pages',
          filter: `story_id=eq.${storyId}`,
        },
        async () => {
          await checkIllustrations();
        }
      )
      .subscribe();

    // 90-second timeout — show button regardless
    puzzleTimeoutRef.current = setTimeout(() => {
      console.log("[GeneratingStep] Puzzle timeout — allowing navigation");
      setShowReadyPopup(true);
    }, 90000);

    return () => {
      supabase.removeChannel(channel);
      if (puzzleTimeoutRef.current) clearTimeout(puzzleTimeoutRef.current);
    };
  }, [phase, storyId]);

  // Text phase timers
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (phase === 'text') {
          if (prev >= 85) return prev;
          return prev + Math.random() * 3;
        }
        return prev;
      });
    }, 500);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % TEXT_MESSAGES.length);
    }, 3000);

    const sentenceInterval = setInterval(() => {
      setIsSentenceVisible(false);
      setTimeout(() => {
        setSentenceIndex((prev) => (prev + 1) % EMPOWERING_SENTENCES.length);
        setIsSentenceVisible(true);
      }, 500);
    }, 4500);

    const keepaliveInterval = setInterval(async () => {
      if (phase !== 'text') return;
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: "HEAD",
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          signal: AbortSignal.timeout(5000),
        });
        if (!resp.ok) throw new Error("ping failed");
      } catch {
        console.warn("[GeneratingStep] Keepalive ping failed");
        toast({ title: "נראה שהחיבור לא יציב", description: "ממשיכים לנסות..." });
      }
    }, 15000);

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      generateStory();
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearInterval(sentenceInterval);
      clearInterval(keepaliveInterval);
    };
  }, [generateStory, phase, toast]);

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setPhase('text');
    setStoryId(null);
    setIllustrationsReady(false);
    setShowReadyPopup(false);
    retryCountRef.current = 0;
    hasStartedRef.current = false;
    generateStory();
  };

  const handleOpenStory = () => {
    if (storyId) onComplete(storyId);
  };

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] text-center space-y-6 px-4 bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3]">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
          <span className="text-5xl">😔</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{error}</h2>
          <p className="text-muted-foreground text-sm">לפעמים זה קורה. בואו ננסה שוב!</p>
        </div>
        <Button onClick={handleRetry} size="lg" className="gap-2">
          <RefreshCw className="w-5 h-5" />
          נסו שוב
        </Button>
      </div>
    );
  }

  // --- PUZZLE PHASE ---
  if (phase === 'puzzle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] text-center space-y-4 bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3] p-4 relative">
        <div className="space-y-1">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            הסיפור מוכן! האיורים בדרך... 🎨
          </h2>
          <p className="text-purple-700/70 text-sm">בינתיים בואו נשחק 🧩</p>
        </div>

        <PuzzleGame ageRange={formData.ageRange} />

        {/* Ready popup */}
        {showReadyPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs mx-4 animate-in zoom-in-95 duration-300">
              <span className="text-5xl">🎉</span>
              <h3 className="text-xl font-bold text-purple-700">
                {illustrationsReady ? "הסיפור שלך מוכן!" : "הסיפור מחכה לך!"}
              </h3>
              <p className="text-sm text-purple-600/70">
                {illustrationsReady 
                  ? "כל האיורים מוכנים. בואו נקרא!" 
                  : "חלק מהאיורים עדיין בדרך, אבל אפשר כבר לקרוא!"}
              </p>
              <Button 
                onClick={handleOpenStory} 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white w-full"
              >
                <BookOpen className="w-5 h-5" />
                פתחו את הסיפור 📖
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- TEXT GENERATION PHASE ---
  const currentMessage = TEXT_MESSAGES[messageIndex % TEXT_MESSAGES.length];
  const Icon = currentMessage.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] text-center space-y-5 bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3] p-6">
      {/* Hero Image */}
      <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl border-4 border-purple-200/50">
        <img
          src={generatingHeroCast}
          alt="סול, בן, מיה, ליאו וזואי מחכים לך"
          className="w-full aspect-[16/9] object-cover"
        />
      </div>

      {/* Animated Icon */}
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 rounded-full flex items-center justify-center shadow-lg">
          <div className="relative">
            <Icon className={`w-9 h-9 ${currentMessage.color} animate-bounce`} />
            <Wand2 
              className="absolute -top-2 -right-3 w-6 h-6 text-purple-600 animate-wiggle"
              style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))' }}
            />
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          {currentMessage.text}
        </h2>
        <p className="text-purple-700/70 text-sm">
          {`יצירת סיפור מותאם אישית עבור ${formData.childName}`}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs space-y-2">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-purple-100">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-purple-600 font-medium">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Empowering Sentence */}
      <div className="w-full max-w-sm px-4 min-h-[60px] flex items-center justify-center">
        <p
          className={`text-center text-base leading-relaxed transition-opacity duration-500 ${
            isSentenceVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            fontFamily: "'Varela Round', 'Heebo', sans-serif",
            color: "#5B3E96",
            textShadow: "0 1px 2px rgba(255,255,255,0.8)",
            fontWeight: 500,
          }}
        >
          "{EMPOWERING_SENTENCES[sentenceIndex]}"
        </p>
      </div>
    </div>
  );
};

export default GeneratingStep;
