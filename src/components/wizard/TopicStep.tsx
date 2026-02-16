import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";

// Cast hero images
import castSol from "@/assets/cast-sol-adventure.jpg";
import castBen from "@/assets/cast-ben-art.jpg";
import castMia from "@/assets/cast-mia-nature.jpg";
import castLeo from "@/assets/cast-leo-science.jpg";
import castZoe from "@/assets/cast-zoe-sports.jpg";

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
import topicEducationalToolbox from "@/assets/topic-educational-toolbox.jpeg";

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

interface HeroCharacter {
  name: string;
  nameEn: string;
  image: string;
  description: string;
}

const HEROES: HeroCharacter[] = [
  { name: "סול", nameEn: "Sol", image: castSol, description: "הגיבורה שלנו – מובילה כל הרפתקה" },
  { name: "בן", nameEn: "Ben", image: castBen, description: "החבר היצירתי – אמן וחולם" },
  { name: "מיה", nameEn: "Mia", image: castMia, description: "חוקרת הטבע – סקרנית ואמיצה" },
  { name: "ליאו", nameEn: "Leo", image: castLeo, description: "המדען הצעיר – ממציא ופותר" },
  { name: "זואי", nameEn: "Zoe", image: castZoe, description: "הספורטאית – אנרגטית ונחושה" },
];

const CATEGORIES = [
  { id: "daily", label: "🌟 סול מתמודדת" },
  { id: "adventure", label: "🚀 הרפתקאות סול" },
  { id: "emotions", label: "💛 רגשות וערכים" },
  { id: "family", label: "👨‍👩‍👧‍👦 משפחה" },
  { id: "safety", label: "🛡️ בטיחות ובריאות" },
  { id: "life", label: "🏠 מיומנויות חיים" },
  { id: "edu", label: "🎓 ארגז כלים חינוכי" },
];

