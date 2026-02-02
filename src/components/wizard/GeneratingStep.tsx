import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, BookOpen, Palette, FileText, RefreshCw } from "lucide-react";
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
  { icon: Sparkles, text: "מכינים את הקסם...", color: "text-accent" },
  { icon: BookOpen, text: "כותבים את הסיפור...", color: "text-primary" },
  { icon: Palette, text: "מציירים את האיורים...", color: "text-secondary" },
  { icon: FileText, text: "מסיימים את הספר...", color: "text-success" },
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

    // Generate story only once
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      generateStory();
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      {/* Animated Icon */}
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-full flex items-center justify-center animate-pulse">
          <Icon className={`w-12 h-12 ${currentMessage.color} animate-bounce-gentle`} />
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <Sparkles
              key={i}
              className="absolute w-4 h-4 text-accent animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{currentMessage.text}</h2>
        <p className="text-muted-foreground">
          יצירת סיפור מותאם אישית עבור {formData.childName}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs space-y-2">
        <Progress value={progress} className="h-3" />
        <p className="text-sm text-muted-foreground">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Tip */}
      <div className="bg-card rounded-xl p-4 comic-shadow border-2 border-foreground/10 max-w-xs">
        <p className="text-sm text-muted-foreground">
          💡 <strong>טיפ:</strong> התהליך לוקח בערך 1-2 דקות. בינתיים תוכלו להכין כוס קפה ☕
        </p>
      </div>
    </div>
  );
};

export default GeneratingStep;
