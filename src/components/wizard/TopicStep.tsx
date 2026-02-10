import { useRef } from "react";
import { Pencil, ChevronLeft, ChevronRight, Brain, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";

// Topic images
import topicTeethBrushing from "@/assets/topic-teeth-brushing.jpg";
import topicBathShower from "@/assets/topic-bath-shower.jpg";
import topicNailTrimming from "@/assets/topic-nail-trimming.jpg";
import topicHandWashing from "@/assets/topic-hand-washing.jpg";
import topicZoo from "@/assets/topic-zoo.jpg";
import topicFamilyTrip from "@/assets/topic-family-trip.jpg";
import topicMagicCastle from "@/assets/topic-magic-castle.jpg";
import topicSpaceHero from "@/assets/topic-space-hero.jpg";
import topicBirthday from "@/assets/topic-birthday.jpg";
import topicPacifier from "@/assets/topic-pacifier.jpg";
import topicFriendship from "@/assets/topic-friendship.jpg";
import topicNewSibling from "@/assets/topic-new-sibling.jpeg";
import topicDentistVisit from "@/assets/topic-dentist-visit.jpeg";
import topicBarberVisit from "@/assets/topic-barber-visit.jpg";
import topicLostTooth from "@/assets/topic-lost-tooth.jpg";
import topicSharing from "@/assets/topic-sharing.jpg";
import topicCloudAdventure from "@/assets/topic-cloud-adventure.jpg";
import topicFearOfDark from "@/assets/topic-fear-of-dark.jpg";
import topicBraveTaster from "@/assets/topic-brave-taster.jpg";
import topicPocketKiss from "@/assets/topic-pocket-kiss.jpg";
import topicApologize from "@/assets/topic-apologize.jpg";
import topicRainParty from "@/assets/topic-rain-party.jpg";
import topicWeAreSpecial from "@/assets/topic-we-are-special.jpg";
import topicPottyTraining from "@/assets/topic-potty-training.jpeg";
import topicIndependence from "@/assets/topic-independence.jpg";
import topicAngerCloud from "@/assets/topic-anger-cloud.jpg";
import topicBodySafety from "@/assets/topic-body-safety.jpg";
import topicNewHouse from "@/assets/topic-new-house.jpg";
import topicUnderwater from "@/assets/topic-underwater.jpg";
import topicSuperheroes from "@/assets/topic-superheroes.jpg";
import topicFirstDayKindergarten from "@/assets/topic-first-day-kindergarten.jpg";
import topicMomDontGo from "@/assets/topic-mom-dont-go.jpg";
import topicJustBeMe from "@/assets/topic-just-be-me.jpg";

interface TopicStepProps {
  formData: StoryFormData;
  updateFormData: (updates: Partial<StoryFormData>) => void;
}

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

const ADVENTURE_CATEGORIES: AdventureCategory[] = [
  {
    id: "superheroes",
    title: "גיבורי על",
    emoji: "🦸",
    topics: [
      {
        id: "we-are-superheroes",
        label: "אנחנו גיבורי על",
        image: topicSuperheroes,
        description: "מעופפים בשמיים עם גלימות קסומות",
        logic: {
          outfit: "colorful superhero suit with a flowing cape and a glowing emblem on the chest",
          background: "bright blue sky filled with fluffy white clouds, golden sunlight, sparkles and rays of light streaming through",
          theme: "superheroes, bravery, teamwork, flying, empowerment, confidence, helping others, imagination, friendship, believing in yourself"
        }
      },
    ]
  },
  {
    id: "daily-heroes",
    title: "גיבורי היומיום",
    emoji: "✨",
    topics: [
      { id: "dentist-visit", label: "ביקור אצל רופא/ת השיניים", image: topicDentistVisit, description: "הולכים לרופא שיניים בלי פחד", logic: { outfit: "everyday casual clothes", background: "friendly colorful dental clinic with sparkles, kind dentist, and fun dental chair", theme: "visiting the dentist, overcoming fear, dental checkup, bravery, health" } },
      { id: "pacifier-fairy", label: "פיית המוצץ", image: topicPacifier, description: "נפרדים מהמוצץ בקסם", logic: { outfit: "cozy pajamas", background: "magical nursery with sparkles and gentle fairy", theme: "saying goodbye to pacifier, growing up, milestone transition, managing change" } },
      { id: "body-hero-teeth", label: "צחצוח שיניים קסום", image: topicTeethBrushing, description: "עם פיית השיניים והדרקון", logic: { outfit: "everyday casual clothes at home", background: "bright magical bathroom with sparkles and friendly dental fairy dragon", theme: "teeth brushing, dental hygiene, making brushing fun, sensory experience" } },
      { id: "body-hero-bath", label: "אמבטיה של כיף", image: topicBathShower, description: "בועות, ברווזון וקצף", logic: { outfit: "bath time with rubber ducky cap", background: "colorful bubble bath with floating toys and rainbow bubbles", theme: "bath time fun, getting clean, water play, sensory experience" } },
      { id: "body-hero-nails", label: "גזירת ציפורניים", image: topicNailTrimming, description: "עם הפיות הקסומות", logic: { outfit: "everyday casual clothes", background: "magical bathroom with fairies and sparkles, friendly nail clippers", theme: "nail trimming, grooming routine, overcoming sensory discomfort" } },
      { id: "barber-visit", label: "ביקור אצל הספר", image: topicBarberVisit, description: "תספורת קסומה וכיפית", logic: { outfit: "everyday casual clothes with barber cape", background: "friendly colorful barber shop with mirrors, sparkles, and fun chair", theme: "visiting the barber, haircut, overcoming fear, grooming, bravery" } },
      { id: "brave-taster", label: "הטועם האמיץ", image: topicBraveTaster, description: "טועמים אוכל חדש באומץ", logic: { outfit: "everyday casual clothes with a chef hat or apron", background: "warm colorful kitchen with fruits, vegetables, and sparkles on the table", theme: "trying new foods, picky eating, bravery, sensory exploration, healthy eating" } },
      { id: "potty-training", label: "גמילה מחיתולים", image: topicPottyTraining, description: "הופכים לילד/ה גדול/ה!", logic: { outfit: "everyday casual clothes", background: "cheerful colorful bathroom with a friendly potty chair, stickers on the wall, and a supportive teddy bear", theme: "potty training, transitioning from diapers, growing up milestone, independence, positive reinforcement, celebrating success" } },
      { id: "independence", label: "אני יכול/ה לבד!", image: topicIndependence, description: "מתלבשים ומסתדרים לבד", logic: { outfit: "mismatched fun clothes the child picked themselves", background: "bright cheerful bedroom with open wardrobe, clothes scattered playfully, warm morning sunlight and sparkles", theme: "independence, self-dressing, doing things alone, growing up, confidence, pride in self-reliance" } },
    ]
  },
  {
    id: "emotion-detectors",
    title: "גלאי רגשות",
    emoji: "💕",
    topics: [
      { id: "new-sibling", label: "נולד לי אח/ות", image: topicNewSibling, description: "מקבלים תינוק חדש במשפחה", logic: { outfit: "comfortable home clothes", background: "warm nursery room with crib, mobile, soft lighting, and family atmosphere", theme: "welcoming new sibling, sharing attention, becoming a big brother/sister, family changes, emotions about new baby" } },
      { id: "body-hero-hands", label: "שטיפת ידיים", image: topicHandWashing, description: "מנצחים את החיידקים!", logic: { outfit: "everyday casual clothes", background: "bright colorful bathroom with soap bubbles and friendly germs being washed away", theme: "hand hygiene, washing hands, staying healthy, sensory experience" } },
      { id: "fear-of-dark", label: "פחד מהחושך", image: topicFearOfDark, description: "מגלים שאין מה לפחד", logic: { outfit: "cozy pajamas with soft slippers", background: "enchanted bedroom at night with a protective glowing nightlight, stars, and friendly shadows", theme: "overcoming fear of darkness, bravery, emotional regulation, calming bedtime, feeling safe" } },
      { id: "lost-tooth", label: "נפלה לי שן", image: topicLostTooth, description: "פיית השיניים באה לבקר", logic: { outfit: "everyday casual clothes", background: "magical bedroom at night with a tiny glowing tooth fairy, sparkles, and a little tooth under a pillow", theme: "losing a tooth, growing up, tooth fairy, excitement and courage, body changes" } },
      { id: "pocket-kiss", label: "נשיקה בכיס", image: topicPocketKiss, description: "פרידה בבוקר עם אהבה", logic: { outfit: "everyday clothes with a small backpack", background: "kindergarten entrance at morning with warm sunlight, parent giving a kiss, a tiny glowing heart tucked in pocket", theme: "separation anxiety, morning goodbye, feeling safe, love and comfort, transitioning to kindergarten" } },
      { id: "we-are-special", label: "כולנו מיוחדים ודומים", image: topicWeAreSpecial, description: "שונים מבחוץ, אותו דבר מבפנים", logic: { outfit: "everyday casual clothes", background: "colorful magical garden with diverse flowers, rainbow-colored glowing hearts and stars, children of different appearances holding hands", theme: "diversity and inclusion, different family structures (single-parent, same-sex parents, grandparent-led), different appearances (skin color, hair, height), celebrating uniqueness, empathy, the core message: we look different on the outside and our homes may look different but inside our hearts we all feel love and dream the same way. Use parent NLP input to tailor to the specific family or social situation" } },
      { id: "anger-cloud", label: "ענן הכעס שלי", image: topicAngerCloud, description: "לומדים להתמודד עם כעס", logic: { outfit: "comfortable home clothes", background: "cozy room with a dark fluffy cloud above that transforms into a rainbow cloud with sparkles and deep breaths", theme: "anger management, emotional regulation, tantrums, deep breathing, calming down, naming emotions, self-control" } },
      { id: "body-safety", label: "הגוף שלי הוא רק שלי", image: topicBodySafety, description: "לומדים על גבולות וביטחון", logic: { outfit: "everyday casual clothes", background: "warm safe environment with a gentle glowing protective bubble around the child, soft hearts and stars", theme: "body boundaries, personal safety, consent, saying no, good touch bad touch, body autonomy, empowerment, telling a trusted adult" } },
      { id: "mom-dont-go", label: "אמא אל תלכי", image: topicMomDontGo, description: "מתמודדים עם פרידה בבוקר", logic: { outfit: "everyday clothes with a small backpack", background: "kindergarten entrance at morning with warm golden sunlight streaming through the door, magical sparkles in the air, a glowing heart in the child's pocket", theme: "separation anxiety, missing mom, morning goodbye, magical invisible string connecting parent and child, a kiss or glowing heart placed in the pocket as a comforting magical tool, feeling safe and loved even apart, building confidence, emotional validation, the child discovers they carry love with them all day, NLP reframe: missing someone means you love them and love never disappears" } },
      { id: "just-be-me", label: "פשוט להיות אני", image: topicJustBeMe, description: "כל ילד מיוחד בדרך שלו", logic: { outfit: "colorful casual clothes expressing individuality", background: "sunny inclusive park with diverse children playing together, bubbles floating, butterflies, a sign saying 'Different & Amazing', wheelchairs and crutches visible naturally", theme: "disability awareness, inclusion, celebrating differences, self-acceptance, every child is special, wheelchair, physical differences, empathy, friendship beyond appearances, being proud of who you are, kindness, accessibility" } },
    ]
  },
  {
    id: "social-missions",
    title: "משימות חברתיות",
    emoji: "🤝",
    topics: [
      { id: "friendship-courage", label: "חברים בגן", image: topicFriendship, description: "משחקים ומתגברים על קשיים", logic: { outfit: "everyday casual clothes suitable for playing", background: "colorful kindergarten playground with sandbox and sunny weather", theme: "social skills, making friends, playing together, sharing, managing emotions" } },
      { id: "sharing-fun", label: "כמה כיף לחלוק", image: topicSharing, description: "לחלוק זה כיף!", logic: { outfit: "everyday casual clothes", background: "colorful kindergarten with toys and snacks, children playing together happily", theme: "sharing toys, generosity, kindness, social skills, taking turns" } },
      { id: "birthday-party", label: "מסיבת יום הולדת", image: topicBirthday, description: "חוגגים ומשתפים עם חברים", logic: { outfit: "party clothes, festive attire", background: "colorful kindergarten or party venue with cake, decorations, friends", theme: "birthday celebration, friendship, sharing joy, being a good host" } },
      { id: "family-trip", label: "טיול משפחתי", image: topicFamilyTrip, description: "הרפתקה בטבע עם המשפחה", logic: { outfit: "hiking clothes with backpack", background: "beautiful nature trail with trees, stream, flowers, and dog", theme: "family bonding, nature exploration, teamwork, helping others" } },
      { id: "apologize", label: "ללמוד לבקש סליחה", image: topicApologize, description: "לומר סליחה ולתקן", logic: { outfit: "everyday casual clothes", background: "colorful kindergarten with soft lighting, two children facing each other with gentle expressions", theme: "apologizing, taking responsibility, empathy, repairing friendships, emotional growth" } },
      { id: "new-house", label: "עוברים לבית חדש", image: topicNewHouse, description: "הרפתקה של מעבר דירה", logic: { outfit: "comfortable casual clothes", background: "new colorful house with moving boxes, a magical garden with flowers blooming, warm golden sunlight, sparkles in the air", theme: "moving to a new house, change, leaving friends, making new friends, adapting, feeling safe in a new place, family support" } },
      { id: "first-day-kindergarten", label: "היום הראשון בגן", image: topicFirstDayKindergarten, description: "מתחילים הרפתקה חדשה בגן", logic: { outfit: "everyday clothes with a small colorful backpack", background: "whimsical kindergarten entrance decorated with oversized crayons, floating magical ABC letters, warm golden sunlight and sparkles", theme: "first day at kindergarten, separation anxiety, making new friends, new beginnings, bravery, excitement, adapting to new environment, feeling safe" } },
    ]
  },
  {
    id: "sensory-cloud",
    title: "ענן החושים",
    emoji: "☁️",
    topics: [
      { id: "space-adventure", label: "הרפתקה בחלל", image: topicSpaceHero, description: "מסע בין כוכבים ופלאות", logic: { outfit: "astronaut spacesuit with helmet", background: "outer space with stars, planets, and galaxies", theme: "exploration and discovery in space, bravery, imagination" } },
      { id: "magic-kingdom", label: "ממלכת הקסם", image: topicMagicCastle, description: "הרפתקה קסומה בארמון", logic: { outfit: "royal prince/princess attire with crown", background: "magical castle with towers and enchanted gardens", theme: "fantasy and magic in a royal kingdom, kindness, helping others" } },
      { id: "zoo-adventure", label: "טיול בגן החיות", image: topicZoo, description: "פוגשים חיות ומתרגלים שיתוף", logic: { outfit: "comfortable outdoor clothes with backpack", background: "colorful zoo with friendly animals, fences, trees", theme: "animal discovery, nature, sharing with friends, taking turns" } },
      { id: "cloud-adventure", label: "טיול בעננים", image: topicCloudAdventure, description: "מעופפים בין עננים קסומים", logic: { outfit: "light airy clothes with tiny wings", background: "dreamy sky filled with fluffy magical clouds, rainbows, floating islands, and sparkling stars", theme: "imagination, flying, dreaming, sensory wonder, freedom, creativity" } },
      { id: "rain-party", label: "מסיבת הגשם", image: topicRainParty, description: "רוקדים בגשם עם מטריות צבעוניות", logic: { outfit: "rain boots and a colorful raincoat with hood", background: "garden in the rain with puddles, rainbow reflections, colorful umbrellas, and sparkling raindrops", theme: "sensory play, rain, nature, joy, jumping in puddles, weather exploration" } },
      { id: "underwater-journey", label: "מסע במצולות הים", image: topicUnderwater, description: "הרפתקה קסומה מתחת למים", logic: { outfit: "magical diving suit with glowing accents", background: "vibrant underwater world with coral reefs, bioluminescent jellyfish, friendly sea turtle, bubbles and sparkles, sunlight filtering through water", theme: "underwater exploration, ocean discovery, sensory wonder, marine life, imagination, courage, nature beauty" } },
    ]
  },
];

const ALL_TOPICS = ADVENTURE_CATEGORIES.flatMap(cat => cat.topics);

const TopicCard = ({
  topic,
  isSelected,
  onSelect,
  compact = false,
}: {
  topic: AdventureTopic;
  isSelected: boolean;
  onSelect: (topic: AdventureTopic) => void;
  compact?: boolean;
}) => (
  <button
    onClick={() => onSelect(topic)}
    className={cn(
      "overflow-hidden rounded-xl border-2 transition-all duration-200 text-right flex flex-col shadow-sm",
      compact ? "flex-shrink-0 w-36" : "w-full",
      isSelected
        ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
        : "border-transparent hover:border-primary/30"
    )}
    style={compact ? { scrollSnapAlign: 'start' } : undefined}
  >
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3/4' }}>
      <img
        src={topic.image}
        alt={topic.label}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
          <span className="text-primary-foreground text-xs">✓</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
        <h4 className="font-bold text-xs leading-tight">{topic.label}</h4>
      </div>
    </div>
  </button>
);

const CategoryCarousel = ({
  category,
  formData,
  onTopicSelect,
}: {
  category: AdventureCategory;
  formData: StoryFormData;
  onTopicSelect: (topic: AdventureTopic) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? 160 : -160,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div id={`cat-${category.id}`}>
      {/* Category Header */}
      <div className="flex items-center justify-between px-4 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{category.emoji}</span>
          <h3 className="text-sm font-bold text-foreground">{category.title}</h3>
          <span className="text-[10px] font-normal text-muted-foreground">({category.topics.length})</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => scroll('right')} aria-label="הקודם">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => scroll('left')} aria-label="הבא">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {category.topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            isSelected={formData.topic === topic.id}
            onSelect={onTopicSelect}
            compact
          />
        ))}
      </div>
    </div>
  );
};

