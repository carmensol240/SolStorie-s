import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";

// Topic images
import topicBedtime from "@/assets/topic-bedtime.jpg";
import topicFriendship from "@/assets/topic-friendship.jpg";
import topicTeethBrushing from "@/assets/topic-teeth-brushing.jpg";
import topicBathShower from "@/assets/topic-bath-shower.jpg";
import topicHandWashing from "@/assets/topic-hand-washing.jpg";
import topicFearOfDark from "@/assets/topic-fear-of-dark.jpg";
import topicSharing from "@/assets/topic-sharing.jpg";
import topicNewSibling from "@/assets/topic-new-sibling.jpeg";
import topicPottyTraining from "@/assets/topic-potty-training.jpeg";
import topicFirstDayKindergarten from "@/assets/topic-first-day-kindergarten.jpg";
import topicMomDontGo from "@/assets/topic-mom-dont-go.jpg";
import topicPacifier from "@/assets/topic-pacifier.jpg";
import topicSpaceHero from "@/assets/topic-space-hero.jpg";
import topicMagicCastle from "@/assets/topic-magic-castle.jpg";
import topicZoo from "@/assets/topic-zoo.jpg";
import topicFamilyTrip from "@/assets/topic-family-trip.jpg";
import topicBirthday from "@/assets/topic-birthday.jpg";
import topicSuperheroes from "@/assets/topic-superheroes.jpg";
import topicUnderwater from "@/assets/topic-underwater.jpg";
import topicMagicalForest from "@/assets/topic-magical-forest.jpg";
import topicCloudAdventure from "@/assets/topic-cloud-adventure.jpg";
import topicRainParty from "@/assets/topic-rain-party.jpg";
import topicKingdom from "@/assets/topic-kingdom.jpg";
import topicSpace from "@/assets/topic-space.jpg";
import topicApologize from "@/assets/topic-apologize.jpg";
import topicHelpingOthers from "@/assets/topic-helping-others.jpg";
import topicTryingAgain from "@/assets/topic-trying-again.jpg";
import topicAngerCloud from "@/assets/topic-anger-cloud.jpg";
import topicJustBeMe from "@/assets/topic-just-be-me.jpg";
import topicWeAreSpecial from "@/assets/topic-we-are-special.jpg";
import topicIndependence from "@/assets/topic-independence.jpg";
import topicSiblingLove from "@/assets/topic-sibling-love.jpg";
import topicMySpecialFamily from "@/assets/topic-my-special-family.jpg";
import topicGrandparentsNight from "@/assets/topic-grandparents-night.jpg";
import topicPocketKiss from "@/assets/topic-pocket-kiss.jpg";
import topicBodySafety from "@/assets/topic-body-safety.jpg";
import topicRoadSafety from "@/assets/topic-road-safety.jpg";
import topicSeatbeltSafety from "@/assets/topic-seatbelt-safety.jpg";
import topicStrangerDanger from "@/assets/topic-stranger-danger.jpg";
import topicDentistVisit from "@/assets/topic-dentist-visit.jpeg";
import topicBarberVisit from "@/assets/topic-barber-visit.jpg";
import topicLostTooth from "@/assets/topic-lost-tooth.jpg";
import topicNailTrimming from "@/assets/topic-nail-trimming.jpg";
import topicBraveTaster from "@/assets/topic-brave-taster.jpg";
import topicCleanRoom from "@/assets/topic-clean-room.jpeg";
import topicNewHouse from "@/assets/topic-new-house.jpg";
import topicFlyingVacation from "@/assets/topic-flying-vacation.jpg";
import topicEnvironment from "@/assets/topic-environment.jpg";
import topicMagicKeys from "@/assets/topic-magic-keys.jpg";
import topicToothbrush from "@/assets/topic-toothbrush.jpg";
import topicBathtime from "@/assets/topic-bathtime.jpg";

interface TopicStepProps {
  formData: StoryFormData;
  updateFormData: (updates: Partial<StoryFormData>) => void;
}

interface TopicItem {
  id: string;
  label: string;
  image: string;
  category: string;
}

