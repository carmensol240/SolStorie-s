import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, BookOpen, Palette, FileText, RefreshCw, Wand2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StoryFormData } from "@/pages/CreateStory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GeneratingStepProps {
  formData: StoryFormData;
  onComplete: (storyId: string) => void;
}

const LOADING_MESSAGES = [
  { icon: Sparkles, text: "מכינים את הקסם...", color: "text-purple-500" },
  { icon: BookOpen, text: "כותבים את הסיפור...", color: "text-pink-500" },
  { icon: Palette, text: "מציירים את האיורים...", color: "text-orange-400" },
  { icon: FileText, text: "מסיימים את הספר...", color: "text-purple-600" },
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
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [isSentenceVisible, setIsSentenceVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const generateStory = useCallback(async () => {
    try {
      const topicLabel = formData.topic === "custom" 
        ? formData.customTopic 
        : getTopicLabel(formData.topic);

      console.log("Starting story generation...", { 
        childName: formData.childName, 
        topic: topicLabel 
      });

      const { data, error: apiError } = await supabase.functions.invoke("generate-story", {
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

      if (apiError) {
        console.error("API error:", apiError);
        throw apiError;
      }

      if (!data?.storyId) {
        console.error("No storyId in response:", data);
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

      setProgress(100);
      
      setTimeout(() => {
        onComplete(data.storyId);
      }, 500);
      
    } catch (err) {
      console.error("Error generating story:", err);
      const errorMessage = err instanceof Error ? err.message : "שגיאה לא ידועה";
      setError(`אירעה שגיאה ביצירת הסיפור: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא הצלחנו ליצור את הסיפור. אנא נסו שוב.",
      });
    }
  }, [formData, onComplete, toast]);

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3] rounded-2xl p-6">
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
      <div className="w-full max-w-sm px-4 min-h-[80px] flex items-center justify-center">
        <p
          className={`text-center text-lg leading-relaxed transition-opacity duration-500 ${
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

      {/* Tip Card with theme colors */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-purple-200 max-w-xs">
        <p className="text-sm text-purple-700">
          💡 <strong className="text-purple-800">טיפ:</strong> התהליך לוקח בערך 1-2 דקות. בינתיים תוכלו להכין כוס קפה ☕
        </p>
      </div>
    </div>
  );
};

export default GeneratingStep;
