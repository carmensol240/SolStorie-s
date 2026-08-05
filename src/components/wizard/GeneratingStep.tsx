import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Sparkles, BookOpen, FileText, RefreshCw, Wand2 } from "lucide-react";
import generatingHeroCast from "@/assets/generating-hero-cast.jpeg";
import castSolAdventure from "@/assets/cast-sol-adventure.jpg";
import castBenArt from "@/assets/cast-ben-art-new.jpg";
import castMiaNature from "@/assets/cast-mia-nature.jpg";
import castLeoScience from "@/assets/cast-leo-science.jpg";
import castZoeSports from "@/assets/cast-zoe-sports.jpg";
import { Button } from "@/components/ui/button";
import ConfettiCelebration from "@/components/wizard/ConfettiCelebration";
import { StoryFormData } from "@/pages/CreateStory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAnalytics } from "@/hooks/use-analytics";
import { CHARACTER_SECTIONS } from "@/components/wizard/topic-data";

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

const CAST_CHARACTERS = [
  { name: "סול", image: castSolAdventure, emoji: "🦸‍♀️", verb: "מכינה" },
  { name: "בן", image: castBenArt, emoji: "🎨", verb: "מכין" },
  { name: "מיה", image: castMiaNature, emoji: "🌿", verb: "מכינה" },
  { name: "ליאו", image: castLeoScience, emoji: "🔬", verb: "מכין" },
  { name: "זואי", image: castZoeSports, emoji: "⚽", verb: "מכינה" },
];

const PARENTING_TIPS = [
  { tip: "קריאה משותפת מחזקת את הקשר הרגשי בין הורה לילד ובונה ביטחון", icon: "💡" },
  { tip: "שאלו את ילדכם 'מה היית עושה?' — זה מפתח חשיבה ביקורתית ואמפתיה", icon: "🧠" },
  { tip: "ילדים שקוראים 20 דקות ביום נחשפים ל-1.8 מיליון מילים בשנה", icon: "📚" },
  { tip: "תנו לילד לבחור את הסיפור — זה מעצים תחושת שליטה וביטחון עצמי", icon: "⭐" },
  { tip: "הקריאה לפני השינה מורידה רמות סטרס ומכינה את המוח למנוחה", icon: "🌙" },
  { tip: "כשילדים רואים את עצמם בסיפור, הם לומדים לפתור בעיות דרך דמיון", icon: "✨" },
  { tip: "שיחה על רגשות הדמויות מפתחת אינטליגנציה רגשית אצל ילדים", icon: "❤️" },
  { tip: "חזרה על אותו סיפור אהוב בונה ביטחון ומחזקת את הזיכרון", icon: "🔄" },
];

const EMPOWERING_SENTENCES = [
  "✨ במילים שאתם בוחרים היום, אתם מעצבים את עולמו הפנימי של ילדכם מחר",
  "💛 הזמן שאתם משקיעים עכשיו בסיפור משותף, בונה את הביטחון של הילד שלכם מחר",
  "🎁 כל סיפור שאתם יוצרים הוא מתנה של דמיון ומרחב בטוח עבור ילדכם",
  "🌱 כל מילה שאתה מקריא היא זרע של סקרנות וצמיחה",
  "📖 בזמן שהסיפור נכתב, אתה כותב ביטחון ודמיון בלב של הילד שלך",
  "🌟 יש לך את הכוח להפוך כל רגע פשוט להרפתקה שתלווה אותו לכל החיים",
  "🌈 הקריאה המשותפת היא המקום שבו הילד שלך לומד לחלום בלי גבולות",
  "🧭 אתה המדריך הכי טוב של הילד שלך בעולמות הדמיון",
  "🦋 כל סיפור פותח דלת לעולם חדש של אפשרויות",
  "🏰 הדמיון של ילדכם הוא הטירה הכי חזקה שיש",
  "🎭 דרך הסיפורים ילדים לומדים להכיר רגשות ולהבין אחרים",
  "🔮 הקסם האמיתי הוא הרגע שבו ילד אומר — ׳עוד פעם!׳",
  "💫 סיפור אישי מלמד ילד שהוא חשוב, ייחודי ואהוב",
  "🎨 כל עמוד הוא בד ציור חדש לדמיון של ילדכם",
  "🌻 ילדים שגדלים עם סיפורים גדלים עם ביטחון ואמפתיה",
  "🫂 הסיפור שאתם יוצרים עכשיו יהפוך לזיכרון יקר לשניכם",
];