const CATEGORIES = [
  { id: "daily", label: "🌟 התמודדויות יומיומיות" },
  { id: "adventure", label: "🚀 הרפתקאות ודמיון" },
  { id: "emotions", label: "💛 רגשות וערכים" },
  { id: "family", label: "👨‍👩‍👧‍👦 משפחה" },
  { id: "safety", label: "🛡️ בטיחות ובריאות" },
  { id: "life", label: "🏠 מיומנויות חיים" },
];

const TOPICS: TopicItem[] = [
  // Daily challenges
  { id: "bedtime", label: "סיפור לפני השינה", image: topicBedtime, category: "daily" },
  { id: "teeth-brushing", label: "צחצוח שיניים", image: topicTeethBrushing, category: "daily" },
  { id: "toothbrush", label: "מברשת השיניים הקסומה", image: topicToothbrush, category: "daily" },
  { id: "bath-shower", label: "אמבטיה ומקלחת", image: topicBathShower, category: "daily" },
  { id: "bathtime", label: "זמן אמבטיה", image: topicBathtime, category: "daily" },
  { id: "hand-washing", label: "שטיפת ידיים", image: topicHandWashing, category: "daily" },
  { id: "potty-training", label: "גמילה מחיתולים", image: topicPottyTraining, category: "daily" },
  { id: "pacifier", label: "גמילה ממוצץ", image: topicPacifier, category: "daily" },
  { id: "first-day-kindergarten", label: "יום ראשון בגן", image: topicFirstDayKindergarten, category: "daily" },
  { id: "mom-dont-go", label: "אמא אל תלכי", image: topicMomDontGo, category: "daily" },
  { id: "fear-of-dark", label: "פחד מהחושך", image: topicFearOfDark, category: "daily" },

  // Adventures
  { id: "space-hero", label: "גיבור החלל", image: topicSpaceHero, category: "adventure" },
  { id: "space", label: "הרפתקה בחלל", image: topicSpace, category: "adventure" },
  { id: "magic-castle", label: "הטירה הקסומה", image: topicMagicCastle, category: "adventure" },
  { id: "magical-forest", label: "היער הקסום", image: topicMagicalForest, category: "adventure" },
  { id: "underwater", label: "הרפתקה מתחת למים", image: topicUnderwater, category: "adventure" },
  { id: "cloud-adventure", label: "הרפתקה בעננים", image: topicCloudAdventure, category: "adventure" },
  { id: "kingdom", label: "הממלכה הרחוקה", image: topicKingdom, category: "adventure" },
  { id: "superheroes", label: "גיבורי על", image: topicSuperheroes, category: "adventure" },
  { id: "rain-party", label: "מסיבה בגשם", image: topicRainParty, category: "adventure" },
  { id: "magic-keys", label: "המפתחות הקסומים", image: topicMagicKeys, category: "adventure" },
  { id: "zoo", label: "טיול בגן החיות", image: topicZoo, category: "adventure" },

  // Emotions & values
  { id: "friendship", label: "חברות", image: topicFriendship, category: "emotions" },
  { id: "sharing", label: "שיתוף", image: topicSharing, category: "emotions" },
  { id: "apologize", label: "לבקש סליחה", image: topicApologize, category: "emotions" },
  { id: "helping-others", label: "עזרה לזולת", image: topicHelpingOthers, category: "emotions" },
  { id: "trying-again", label: "לנסות שוב", image: topicTryingAgain, category: "emotions" },
  { id: "anger-cloud", label: "ענן הכעס", image: topicAngerCloud, category: "emotions" },
  { id: "just-be-me", label: "פשוט להיות אני", image: topicJustBeMe, category: "emotions" },
  { id: "we-are-special", label: "כולנו מיוחדים", image: topicWeAreSpecial, category: "emotions" },
  { id: "independence", label: "עצמאות", image: topicIndependence, category: "emotions" },

  // Family
  { id: "new-sibling", label: "אח/ות חדש/ה", image: topicNewSibling, category: "family" },
  { id: "sibling-love", label: "אהבת אחים", image: topicSiblingLove, category: "family" },
  { id: "my-special-family", label: "המשפחה המיוחדת שלי", image: topicMySpecialFamily, category: "family" },
  { id: "grandparents-night", label: "לילה אצל סבא וסבתא", image: topicGrandparentsNight, category: "family" },
  { id: "pocket-kiss", label: "הנשיקה בכיס", image: topicPocketKiss, category: "family" },
  { id: "family-trip", label: "טיול משפחתי", image: topicFamilyTrip, category: "family" },
  { id: "birthday", label: "יום הולדת", image: topicBirthday, category: "family" },

  // Safety & health
  { id: "body-safety", label: "שמירה על הגוף", image: topicBodySafety, category: "safety" },
  { id: "road-safety", label: "בטיחות בדרכים", image: topicRoadSafety, category: "safety" },
  { id: "seatbelt-safety", label: "חגורת בטיחות", image: topicSeatbeltSafety, category: "safety" },
  { id: "stranger-danger", label: "זהירות מזרים", image: topicStrangerDanger, category: "safety" },
  { id: "dentist-visit", label: "ביקור אצל רופא שיניים", image: topicDentistVisit, category: "safety" },
  { id: "barber-visit", label: "ביקור אצל הספר", image: topicBarberVisit, category: "safety" },
  { id: "lost-tooth", label: "שן נופלת", image: topicLostTooth, category: "safety" },
  { id: "nail-trimming", label: "גזירת ציפורניים", image: topicNailTrimming, category: "safety" },

  // Life skills
  { id: "brave-taster", label: "טועם אמיץ", image: topicBraveTaster, category: "life" },
  { id: "clean-room", label: "לסדר את החדר", image: topicCleanRoom, category: "life" },
  { id: "new-house", label: "בית חדש", image: topicNewHouse, category: "life" },
  { id: "flying-vacation", label: "טיסה לחופשה", image: topicFlyingVacation, category: "life" },
  { id: "environment", label: "שמירה על הסביבה", image: topicEnvironment, category: "life" },
];

