import { useRef } from "react";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";

// Topic images - new uploaded images
import topicTeethBrushing from "@/assets/topic-teeth-brushing.jpg";
import topicBathShower from "@/assets/topic-bath-shower.jpg";
import topicNailTrimming from "@/assets/topic-nail-trimming.jpg";
import topicHandWashing from "@/assets/topic-hand-washing.jpg";
import topicZoo from "@/assets/topic-zoo.jpg";
import topicFamilyTrip from "@/assets/topic-family-trip.jpg";
import topicMagicCastle from "@/assets/topic-magic-castle.jpg";
import topicSpaceHero from "@/assets/topic-space-hero.jpg";
import topicBirthday from "@/assets/topic-birthday.jpg";
// Keep existing images for categories without new uploads
import topicPacifier from "@/assets/topic-pacifier.jpg";
import topicBedtime from "@/assets/topic-bedtime.jpg";
import topicFriendship from "@/assets/topic-friendship.jpg";

interface TopicStepProps {
  formData: StoryFormData;
  updateFormData: (updates: Partial<StoryFormData>) => void;
}

// Define adventure logic type
interface AdventureLogic {
  outfit: string;
  background: string;
  theme: string;
}

interface AdventureTopic {
  id: string;
  label: string;
  image: string;
  description: string;
  logic: AdventureLogic;
}

interface AdventureCategory {
  id: string;
  title: string;
  emoji: string;
  topics: AdventureTopic[];
}

// Organized by category with Hebrew headers
const ADVENTURE_CATEGORIES: AdventureCategory[] = [
  {
    id: "habits-daily",
    title: "הרגלים ויומיום",
    emoji: "🧼",
    topics: [
      { 
        id: "body-hero-teeth", 
        label: "צחצוח שיניים קסום", 
        image: topicTeethBrushing,
        description: "עם פיית השיניים והדרקון",
        logic: {
          outfit: "everyday casual clothes at home",
          background: "bright magical bathroom with sparkles and friendly dental fairy dragon",
          theme: "teeth brushing, dental hygiene, making brushing fun"
        }
      },
      { 
        id: "body-hero-bath", 
        label: "אמבטיה של כיף", 
        image: topicBathShower,
        description: "בועות, ברווזון וקצף",
        logic: {
          outfit: "bath time with rubber ducky cap",
          background: "colorful bubble bath with floating toys and rainbow bubbles",
          theme: "bath time fun, getting clean, water play"
        }
      },
      { 
        id: "body-hero-hands", 
        label: "שטיפת ידיים", 
        image: topicHandWashing,
        description: "מנצחים את החיידקים!",
        logic: {
          outfit: "everyday casual clothes",
          background: "bright colorful bathroom with soap bubbles and friendly germs being washed away",
          theme: "hand hygiene, washing hands, staying healthy"
        }
      },
      { 
        id: "body-hero-nails", 
        label: "גזירת ציפורניים", 
        image: topicNailTrimming,
        description: "עם הפיות הקסומות",
        logic: {
          outfit: "everyday casual clothes",
          background: "magical bathroom with fairies and sparkles, friendly nail clippers",
          theme: "nail trimming, grooming routine, overcoming fear of nail cutting"
        }
      },
      { 
        id: "bedtime-story", 
        label: "סיפור לפני השינה", 
        image: topicBedtime,
        description: "עם הפיל הקורא ספרים",
        logic: {
          outfit: "cozy pajamas with soft slippers",
          background: "enchanted bedroom at night with moonlight, stars, and reading elephant friend",
          theme: "calming and peaceful bedtime adventure, good night routine"
        }
      },
      { 
        id: "pacifier-fairy", 
        label: "פיית המוצץ", 
        image: topicPacifier,
        description: "נפרדים מהמוצץ בקסם",
        logic: {
          outfit: "cozy pajamas",
          background: "magical nursery with sparkles and gentle fairy",
          theme: "saying goodbye to pacifier, growing up, milestone transition"
        }
      },
    ]
  },
  {
    id: "friends-emotions",
    title: "חברים ורגשות",
    emoji: "💕",
    topics: [
      { 
        id: "friendship-courage", 
        label: "חברים בגן", 
        image: topicFriendship,
        description: "משחקים בארגז החול",
        logic: {
          outfit: "everyday casual clothes suitable for playing",
          background: "colorful kindergarten playground with sandbox and sunny weather",
          theme: "social skills, making friends, playing together, sharing"
        }
      },
      { 
        id: "zoo-adventure", 
        label: "טיול בגן החיות", 
        image: topicZoo,
        description: "פוגשים חיות מדהימות",
        logic: {
          outfit: "comfortable outdoor clothes with backpack",
          background: "colorful zoo with friendly animals, fences, trees",
          theme: "animal discovery, nature, adventure and exploration"
        }
      },
      { 
        id: "family-trip", 
        label: "טיול משפחתי", 
        image: topicFamilyTrip,
        description: "הרפתקה בטבע עם המשפחה",
        logic: {
          outfit: "hiking clothes with backpack",
          background: "beautiful nature trail with trees, stream, flowers, and dog",
          theme: "family bonding, nature exploration, outdoor adventure"
        }
      },
    ]
  },
  {
    id: "celebrating",
    title: "חוגגים ונהנים",
    emoji: "🎉",
    topics: [
      { 
        id: "birthday-party", 
        label: "מסיבת יום הולדת", 
        image: topicBirthday,
        description: "חוגגים עם החברים",
        logic: {
          outfit: "party clothes, festive attire",
          background: "colorful kindergarten or party venue with cake, decorations, friends",
          theme: "birthday celebration, friendship, sharing joy"
        }
      },
    ]
  },
  {
    id: "adventures-magic",
    title: "הרפתקאות וקסמים",
    emoji: "✨",
    topics: [
      { 
        id: "space-adventure", 
        label: "הרפתקה בחלל", 
        image: topicSpaceHero,
        description: "מסע בין כוכבים ופלאות",
        logic: {
          outfit: "astronaut spacesuit with helmet",
          background: "outer space with stars, planets, and galaxies",
          theme: "exploration and discovery in space"
        }
      },
      { 
        id: "magic-kingdom", 
        label: "ממלכת הקסם", 
        image: topicMagicCastle,
        description: "הרפתקה קסומה בארמון",
        logic: {
          outfit: "royal prince/princess attire with crown",
          background: "magical castle with towers and enchanted gardens",
          theme: "fantasy and magic in a royal kingdom"
        }
      },
    ]
  },
];

