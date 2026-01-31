import { Rocket, Crown, Moon, Sparkles, Heart, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";

interface TopicStepProps {
  formData: StoryFormData;
  updateFormData: (updates: Partial<StoryFormData>) => void;
}

// Adventure categories with predefined outfit, background, and theme logic
const ADVENTURE_CATEGORIES = [
  { 
    id: "space-adventure", 
    label: "הרפתקה בחלל", 
    emoji: "🚀",
    icon: Rocket, 
    color: "from-indigo-500 to-purple-600",
    description: "מסע בין כוכבים ופלאות",
    logic: {
      outfit: "astronaut spacesuit with helmet",
      background: "outer space with stars, planets, and galaxies",
      theme: "exploration and discovery"
    }
  },
  { 
    id: "magic-kingdom", 
    label: "ממלכת הקסם", 
    emoji: "👑",
    icon: Crown, 
    color: "from-pink-500 to-rose-600",
    description: "הרפתקה קסומה בארמון",
    logic: {
      outfit: "royal prince/princess attire with crown",
      background: "magical castle with towers and enchanted gardens",
      theme: "fantasy and magic"
    }
  },
  { 
    id: "bedtime-story", 
    label: "סיפור לפני השינה", 
    emoji: "🌙",
    icon: Moon, 
    color: "from-blue-500 to-indigo-600",
    description: "סיפור מרגיע ללילה טוב",
    logic: {
      outfit: "cozy pajamas with soft slippers",
      background: "enchanted forest at twilight with fireflies and moonlight",
      theme: "calming and peaceful bedtime adventure"
    }
  },
  { 
    id: "body-hero", 
    label: "הגיבור ששומר על הגוף", 
    emoji: "🦷",
    icon: Sparkles, 
    color: "from-emerald-500 to-teal-600",
    description: "לומדים על היגיינה ובריאות",
    logic: {
      outfit: "everyday casual clothes at home",
      background: "bright bathroom and cozy home environment",
      theme: "hygiene, teeth brushing, and taking care of the body"
    }
  },
  { 
    id: "friendship-courage", 
    label: "חברות ואומץ לב", 
    emoji: "🦁",
    icon: Heart, 
    color: "from-amber-500 to-orange-600",
    description: "חברים חדשים והרפתקאות",
    logic: {
      outfit: "everyday casual clothes suitable for playing",
      background: "colorful school playground or sunny park with trees",
      theme: "social skills, making friends, and showing courage"
    }
  },
];

const TopicStep = ({ formData, updateFormData }: TopicStepProps) => {
  const handleCategorySelect = (categoryId: string) => {
    const category = ADVENTURE_CATEGORIES.find(c => c.id === categoryId);
    if (category) {
      updateFormData({ 
        topic: categoryId,
        customTopic: "",
        // Store the logic for AI prompt generation
        adventureLogic: category.logic
      });
    }
  };

  const handleCustomTopicChange = (value: string) => {
    updateFormData({ 
      customTopic: value,
      topic: value.trim() ? "custom" : "",
      adventureLogic: undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">בחרו את ההרפתקה</h1>
        <p className="text-muted-foreground">איזה סיפור תרצו ליצור היום?</p>
      </div>

      {/* Adventure Categories Grid */}
      <div className="space-y-3">
        {ADVENTURE_CATEGORIES.map((category) => {
          const isSelected = formData.topic === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200",
                "text-right",
                isSelected
                  ? "border-primary bg-primary/10 comic-shadow scale-[1.02]"
                  : "border-foreground/10 bg-card hover:border-primary/50 hover:bg-card/80"
              )}
            >
              {/* Icon with gradient background */}
              <div className={cn(
                "flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl",
                category.color
              )}>
                <span role="img" aria-label={category.label}>
                  {category.emoji}
                </span>
              </div>
              
              {/* Text content */}
              <div className="flex-1 text-right">
                <h3 className="font-bold text-lg">{category.label}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-foreground/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-sm text-muted-foreground">או</span>
        </div>
      </div>

      {/* Custom Topic */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-accent" />
          <Label htmlFor="customTopic" className="text-base font-medium">
            נושא משלכם
          </Label>
        </div>
        <Textarea
          id="customTopic"
          placeholder="ספרו לנו על מה הסיפור, מי הדמויות, מה קורה בהתחלה ובסוף - ככל שתוסיפו יותר פרטים, כך הסיפור יהיה מדויק ומותאם אישית יותר!"
          value={formData.customTopic}
          onChange={(e) => handleCustomTopicChange(e.target.value)}
          className={cn(
            "min-h-24 text-base bg-card border-2 rounded-xl resize-none",
            formData.customTopic.trim() 
              ? "border-primary comic-shadow" 
              : "border-foreground/10"
          )}
          dir="rtl"
        />
        <p className="text-xs text-muted-foreground">
          כתבו כמה שיותר פרטים על מנת שהספר יהיה מושלם ✨
        </p>
      </div>
    </div>
  );
};

export default TopicStep;