const TopicStep = ({ formData, updateFormData }: TopicStepProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleCustomChange = (value: string) => {
    updateFormData({
      customTopic: value,
      topic: value.trim() ? "custom" : "",
      adventureLogic: undefined,
    });
  };

  const handleTopicSelect = (topic: TopicItem) => {
    updateFormData({
      topic: topic.id,
      customTopic: topic.label,
      adventureLogic: undefined,
    });
  };

  const filteredTopics = activeCategory
    ? TOPICS.filter((t) => t.category === activeCategory)
    : TOPICS;

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent text-center">
        על מה נכתוב היום?
      </h1>

      {/* Free text input */}
      <Textarea
        className="w-full min-h-[100px] text-sm resize-none"
        rows={4}
        placeholder="למשל: סול לא רצתה לצחצח שיניים הבוקר, או שקרה משהו מעניין בגן שתרצו לעבד בסיפור..."
        value={formData.customTopic}
        onChange={(e) => handleCustomChange(e.target.value)}
        dir="rtl"
      />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">או בחרו נושא מוכן</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Category filter chips */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all border",
            !activeCategory
              ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-transparent shadow-md"
              : "border-border bg-card hover:border-purple-300 text-foreground"
          )}
        >
          הכל
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
              activeCategory === cat.id
                ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-transparent shadow-md"
                : "border-border bg-card hover:border-purple-300 text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Topics grid */}
      <div className="grid grid-cols-3 gap-2">
        {filteredTopics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => handleTopicSelect(topic)}
            className={cn(
              "relative rounded-xl overflow-hidden border-2 transition-all aspect-square group",
              formData.topic === topic.id
                ? "border-purple-500 shadow-lg scale-[1.03]"
                : "border-transparent hover:border-purple-300"
            )}
          >
            <img
              src={topic.image}
              alt={topic.label}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Overlay with label */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-1.5">
              <span className="text-white text-[10px] font-bold leading-tight text-center w-full drop-shadow-md">
                {topic.label}
              </span>
            </div>
            {/* Selected checkmark */}
            {formData.topic === topic.id && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicStep;