// Fisher-Yates shuffle helper
const shuffleArray = (arr: number[]): number[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

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
  const { trackEvent } = useAnalytics();
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(() => Math.floor(Math.random() * EMPOWERING_SENTENCES.length));
  const [isSentenceVisible, setIsSentenceVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  const [phase, setPhase] = useState<'text' | 'illustrations' | 'ready'>('text');
  const [storyId, setStoryId] = useState<string | null>(null);
  const [illustrationsReady, setIllustrationsReady] = useState(false);
  const [showReadyPopup, setShowReadyPopup] = useState(false);
  const puzzleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [castIndex, setCastIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isTipVisible, setIsTipVisible] = useState(true);
  const shuffledIndicesRef = useRef<number[]>(shuffleArray(Array.from({ length: EMPOWERING_SENTENCES.length }, (_, i) => i)));
  const shufflePosRef = useRef(0);

  // Build dynamic cast list including the child as a superhero
  const allCharacters = useMemo(() => {
    const base = [...CAST_CHARACTERS];
    if (formData.childAvatarUrl) {
      const childHero = {
        name: formData.childName || "הגיבור שלנו",
        image: formData.childAvatarUrl,
        emoji: "🦸",
        verb: formData.childGender === "female" ? "מכינה" : "מכין",
      };
      // Insert child at position 1 so they appear early
      base.splice(1, 0, childHero);
    }
    return base;
  }, [formData.childAvatarUrl, formData.childName, formData.childGender]);

  const isSessionExpiredError = useCallback((e: unknown): boolean => {
    const msg = e instanceof Error ? e.message : String((e as any)?.message ?? e ?? "");
    const name = (e as any)?.name ?? "";
    if (name === "AuthApiError" && /refresh.?token|invalid refresh/i.test(msg)) return true;
    return /refresh_token_not_found|Invalid Refresh Token|JWT expired|session_not_found/i.test(msg);
  }, []);

  const handleSessionExpired = useCallback(() => {
    try {
      localStorage.setItem('pending_story_formData', JSON.stringify(formData));
    } catch (e) {
      console.warn('[GeneratingStep] Failed to persist formData before re-login:', e);
    }
    try { supabase.auth.signOut(); } catch {}
    toast({
      title: "פג תוקף החיבור",
      description: "פג תוקף החיבור, אנא התחבר מחדש",
      variant: "destructive",
    });
    const returnTo = encodeURIComponent('/create?resume=true');
    navigate(`/auth?returnTo=${returnTo}`, { replace: true });
  }, [formData, navigate, toast]);

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

      const isCustom = formData.topic === "custom";
      // For custom (free-text) topics, do NOT send the user's text as the displayed topic.
      // It should only guide the prompt — never appear as a story page text or as the cover title.
      const topicLabel = isCustom
        ? (formData.language === "en" ? "A Personal Adventure" : "הרפתקה אישית")
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
      
      // Determine if this is a guest request
      const isGuest = false; // Guest generation disabled temporarily — require login
      
      try {
        const bodyPayload: any = {
            childName: formData.childName,
            childGender: formData.childGender,
            ageRange: formData.ageRange,
            childAge: formData.childAge,
            storyLength: formData.storyLength,
            topic: topicLabel,
            topicId: formData.topic,
            isCustomTopic: formData.topic === "custom",
            // For custom topics, pass the user's free-text as hidden prompt guidance only.
            topicDescription: isCustom ? (formData.customTopic || "") : topicDescription,
            nikud: formData.nikud,
            language: formData.language,
            childPhoto: formData.childPhoto,
            childAvatarUrl: formData.childAvatarUrl,
            personalityTraits: formData.personalityTraits,
            adventureLogic: formData.adventureLogic,
            className: formData.className || undefined,
            childId: (formData as any).childId || undefined,
        };
        
        if (isGuest) {
          bodyPayload.guestMode = true;
          // Use raw fetch for guest requests to avoid sending auth headers
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const resp = await fetch(`${supabaseUrl}/functions/v1/generate-story`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal,
          });
          if (!resp.ok) {
            const errBody = await resp.json().catch(() => ({}));
            throw new Error(errBody.error || `שגיאה ${resp.status}`);
          }
          data = await resp.json();
          apiError = null;
        } else {
          // Refresh session token before calling to avoid 401.
          // If the refresh token itself is invalid/expired, send the user back to login.
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
              const { error: refreshErr } = await supabase.auth.refreshSession();
              if (refreshErr) throw refreshErr;
            }
          } catch (refreshErr) {
            if (isSessionExpiredError(refreshErr)) {
              handleSessionExpired();
              return;
            }
            throw refreshErr;
          }
          const result = await supabase.functions.invoke("generate-story", {
            body: bodyPayload,
          });
          data = result.data;
          apiError = result.error;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (isSessionExpiredError(fetchError)) {
          handleSessionExpired();
          return;
        }
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error("הבקשה נכשלה בגלל timeout. נסו שוב.");
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

      if (apiError) {
        console.error("[GeneratingStep] Server error body:", data, apiError);
        const serverError = (data as any)?.error;
        const serverDebug = (data as any)?.debug;
        if (isSessionExpiredError(apiError)) {
          handleSessionExpired();
          return;
        }
        if (apiError.message?.includes("401") || apiError.message?.includes("נדרשת התחברות")) {
          toast({ title: "נדרשת התחברות", description: "אנא התחברו כדי ליצור סיפורים." });
          navigate("/auth?returnTo=/create");
          return;
        }
        if (apiError.message?.includes("429")) {
          throw new Error("יותר מדי בקשות, ננסה שוב בעוד רגע...");
        }
        // Billing/quota error — don't retry, show immediately
        if (apiError.message?.includes("שגיאת מערכת זמנית") || apiError.message?.includes("503")) {
          setError("שגיאת מערכת זמנית. נסו שוב בעוד מספר דקות.");
          return;
        }
        if (serverError) {
          throw new Error(serverError + (serverDebug ? ` — ${serverDebug}` : ""));
        }
        throw apiError;
      }

      if (!data?.storyId) {
        console.error("[GeneratingStep] No storyId in response:", data);
        if (data?.error) {
          if (data.error.includes("שגיאת מערכת זמנית")) {
            setError(data.error);
            return;
          }
          throw new Error(data.error);
        }
        throw new Error("לא התקבל מזהה סיפור מהשרת");
      }

      console.log("[GeneratingStep] Story created successfully with ID:", data.storyId);
      
      // For guest users, RLS blocks reading pages (user_id is null),
      // so skip client-side verification — trust the edge function response
      if (!isGuest) {
        const { data: pages, error: pagesError } = await supabase
          .from("story_pages")
          .select("id, text")
          .eq("story_id", data.storyId)
          .limit(1);
        
        if (pagesError || !pages || pages.length === 0 || !pages[0].text?.trim()) {
          console.error("[GeneratingStep] Story created but no text pages found:", { pagesError, pages });
          throw new Error("הסיפור נוצר אך ללא טקסט. מנסים שוב...");
        }
      }

      console.log("[GeneratingStep] Text verified. Moving to illustrations phase...");
      setStoryId(data.storyId);
      trackEvent({ eventType: "story_created", storyId: data.storyId });
      setPhase('illustrations');
      setProgress(50);
      
    } catch (err) {
      console.error("[GeneratingStep] Error generating story:", err);
      if (isSessionExpiredError(err)) {
        handleSessionExpired();
        return;
      }

      let errorMessage = "שגיאה לא ידועה";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (errorMessage.includes("Failed to send a request to the Edge Function") || errorMessage.includes("FunctionsRelayError") || errorMessage.includes("FunctionsFetchError")) {
          errorMessage = "בעיית תקשורת. בדקו את החיבור לאינטרנט ונסו שוב.";
        } else if (errorMessage.includes("FunctionsHttpError")) {
          errorMessage = "שגיאה בשרת. נסו שוב מאוחר יותר.";
        }
      }
      
      // Don't auto-retry billing/system errors
      if (errorMessage.includes("שגיאת מערכת זמנית")) {
        trackEvent({ eventType: "generation_failed", metadata: { reason: "system_error" } });
        setError(errorMessage);
        return;
      }

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current + 1), 10000);
        console.log(`[GeneratingStep] Auto-retrying (${retryCountRef.current}/${MAX_RETRIES}) after ${delay}ms...`);
        setProgress(5);
        toast({ title: "יצירת הסיפור לקחה קצת יותר זמן ⏳", description: "מנסים שוב..." });
        await new Promise(resolve => setTimeout(resolve, delay));
        generateStory();
        return;
      }
      
      trackEvent({ eventType: "generation_failed", metadata: { reason: errorMessage.slice(0, 200) } });
      setError("not_created");
    }
  }, [formData, toast, navigate, isSessionExpiredError, handleSessionExpired, trackEvent]);

  // Realtime subscription: watch for illustrations completing
  useEffect(() => {
    if (phase !== 'illustrations' || !storyId) return;

    // Check immediately if illustrations are already done
    const checkIllustrations = async () => {
      // Navigate immediately if story generation is complete
      const { data: storyData } = await supabase
        .from("stories")
        .select("generation_status")
        .eq("id", storyId)
        .single();

      if (storyData?.generation_status === 'ready') {
        console.log("[GeneratingStep] Story ready — navigating without waiting for illustrations");
        setIllustrationsReady(true);
        setProgress(100);
        setShowReadyPopup(true);
        setTimeout(() => {
          if (storyId && !hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            onComplete(storyId);
          }
        }, 1500);
        return;
      }

      // Fallback: check if all illustrations are done
      const { data: pages } = await supabase
        .from("story_pages")
        .select("id, illustration_url")
        .eq("story_id", storyId);
      
      if (pages && pages.length > 0) {
        const done = pages.filter(p => p.illustration_url).length;
        const total = pages.length;
        const illustrationProgress = 50 + (done / total) * 45;
        setProgress(prev => Math.max(prev, illustrationProgress));

        if (pages.every(p => p.illustration_url)) {
          console.log("[GeneratingStep] All illustrations ready!");
          setIllustrationsReady(true);
          setProgress(100);
          setShowReadyPopup(true);
          setTimeout(() => {
            if (storyId && !hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              onComplete(storyId);
            }
          }, 2500);
        }
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

    // Poll every 3 seconds as fallback for realtime
    const pollInterval = setInterval(() => {
      checkIllustrations();
    }, 3000);

    // 180-second safety timeout — only as last resort
    puzzleTimeoutRef.current = setTimeout(() => {
      console.log("[GeneratingStep] Safety timeout (180s) — allowing navigation");
      if (!illustrationsReady) {
        setProgress(100);
        setShowReadyPopup(true);
        // Auto-navigate after timeout
        setTimeout(() => {
          if (storyId && !hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            onComplete(storyId);
          }
        }, 1500);
      }
    }, 180000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      if (puzzleTimeoutRef.current) clearTimeout(puzzleTimeoutRef.current);
    };
  }, [phase, storyId, onComplete]);

  // Phase timers (text + illustrations)
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (phase === 'text') {
          if (prev >= 85) return prev;
          return prev + Math.random() * 3;
        }
        if (phase === 'illustrations') {
          if (prev >= 95) return prev;
          return prev + Math.random() * 0.5;
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
        shufflePosRef.current += 1;
        if (shufflePosRef.current >= shuffledIndicesRef.current.length) {
          shuffledIndicesRef.current = shuffleArray(Array.from({ length: EMPOWERING_SENTENCES.length }, (_, i) => i));
          shufflePosRef.current = 0;
        }
        setSentenceIndex(shuffledIndicesRef.current[shufflePosRef.current]);
        setIsSentenceVisible(true);
      }, 500);
    }, 4500);

    // Character & tip rotation for illustrations phase
    const castInterval = setInterval(() => {
      setCastIndex((prev) => (prev + 1) % allCharacters.length);
    }, 3500);

    const tipInterval = setInterval(() => {
      setIsTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % PARENTING_TIPS.length);
        setIsTipVisible(true);
      }, 400);
    }, 5000);



    // Auth is now guaranteed before reaching this step
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      generateStory();
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearInterval(sentenceInterval);
      
      clearInterval(castInterval);
      clearInterval(tipInterval);
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
    hasNavigatedRef.current = false;
    generateStory();
  };

  const handleOpenStory = () => {
    if (storyId && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      onComplete(storyId);
    }
  };

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] text-center space-y-6 px-6 bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3]" dir="rtl">
        <div className="w-28 h-28 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-5xl">😔</span>
        </div>
        <div className="space-y-3 max-w-sm">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            {error.includes("שגיאת מערכת") ? "עומס זמני במערכת" : "לא הצלחנו ליצור את הסיפור הפעם"}
          </h2>
          <p className="text-[#5B3E96] text-base leading-relaxed">
            {error.includes("שגיאת מערכת") ? "המערכת עמוסה כרגע, נסו שוב בעוד דקה 🙏" : "קורה לפעמים 🤗 רוצים לנסות שוב?"}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button 
            onClick={handleRetry} 
            size="lg" 
            className="gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white shadow-lg text-base px-8 py-6 rounded-2xl w-full"
          >
            <RefreshCw className="w-5 h-5" />
            נסו שוב ✨
          </Button>
          <Button 
            onClick={() => navigate("/")} 
            variant="ghost"
            size="lg" 
            className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-base rounded-2xl w-full"
          >
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  // --- ILLUSTRATIONS LOADING PHASE ---
  if (phase === 'illustrations') {
    const currentChar = allCharacters[castIndex % allCharacters.length];
    const currentTip = PARENTING_TIPS[tipIndex % PARENTING_TIPS.length];

    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] text-center space-y-5 bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3] p-6">
        {/* Confetti when ready */}
        {illustrationsReady && <ConfettiCelebration />}
        {/* Character carousel */}
        <div className="relative w-60 h-60 mx-auto">
          <div 
            key={castIndex}
            className="absolute inset-0 rounded-full overflow-hidden border-4 border-purple-200/60 shadow-xl animate-scale-in"
            style={{
              animation: 'scale-in 0.3s ease-out, pulse-glow 2.5s ease-in-out infinite',
            }}
          >
            <img
              src={currentChar.image}
              alt={currentChar.name}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 text-3xl animate-bounce">
            {currentChar.emoji}
          </span>
        </div>

        <p className="text-sm font-medium text-purple-600/80">
          {currentChar.name} {currentChar.verb} את האיורים... 🎨
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-xs space-y-2">
          <div
            className="relative h-3 w-full overflow-hidden rounded-full bg-purple-100"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="התקדמות יצירת הסיפור"
          >
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-purple-600 font-medium text-center" aria-live="polite">{Math.round(progress)}%</p>
        </div>

        {/* Parenting tip */}
        <div className="w-full max-w-sm bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-purple-100/50 min-h-[90px] flex items-center justify-center">
          <p
            className={`text-center text-sm leading-relaxed transition-opacity duration-500 ${
              isTipVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{ color: "#5B3E96", fontFamily: "'Varela Round', 'Heebo', sans-serif" }}
          >
            <span className="text-lg ml-1">{currentTip.icon}</span> {currentTip.tip}
          </p>
        </div>


        {/* Read story button — appears when ready */}
        {showReadyPopup && (
          <div className="animate-scale-in">
            <Button 
              onClick={handleOpenStory} 
              size="lg" 
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg text-lg px-8 py-6"
            >
              <BookOpen className="w-6 h-6" />
              קראו את הסיפור 📖
            </Button>
          </div>
        )}
      </div>
    );
  }

  // --- TEXT GENERATION PHASE ---
  const currentMessage = TEXT_MESSAGES[messageIndex % TEXT_MESSAGES.length];
  const Icon = currentMessage.icon;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3] overflow-y-auto" dir="rtl">
      {/* Top: Loading animation */}
      <div className="flex flex-col items-center text-center space-y-3 pt-6 px-4">
        {/* Compact hero + loading indicator */}
        <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl border-4 border-purple-200/50">
          <img
            src={generatingHeroCast}
            alt="סול, בן, מיה, ליאו וזואי מחכים לך"
            className="w-full aspect-[16/9] object-cover"
          />
        </div>

        {/* Status text */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            {currentMessage.text}
          </h2>
          <p className="text-purple-700/70 text-xs">
            {`יצירת סיפור מותאם אישית עבור ${formData.childName}`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs space-y-1">
          <div
            className="relative h-2.5 w-full overflow-hidden rounded-full bg-purple-100"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="התקדמות יצירת הסיפור"
          >
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-purple-600 font-medium text-center" aria-live="polite">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* Animated content for authenticated user */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4 pb-6">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 rounded-full flex items-center justify-center shadow-lg">
            <div className="relative">
              <Icon className={`w-8 h-8 ${currentMessage.color} animate-bounce`} />
              <Wand2
                className="absolute -top-2 -right-3 w-5 h-5 text-purple-600 animate-wiggle"
                style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))' }}
              />
            </div>
          </div>
        </div>

        {/* Rotating motivational sentence */}
        <div className="w-full max-w-sm bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center min-h-[4rem] flex items-center justify-center">
          <p className={`text-sm font-medium text-purple-700 transition-opacity duration-500 ${isSentenceVisible ? 'opacity-100' : 'opacity-0'}`}>
            {EMPOWERING_SENTENCES[sentenceIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneratingStep;