const TopicStep = ({ formData, updateFormData }: TopicStepProps) => {
  const handleTopicSelect = (topic: AdventureTopic) => {
    if (formData.topic === topic.id) {
      updateFormData({
        topic: formData.customTopic.trim() ? "custom" : "",
        adventureLogic: undefined
      });
    } else {
      updateFormData({
        topic: topic.id,
        adventureLogic: topic.logic
      });
    }
  };

  const handleCustomTopicChange = (value: string) => {
    if (!formData.topic || formData.topic === "custom") {
      updateFormData({
        customTopic: value,
        topic: value.trim() ? "custom" : "",
        adventureLogic: undefined
      });
    } else {
      updateFormData({ customTopic: value });
    }
  };

  const scrollToCategory = (catId: string) => {
    const el = document.getElementById(`cat-${catId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-3 -mx-3 -mt-2">
      {/* Title */}
      <div className="text-center px-3 pt-1">
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          בחרו את ההרפתקה
        </h1>
      </div>

      {/* NLP Smart Input */}
      <div className="space-y-2 px-4 bg-purple-50/50 py-2.5 rounded-xl mx-3 border border-purple-200/50">
        <div className="flex items-center gap-2 justify-center">
          <Brain className="w-4 h-4 text-purple-500" />
          <Label className="text-xs font-bold text-purple-700">
            ספרו לנו מה עבר על הילד/ה
          </Label>
          <Sparkles className="w-4 h-4 text-pink-500" />
        </div>
        <Textarea
          placeholder="למשל: היום היה קשה בגן עם חבר..."
          value={formData.customTopic}
          onChange={(e) => handleCustomTopicChange(e.target.value)}
          className={cn(
            "min-h-12 text-sm resize-none",
            formData.customTopic.trim() ? "border-purple-400" : ""
          )}
          dir="rtl"
        />
      </div>

      {/* Divider */}
      <div className="relative py-0.5 px-4">
        <div className="absolute inset-0 flex items-center px-4">
          <div className="w-full border-t border-purple-200/50" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[11px] text-muted-foreground">או בחרו נושא</span>
        </div>
      </div>

      {/* Quick-scroll Category Buttons */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
        {ADVENTURE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => scrollToCategory(cat.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border bg-white/80 text-purple-700 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
            style={{ scrollSnapAlign: 'start' }}
          >
            <span>{cat.emoji}</span>
            <span>{cat.title}</span>
          </button>
        ))}
      </div>

      {/* All Category Carousels */}
      <div className="space-y-4 pb-8">
        {ADVENTURE_CATEGORIES.map((cat, index) => (
          <div key={cat.id}>
            <CategoryCarousel
              category={cat}
              formData={formData}
              onTopicSelect={handleTopicSelect}
            />
            {index < ADVENTURE_CATEGORIES.length - 1 && (
              <div className="mx-4 mt-2 border-t border-purple-100/60" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicStep;