const TOPICS: TopicItem[] = [
  // סול מתמודדת - Daily challenges
  { id: "bedtime-story", label: "סיפור לפני השינה – סול והפיל הקורא", image: topicBedtime, category: "daily" },
  { id: "body-hero-teeth", label: "צחצוח שיניים קסום – סול ופיית השיניים", image: topicTeethBrushing, category: "daily" },
  { id: "toothbrush", label: "מברשת השיניים הקסומה של סול", image: topicToothbrush, category: "daily" },
  { id: "body-hero-bath", label: "אמבטיה של כיף – בועות וברווזון", image: topicBathShower, category: "daily" },
  { id: "bathtime", label: "זמן אמבטיה עם סול", image: topicBathtime, category: "daily" },
  { id: "body-hero-hands", label: "שטיפת ידיים – מנצחים את החיידקים!", image: topicHandWashing, category: "daily" },
  { id: "potty-training", label: "גמילה מחיתולים – סול גדלה!", image: topicPottyTraining, category: "daily" },
  { id: "pacifier-fairy", label: "פיית המוצץ – נפרדים בקסם", image: topicPacifier, category: "daily" },
  { id: "first-day-kindergarten", label: "יום ראשון בגן – סול מתרגשת", image: topicFirstDayKindergarten, category: "daily" },
  { id: "mom-dont-go", label: "אמא אל תלכי – הנשיקה שנשארת", image: topicMomDontGo, category: "daily" },
  { id: "fear-of-dark", label: "סול מגלה שהחושך לא מפחיד", image: topicFearOfDark, category: "daily" },

  // הרפתקאות סול - Adventures
  { id: "space-adventure", label: "הרפתקה בחלל – סול בין כוכבים", image: topicSpaceHero, category: "adventure" },
  { id: "space", label: "מסע לכוכבים עם ליאו", image: topicSpace, category: "adventure" },
  { id: "magic-kingdom", label: "ממלכת הקסם – סול בארמון", image: topicMagicCastle, category: "adventure" },
  { id: "magical-forest", label: "היער הקסום של מיה", image: topicMagicalForest, category: "adventure" },
  { id: "underwater", label: "הרפתקה מתחת למים עם זואי", image: topicUnderwater, category: "adventure" },
  { id: "cloud-adventure", label: "הרפתקה בעננים – סול עפה!", image: topicCloudAdventure, category: "adventure" },
  { id: "kingdom", label: "הממלכה הרחוקה של סול", image: topicKingdom, category: "adventure" },
  { id: "superheroes", label: "גיבורי על – סול וחבריה מצילים", image: topicSuperheroes, category: "adventure" },
  { id: "rain-party", label: "מסיבה בגשם עם בן", image: topicRainParty, category: "adventure" },
  { id: "magic-keys", label: "המפתחות הקסומים של ליאו", image: topicMagicKeys, category: "adventure" },
  { id: "zoo-adventure", label: "טיול בגן החיות – פוגשים חיות", image: topicZoo, category: "adventure" },

  // רגשות וערכים - Emotions & values
  { id: "friendship-courage", label: "חברות ואומץ לב – סול בגן", image: topicFriendship, category: "emotions" },
  { id: "sharing", label: "סול לומדת לשתף", image: topicSharing, category: "emotions" },
  { id: "apologize", label: "סול לומדת לבקש סליחה", image: topicApologize, category: "emotions" },
  { id: "helping-others", label: "סול עוזרת לחברים", image: topicHelpingOthers, category: "emotions" },
  { id: "trying-again", label: "הקסם שבניסיון – בן לא מוותר", image: topicTryingAgain, category: "emotions" },
  { id: "anger-cloud", label: "ענן הכעס של סול", image: topicAngerCloud, category: "emotions" },
  { id: "just-be-me", label: "פשוט להיות אני – סול מיוחדת", image: topicJustBeMe, category: "emotions" },
  { id: "we-are-special", label: "כולנו מיוחדים – סול וחבריה", image: topicWeAreSpecial, category: "emotions" },
  { id: "independence", label: "סול עושה לבד!", image: topicIndependence, category: "emotions" },

  // משפחה - Family
  { id: "new-sibling", label: "אח/ות חדש/ה – סול אחות גדולה", image: topicNewSibling, category: "family" },
  { id: "sibling-love", label: "אהבת אחים – סול והתינוק", image: topicSiblingLove, category: "family" },
  { id: "my-special-family", label: "המשפחה המיוחדת של סול", image: topicMySpecialFamily, category: "family" },
  { id: "grandparents-night", label: "לילה אצל סבא וסבתא", image: topicGrandparentsNight, category: "family" },
  { id: "pocket-kiss", label: "הנשיקה בכיס של אמא", image: topicPocketKiss, category: "family" },
  { id: "family-trip", label: "טיול משפחתי – הרפתקה בטבע", image: topicFamilyTrip, category: "family" },
  { id: "birthday-party", label: "יום הולדת – חוגגים עם החברים", image: topicBirthday, category: "family" },

  // בטיחות ובריאות - Safety & health
  { id: "body-safety", label: "שמירה על הגוף שלי", image: topicBodySafety, category: "safety" },
  { id: "road-safety", label: "שומרי הדרכים – סול וזואי", image: topicRoadSafety, category: "safety" },
  { id: "seatbelt-safety", label: "חגורת בטיחות – לוחצים ונוסעים", image: topicSeatbeltSafety, category: "safety" },
  { id: "stranger-danger", label: "זהירות מזרים – סול יודעת", image: topicStrangerDanger, category: "safety" },
  { id: "dentist-visit", label: "ביקור אצל רופא השיניים", image: topicDentistVisit, category: "safety" },
  { id: "barber-visit", label: "ביקור אצל הספר", image: topicBarberVisit, category: "safety" },
  { id: "lost-tooth", label: "שן נופלת – פיית השיניים באה!", image: topicLostTooth, category: "safety" },
  { id: "body-hero-nails", label: "גזירת ציפורניים – עם הפיות", image: topicNailTrimming, category: "safety" },

  // מיומנויות חיים - Life skills
  { id: "brave-taster", label: "טועם אמיץ – סול טועמת חדש", image: topicBraveTaster, category: "life" },
  { id: "clean-room", label: "לסדר את החדר עם סול", image: topicCleanRoom, category: "life" },
  { id: "new-house", label: "בית חדש – סול עוברת דירה", image: topicNewHouse, category: "life" },
  { id: "flying-vacation", label: "טיסה לחופשה – סול טסה!", image: topicFlyingVacation, category: "life" },
  { id: "environment", label: "שמירה על הסביבה עם מיה", image: topicEnvironment, category: "life" },

  // ארגז כלים חינוכי - Educator toolbox
  { id: "social-skills-edu", label: "מיומנויות חברתיות", image: topicFriendship, category: "edu" },
  { id: "values-emotions-edu", label: "ערכים ורגשות", image: topicAngerCloud, category: "edu" },
  { id: "holidays-seasons-edu", label: "חגים ועונות השנה", image: topicRainParty, category: "edu" },
  { id: "life-skills-edu", label: "מיומנויות חיים", image: topicIndependence, category: "edu" },
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

      {/* Cast Hero Characters */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center font-medium">הכירו את הדמויות שילוו את הילד שלכם</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-center">
          {HEROES.map((hero) => (
            <div key={hero.nameEn} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-300 shadow-sm">
                <img src={hero.image} alt={hero.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[9px] font-bold text-foreground leading-none">
                {hero.name} | <span className="text-muted-foreground">{hero.nameEn}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

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

      {/* Educator toolbox hero banner */}
      {activeCategory === "edu" && (
        <div className="relative rounded-xl overflow-hidden aspect-video">
          <img src={topicEducationalToolbox} alt="ארגז הכלים החינוכי" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
            <span className="text-white text-sm font-bold drop-shadow-md">🎓 ארגז הכלים החינוכי – לאנשי חינוך וטיפול</span>
          </div>
        </div>
      )}

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
