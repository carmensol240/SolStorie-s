import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Sparkles, BookOpen, Palette, FileText, RefreshCw, Wand2, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import generatingHeroCast from "@/assets/generating-hero-cast.jpeg";
import castSolAdventure from "@/assets/cast-sol-adventure.jpg";
import castBenArt from "@/assets/cast-ben-art-new.jpg";
import castMiaNature from "@/assets/cast-mia-nature.jpg";
import castLeoScience from "@/assets/cast-leo-science.jpg";
import castZoeSports from "@/assets/cast-zoe-sports.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import ConfettiCelebration from "@/components/wizard/ConfettiCelebration";
import { StoryFormData } from "@/pages/CreateStory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { CHARACTER_SECTIONS } from "@/components/wizard/topic-data";
import { z } from "zod";

const emailSchema = z.string().email("כתובת אימייל לא תקינה");
const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");

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
  const { user, signInWithEmail, signUpWithEmail } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(() => Math.floor(Math.random() * EMPOWERING_SENTENCES.length));
  const [isSentenceVisible, setIsSentenceVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  // Inline signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupShowPassword, setSignupShowPassword] = useState(false);
  const [signupTermsAccepted, setSignupTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [signupMode, setSignupMode] = useState<"signup" | "login">("signup");
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupDismissed, setSignupDismissed] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);

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
      
      // Determine if this is a guest request
      const isGuest = false; // Guest generation disabled temporarily — require login
      
      try {
        const bodyPayload: any = {
            childName: formData.childName,
            childGender: formData.childGender,
            ageRange: formData.ageRange,
            storyLength: formData.storyLength,
            topic: topicLabel,
            topicId: formData.topic,
            isCustomTopic: formData.topic === "custom",
            topicDescription,
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
          const result = await supabase.functions.invoke("generate-story", {
            body: bodyPayload,
          });
          data = result.data;
          apiError = result.error;
        }
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
          toast({ title: "נדרשת התחברות", description: "אנא התחברו כדי ליצור סיפורים." });
          navigate("/auth?returnTo=/create");
          return;
        }
        if (apiError.message?.includes("429")) {
          throw new Error("יותר מדי בקשות, ננסה שוב בעוד רגע...");
        }
        throw apiError;
      }

      if (!data?.storyId) {
        console.error("[GeneratingStep] No storyId in response:", data);
        if (data?.error) throw new Error(data.error);
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
      setPhase('illustrations');
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
        setProgress(5);
        toast({ title: "יצירת הסיפור לקחה קצת יותר זמן ⏳", description: "מנסים שוב..." });
        await new Promise(resolve => setTimeout(resolve, delay));
        generateStory();
        return;
      }
      
      setError("not_created");
    }
  }, [formData, toast, navigate, signupDismissed]);

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
      
      if (pages && pages.length > 0 && pages.every(p => p.illustration_url)) {
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

    // 180-second safety timeout — only as last resort
    puzzleTimeoutRef.current = setTimeout(() => {
      console.log("[GeneratingStep] Safety timeout (180s) — allowing navigation");
      if (!illustrationsReady) {
        setProgress(100);
        setShowReadyPopup(true);
      }
    }, 180000);

    return () => {
      supabase.removeChannel(channel);
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

    // Only start generation for authenticated users
    if (!hasStartedRef.current && user) {
      hasStartedRef.current = true;
      generateStory();
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearInterval(sentenceInterval);
      clearInterval(keepaliveInterval);
      clearInterval(castInterval);
      clearInterval(tipInterval);
    };
  }, [generateStory, phase, toast]);

  // When user authenticates (after signup during loading), start generation
  // When user signs up during loading, start generation
  useEffect(() => {
    if (user && !hasStartedRef.current) {
      hasStartedRef.current = true;
      generateStory();
    }
  }, [user, generateStory]);

  // signupDismissed useEffect removed — generation starts immediately

  const saveChildToSupabase = async (userId: string) => {
    try {
      const ageMap: Record<string, number> = { "0-2": 1, "2-4": 3, "5-7": 6, "8-10": 9 };
      
      // Check for guest avatar saved before signup
      const guestAvatar = localStorage.getItem('guest_avatar_url');
      const avatarUrl = guestAvatar || formData.childAvatarUrl || null;
      
      await supabase.from("children").insert({
        user_id: userId,
        name: formData.childName,
        age: ageMap[formData.ageRange] || 5,
        gender: formData.childGender === "female" ? "girl" : "boy",
        personality_traits: formData.personalityTraits || null,
        fixed_details: formData.fixedDetails || null,
        photo_url: formData.childPhoto || null,
        avatar_url: avatarUrl,
        photo_consent: formData.photoConsent || false,
      });
      
      // Clear guest avatar after claiming
      if (guestAvatar) {
        localStorage.removeItem('guest_avatar_url');
        console.log('Guest avatar claimed and saved to child profile');
      }
    } catch (e) {
      console.warn("Failed to save child profile:", e);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailResult = emailSchema.safeParse(signupEmail);
    if (!emailResult.success) {
      toast({ title: "שגיאה", description: emailResult.error.errors[0].message, variant: "destructive" });
      return;
    }
    const passwordResult = passwordSchema.safeParse(signupPassword);
    if (!passwordResult.success) {
      toast({ title: "שגיאה", description: passwordResult.error.errors[0].message, variant: "destructive" });
      return;
    }
    if (signupMode === "signup" && !signupTermsAccepted) {
      toast({ title: "שגיאה", description: "יש לאשר את תנאי השימוש", variant: "destructive" });
      return;
    }

    setSignupSubmitting(true);
    try {
      if (signupMode === "login") {
        const { error } = await signInWithEmail(signupEmail, signupPassword);
        if (error) {
          toast({ title: "שגיאה בהתחברות", description: error.message, variant: "destructive" });
          return;
        }
      } else {
        const { error } = await signUpWithEmail(signupEmail, signupPassword, {
          display_name: signupEmail.split("@")[0],
        });
        if (error) {
          toast({ title: "שגיאה בהרשמה", description: error.message, variant: "destructive" });
          return;
        }
      }
      // Save child + accept terms
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await saveChildToSupabase(newUser.id);
        await supabase.from("profiles").update({
          terms_accepted_at: new Date().toISOString(),
          terms_version: "1.0",
          marketing_consent: marketingConsent,
        }).eq("id", newUser.id);
      }
      setSignupCompleted(true);
      toast({ title: "נרשמתם בהצלחה! 🎉", description: "הסיפור נוצר עכשיו..." });
    } catch (err) {
      console.error("Signup error:", err);
      toast({ title: "שגיאה", description: "אירעה שגיאה, נסו שוב", variant: "destructive" });
    } finally {
      setSignupSubmitting(false);
    }
  };

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

  const needsSignup = !user && !signupCompleted;

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
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-purple-100">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-purple-600 font-medium">{Math.round(progress)}%</p>
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
        <div className={`w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl border-4 border-purple-200/50 ${needsSignup ? 'max-h-32' : ''}`}>
          <img
            src={generatingHeroCast}
            alt="סול, בן, מיה, ליאו וזואי מחכים לך"
            className="w-full aspect-[16/9] object-cover"
          />
        </div>

        {/* Status text */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            {needsSignup 
              ? `✨ הסיפור של ${formData.childName} נוצר עכשיו...`
              : currentMessage.text
            }
          </h2>
          {needsSignup ? (
            <p className="text-purple-700/70 text-xs">
              זה לוקח כ-30 שניות, בזמן הזה...
            </p>
          ) : (
            <p className="text-purple-700/70 text-xs">
              {`יצירת סיפור מותאם אישית עבור ${formData.childName}`}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs space-y-1">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-purple-100">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 transition-all duration-300"
              style={{ width: `${needsSignup ? Math.min(progress, 15) : progress}%` }}
            />
          </div>
          {!needsSignup && (
            <p className="text-xs text-purple-600 font-medium">
              {Math.round(progress)}%
            </p>
          )}
        </div>

        {/* Rotating motivational sentence (signup view) */}
        {needsSignup && !signupDismissed && (
          <div className="w-full max-w-sm bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center min-h-[3.5rem] flex items-center justify-center">
            <p className={`text-sm font-medium text-purple-700 transition-opacity duration-500 ${isSentenceVisible ? 'opacity-100' : 'opacity-0'}`}>
              {EMPOWERING_SENTENCES[sentenceIndex]}
            </p>
          </div>
        )}
      </div>

      {/* Bottom: Signup form for unauthenticated users */}
      {needsSignup && !signupDismissed && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6 mt-4">
          <div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-purple-100/50 space-y-3">
            <div className="text-center space-y-1">
              <p className="text-base font-black text-purple-700">
                🌟 הירשמו לשמור את הסיפור!
              </p>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              disabled={googleLoading}
              onClick={async () => {
                setGoogleLoading(true);
                try {
                  // Persist form data before OAuth redirect
                  localStorage.setItem('pending_story_formData', JSON.stringify(formData));
                  localStorage.setItem('returnTo', '/create?resume=true');
                  const { lovable } = await import("@/integrations/lovable/index");
                  const result = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (result.error) {
                    toast({ title: "שגיאה", description: "ההתחברות עם Google נכשלה", variant: "destructive" });
                    localStorage.removeItem('pending_story_formData');
                  }
                  // If result.redirected, browser navigates away — nothing more to do
                } catch (err) {
                  console.error("Google sign-in error:", err);
                  toast({ title: "שגיאה", description: "אירעה שגיאה, נסו שוב", variant: "destructive" });
                  localStorage.removeItem('pending_story_formData');
                } finally {
                  setGoogleLoading(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-purple-100 hover:border-purple-200 hover:bg-purple-50/50 rounded-full py-2.5 px-4 text-sm font-bold text-gray-800 transition-all shadow-sm"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              המשיכו עם Google
            </button>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-purple-200/60" />
              <span className="text-[10px] text-muted-foreground font-medium">או</span>
              <div className="flex-1 h-px bg-purple-200/60" />
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-2.5">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSignupMode("signup")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                    signupMode === "signup"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                      : "bg-purple-50 text-purple-400"
                  }`}
                >
                  הרשמה
                </button>
                <button
                  type="button"
                  onClick={() => setSignupMode("login")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                    signupMode === "login"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                      : "bg-purple-50 text-purple-400"
                  }`}
                >
                  כבר יש לי חשבון
                </button>
              </div>

              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="אימייל"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="text-right pr-9 text-sm h-9 rounded-xl"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type={signupShowPassword ? "text" : "password"}
                  placeholder="סיסמה (6+ תווים)"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="text-right pr-9 pl-9 text-sm h-9 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setSignupShowPassword(!signupShowPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  {signupShowPassword ? (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>

              {signupMode === "signup" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="gen-terms"
                    checked={signupTermsAccepted}
                    onCheckedChange={(c) => setSignupTermsAccepted(c === true)}
                    className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 h-4 w-4"
                  />
                  <label htmlFor="gen-terms" className="text-[11px] text-muted-foreground cursor-pointer leading-tight">
                    קראתי ואני מסכימ/ה ל
                    <a href="/terms" target="_blank" className="text-purple-500 underline underline-offset-2 mx-0.5">
                      תנאי השימוש
                    </a>
                  </label>
                </div>
              )}

              {signupMode === "signup" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="gen-marketing"
                    checked={marketingConsent}
                    onCheckedChange={(c) => setMarketingConsent(c === true)}
                    className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 h-4 w-4"
                  />
                  <label htmlFor="gen-marketing" className="text-[11px] text-muted-foreground cursor-pointer leading-tight">
                    אני רוצה לקבל קופונים ומבצעים במייל (אופציונלי)
                  </label>
                </div>
              )}

              <Button
                type="submit"
                disabled={signupSubmitting || (signupMode === "signup" && !signupTermsAccepted)}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-black text-sm rounded-full py-2.5 h-auto disabled:opacity-40"
              >
                {signupSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : signupMode === "signup" ? (
                  "הירשמו בחינם ✨"
                ) : (
                  "התחברו ✨"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setSignupDismissed(true);
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                אולי אחר כך
              </button>
            </form>
          </div>
        </div>
      )}

      {/* When authenticated or dismissed — show the standard animated content */}
      {(!needsSignup || signupDismissed) && (
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

          {signupDismissed && !user && (
            <p className="text-sm text-orange-600 font-medium bg-orange-50 rounded-xl px-4 py-2">
              ⚠️ הסיפור לא יישמר ללא הרשמה
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GeneratingStep;
