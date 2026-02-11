import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, BookOpen, Palette, FileText, RefreshCw, Wand2, Star } from "lucide-react";
import avatarTestimonial1 from "@/assets/avatar-testimonial-1.png";
import avatarTestimonial2 from "@/assets/avatar-testimonial-2.png";
import avatarTestimonial3 from "@/assets/avatar-testimonial-3.png";
import avatarTestimonial4 from "@/assets/avatar-testimonial-4.png";
import avatarTestimonial5 from "@/assets/avatar-testimonial-5.png";
import avatarParent1 from "@/assets/avatar-parent-1.png";
import avatarParent2 from "@/assets/avatar-parent-2.png";
import avatarParent3 from "@/assets/avatar-parent-3.png";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StoryFormData } from "@/pages/CreateStory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface GeneratingStepProps {
  formData: StoryFormData;
  onComplete: (storyId: string) => void;
}

const LOADING_MESSAGES = [
  { icon: Sparkles, text: "מכינים את הקסם...", color: "text-purple-500" },
  { icon: BookOpen, text: "כותבים את הסיפור...", color: "text-pink-500" },
  { icon: Palette, text: "מציירים איורים באיכות גבוהה...", color: "text-orange-400" },
  { icon: FileText, text: "עוד רגע והספר מוכן...", color: "text-purple-600" },
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
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  // Randomize initial indices so different content shows each time
  const [sentenceIndex, setSentenceIndex] = useState(() => Math.floor(Math.random() * EMPOWERING_SENTENCES.length));
  const [isSentenceVisible, setIsSentenceVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  // Shuffle testimonials once on mount for variety
  const [shuffledTestimonials] = useState(() => {
    const testimonials = [
      { name: "מיכל כהן", quote: "הילדה שלי מאושרת! כל לילה מבקשת לקרוא את הסיפור שלה שוב ושוב.", rating: 5, avatar: avatarTestimonial1 },
      { name: "ערן לוי", quote: "הילדים שלי אוהבים את הסיפורים. הם מרגישים כמו גיבורים אמיתיים.", rating: 5, avatar: avatarParent2 },
      { name: "שירה אברהם", quote: "האיורים מדהימים והסיפורים מותאמים בצורה מושלמת לגיל.", rating: 5, avatar: avatarTestimonial2 },
      { name: "יוסי דוד", quote: "יצרנו סיפור על הפחד מהחושך והילד שלי התגבר על הפחד תוך שבוע!", rating: 5, avatar: avatarParent1 },
      { name: "נועה פרידמן", quote: "מתנה מושלמת לסבא וסבתא – סיפור עם הנכדים בתור הגיבורים!", rating: 5, avatar: avatarTestimonial3 },
      { name: "דני רוזנברג", quote: "הילד שלי לא מפסיק לבקש עוד סיפורים! מתלהב כל פעם מחדש.", rating: 5, avatar: avatarParent3 },
    ];
    for (let i = testimonials.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [testimonials[i], testimonials[j]] = [testimonials[j], testimonials[i]];
    }
    return testimonials;
  });

  const generateStory = useCallback(async () => {
    try {
      const topicLabel = formData.topic === "custom" 
        ? formData.customTopic 
        : getTopicLabel(formData.topic);

      console.log("Starting story generation...", { 
        childName: formData.childName, 
        topic: topicLabel 
      });

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      let data, apiError;
      
      try {
        const result = await supabase.functions.invoke("generate-story", {
          body: {
            childName: formData.childName,
            childGender: formData.childGender,
            ageRange: formData.ageRange,
            storyLength: formData.storyLength,
            topic: topicLabel,
            nikud: formData.nikud,
            childPhoto: formData.childPhoto,
            childAvatarUrl: formData.childAvatarUrl,
            personalityTraits: formData.personalityTraits,
            adventureLogic: formData.adventureLogic,
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
        // Check for specific error types
        if (apiError.message?.includes("401") || apiError.message?.includes("נדרשת התחברות")) {
          toast({
            variant: "destructive",
            title: "נדרשת התחברות",
            description: "אנא התחברו כדי ליצור סיפורים.",
          });
          // Redirect to login with return path
          navigate("/auth?returnTo=/create");
          return;
        }
        if (apiError.message?.includes("429")) {
          throw new Error("יותר מדי בקשות. נסו שוב בעוד מספר דקות.");
        }
        throw apiError;
      }

      if (!data?.storyId) {
        console.error("No storyId in response:", data);
        // Check if there's an error message in the response
        if (data?.error) {
          throw new Error(data.error);
        }
        throw new Error("לא התקבל מזהה סיפור מהשרת");
      }

      console.log("Story created successfully with ID:", data.storyId);

      // Verify the story exists before redirecting
      const { data: verifiedStory, error: verifyError } = await supabase
        .from("stories")
        .select("id")
        .eq("id", data.storyId)
        .maybeSingle();

      if (verifyError) {
        console.error("Verification error:", verifyError);
        // Still proceed if we got a storyId - RLS might prevent reading but story exists
      }

      if (!verifiedStory) {
        console.warn("Story not immediately readable (may be RLS), proceeding anyway");
      }

      // Don't navigate yet - wait for illustrations to finish
      // Poll for generation_status === 'ready'
      setProgress(60);
      const pollStart = Date.now();
      const POLL_TIMEOUT = 120000; // 2 minutes max wait for illustrations
      
      const pollForReady = async () => {
        const elapsed = Date.now() - pollStart;
        
        // Timeout - proceed anyway
        if (elapsed >= POLL_TIMEOUT) {
          console.log("⏱️ Illustration poll timeout - proceeding to story");
          setProgress(100);
          setTimeout(() => onComplete(data.storyId), 500);
          return;
        }

        try {
          const { data: statusData } = await supabase
            .from("stories")
            .select("generation_status")
            .eq("id", data.storyId)
            .maybeSingle();

          const status = (statusData as any)?.generation_status || 'ready';
          
          if (status === 'ready') {
            console.log("✅ Story fully ready with illustrations");
            setProgress(100);
            setTimeout(() => onComplete(data.storyId), 500);
            return;
          }
          
          if (status === 'failed') {
            console.error("Story generation failed");
            setError("אירעה שגיאה ביצירת האיורים. נסו שוב.");
            return;
          }

          // Check illustration progress for the progress bar
          const { data: pagesData } = await supabase
            .from("story_pages")
            .select("illustration_url")
            .eq("story_id", data.storyId);

          if (pagesData && pagesData.length > 0) {
            const done = pagesData.filter(p => p.illustration_url).length;
            const pct = 60 + Math.round((done / pagesData.length) * 35); // 60-95%
            setProgress(pct);
          }

          // Poll again in 3 seconds
          setTimeout(pollForReady, 3000);
        } catch (err) {
          console.error("Poll error:", err);
          // On error, just proceed
          setProgress(100);
          setTimeout(() => onComplete(data.storyId), 500);
        }
      };

      // Start polling after a short delay
      setTimeout(pollForReady, 3000);
      
    } catch (err) {
      console.error("Error generating story:", err);
      
      // Extract meaningful error message
      let errorMessage = "שגיאה לא ידועה";
      if (err instanceof Error) {
        errorMessage = err.message;
        // Clean up technical error messages
        if (errorMessage.includes("FunctionsHttpError")) {
          errorMessage = "שגיאה בשרת. נסו שוב מאוחר יותר.";
        } else if (errorMessage.includes("FunctionsRelayError")) {
          errorMessage = "בעיית תקשורת. בדקו את החיבור לאינטרנט.";
        }
      }
      
      setError(`אירעה שגיאה ביצירת הסיפור: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא הצלחנו ליצור את הסיפור. אנא נסו שוב.",
      });
    }
  }, [formData, onComplete, toast, navigate]);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 500);

    // Message rotation
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    // Empowering sentence rotation with fade effect
    const sentenceInterval = setInterval(() => {
      setIsSentenceVisible(false);
      setTimeout(() => {
        setSentenceIndex((prev) => (prev + 1) % EMPOWERING_SENTENCES.length);
        setIsSentenceVisible(true);
      }, 500);
    }, 4500);

    // Generate story only once
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      generateStory();
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearInterval(sentenceInterval);
    };
  }, [generateStory]);

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    hasStartedRef.current = false;
    generateStory();
  };

  const currentMessage = LOADING_MESSAGES[messageIndex];
  const Icon = currentMessage.icon;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] text-center space-y-6 px-4 bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3]">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
          <span className="text-5xl">😔</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{error}</h2>
          <p className="text-muted-foreground text-sm">
            לפעמים זה קורה. בואו ננסה שוב!
          </p>
        </div>
        <Button
          onClick={handleRetry}
          size="lg"
          className="gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          נסו שוב
        </Button>
      </div>
    );
  }

  const currentTestimonial = shuffledTestimonials[sentenceIndex % shuffledTestimonials.length];

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] text-center space-y-6 bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3] p-6">
      {/* Animated Icon with Magic Wand */}
      <div className="relative">
        <div className="w-28 h-28 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 rounded-full flex items-center justify-center shadow-lg">
          <div className="relative">
            <Icon className={`w-12 h-12 ${currentMessage.color} animate-bounce`} />
            {/* Animated Magic Wand */}
            <Wand2 
              className="absolute -top-2 -right-4 w-8 h-8 text-purple-600 animate-wiggle"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))'
              }}
            />
          </div>
        </div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <Sparkles
              key={i}
              className="absolute w-4 h-4 text-orange-400 animate-pulse"
              style={{
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>

      {/* Message with gradient text */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          {currentMessage.text}
        </h2>
        <p className="text-purple-700/70">
          יצירת סיפור מותאם אישית עבור {formData.childName}
        </p>
        <p className="text-sm text-purple-500/80 mt-1 animate-pulse">
          ✨ עוד רגע קט והקסם מתחיל...
        </p>
      </div>

      {/* Progress Bar with gradient */}
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

      {/* Empowering NLP Sentence */}
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

      {/* Parent Testimonials - Professional Carousel Cards */}
      <div className="w-full max-w-sm space-y-2">
        <h3 className="text-center text-sm font-bold text-purple-700">
          הורים ממליצים ✨
        </h3>
        <div
          className={`bg-white rounded-xl p-4 shadow-lg border border-purple-100 transition-opacity duration-500 ${
            isSentenceVisible ? "opacity-100" : "opacity-0"
          }`}
          dir="rtl"
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <img
              src={currentTestimonial.avatar}
              alt={currentTestimonial.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-200 shrink-0"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-purple-800">{currentTestimonial.name}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= currentTestimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-purple-600 leading-relaxed">
                "{currentTestimonial.quote}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratingStep;