// Flatten all topics for lookup
const ALL_TOPICS = ADVENTURE_CATEGORIES.flatMap(cat => cat.topics);

// Carousel component for each category
const CategoryCarousel = ({ 
  category, 
  selectedTopic, 
  onSelect 
}: { 
  category: AdventureCategory;
  selectedTopic: string;
  onSelect: (topic: AdventureTopic) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 180;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Category Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>{category.emoji}</span>
          <span>{category.title}</span>
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('right')}
            aria-label="הקודם"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('left')}
            aria-label="הבא"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal Scrolling Cards */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {category.topics.map((topic) => {
          const isSelected = selectedTopic === topic.id;
          
          return (
            <button
              key={topic.id}
              onClick={() => onSelect(topic)}
              className={cn(
                "flex-shrink-0 w-36 overflow-hidden rounded-2xl border-3 transition-all duration-200",
                "text-right flex flex-col shadow-md",
                isSelected
                  ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                  : "border-transparent hover:border-primary/50"
              )}
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Image */}
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <img
                  src={topic.image}
                  alt={topic.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="text-primary-foreground text-sm">✓</span>
                  </div>
                )}
                
                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                  <h4 className="font-bold text-sm leading-tight">{topic.label}</h4>
                  <p className="text-[10px] text-white/80 leading-tight mt-0.5 line-clamp-2">{topic.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TopicStep = ({ formData, updateFormData }: TopicStepProps) => {
  const handleTopicSelect = (topic: AdventureTopic) => {
    updateFormData({ 
      topic: topic.id,
      customTopic: "",
      adventureLogic: topic.logic
    });
  };

  const handleCustomTopicChange = (value: string) => {
    updateFormData({ 
      customTopic: value,
      topic: value.trim() ? "custom" : "",
      adventureLogic: undefined
    });
  };

  return (
    <div className="space-y-5 -mx-3">
      {/* Title */}
      <div className="text-center space-y-1 px-3">
        <h1 className="text-2xl font-bold">בחרו את ההרפתקה</h1>
        <p className="text-muted-foreground text-sm">איזה סיפור תרצו ליצור היום?</p>
      </div>

      {/* Category Carousels */}
      <div className="space-y-5">
        {ADVENTURE_CATEGORIES.map((category) => (
          <CategoryCarousel
            key={category.id}
            category={category}
            selectedTopic={formData.topic}
            onSelect={handleTopicSelect}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="relative py-2 px-3">
        <div className="absolute inset-0 flex items-center px-3">
          <div className="w-full border-t border-foreground/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-sm text-muted-foreground">או</span>
        </div>
      </div>

      {/* Custom Topic */}
      <div className="space-y-2 px-3">
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
