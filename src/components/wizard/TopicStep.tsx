import { useRef, useState, useEffect } from "react";
import { Pencil, ChevronLeft, ChevronRight, Brain, Sparkles, Heart, Grid3X3 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";
import { useTopicWishlist } from "@/hooks/use-topic-wishlist";

// Topic images
import castSol from "@/assets/cast-sol-adventure.jpg";
import castMia from "@/assets/cast-mia-nature.jpg";
import castLeo from "@/assets/cast-leo-science.jpg";
import castZoe from "@/assets/cast-zoe-sports.jpg";
import castBen from "@/assets/cast-ben-art.jpg";
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
import topicMySpecialFamily from "@/assets/topic-my-special-family.jpg";

// New topic images
import topicRoadSafety from "@/assets/topic-road-safety.jpg";
import topicEnvironment from "@/assets/topic-environment.jpg";
import topicHelpingOthers from "@/assets/topic-helping-others.jpg";
import topicTryingAgain from "@/assets/topic-trying-again.jpg";
import topicGrandparentsNight from "@/assets/topic-grandparents-night.jpg";
import topicSiblingLove from "@/assets/topic-sibling-love.jpg";
import topicMagicKeys from "@/assets/topic-magic-keys.jpg";
import topicStrangerDanger from "@/assets/topic-stranger-danger.jpg";
import topicFlyingVacation from "@/assets/topic-flying-vacation.jpg";
import topicMagicalForest from "@/assets/topic-magical-forest.jpg";
import topicSeatbeltSafety from "@/assets/topic-seatbelt-safety.jpg";

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
  ageLabel: string;
  logic: AdventureLogic;
}

interface AdventureCategory {
  id: string;
  title: string;
  emoji: string;
  subtitle?: string;
  castImage?: string;
  castName?: string;
  topics: AdventureTopic[];
}

// Helper: replace {childName} and handle gender suffixes
function renderTopicLabel(label: string, childName: string, childGender: "male" | "female"): string {
  let result = label.replace(/\{childName\}/g, childName || "הילד/ה");
  // Handle gender suffix: כובש/ת → כובש or כובשת
  result = result.replace(/(\p{L}+)\/(\p{L}+)/gu, (match, base, suffix) => {
    if (childGender === "female") return base + suffix;
    return base;
  });
  return result;
}

const ADVENTURE_CATEGORIES: AdventureCategory[] = [
  {
    id: "superheroes",
    title: "גיבורי על",
    emoji: "🦸",
    castImage: castSol,
    castName: "סול",
    topics: [
      {
        id: "we-are-superheroes", label: "אנחנו גיבורי על", image: topicSuperheroes,
        description: "מעופפים בשמיים עם גלימות קסומות", ageLabel: "3-8",
        logic: { outfit: "colorful superhero suit with a flowing cape and a glowing emblem on the chest", background: "bright blue sky filled with fluffy white clouds, golden sunlight, sparkles and rays of light streaming through", theme: "superheroes, bravery, teamwork, flying, empowerment, confidence, helping others, imagination, friendship, believing in yourself" }
      },
      {
        id: "road-safety", label: "שומרי הדרכים", image: topicRoadSafety,
        description: "לומדים זהירות בדרכים בכיף", ageLabel: "3-6",
        logic: { outfit: "bright reflective yellow safety vest and a small crossing guard hat", background: "colorful safe street crossing with traffic lights, sparkly crosswalk, friendly road signs", theme: "road safety, crossing the street, traffic lights, pedestrian rules, looking both ways, being careful, responsibility, independence in the street" }
      },
      {
        id: "environment-heroes", label: "שומרי כדור הארץ", image: topicEnvironment,
        description: "שומרים על הטבע והסביבה", ageLabel: "3-8",
        logic: { outfit: "green nature-themed clothes and gardening gloves", background: "lush green garden with butterflies, flowers, Earth globe, recycling bins, sparkles", theme: "environment protection, recycling, planting trees, saving water, caring for animals, nature love, responsibility for the planet" }
      },
      {
        id: "helping-heart", label: "הלב של {childName}", image: topicHelpingOthers,
        description: "עוזרים לאחרים מכל הלב", ageLabel: "3-8",
        logic: { outfit: "red heart-themed shirt with caring accessories", background: "warm neighborhood with houses, golden sunlight, floating hearts and sparkles", theme: "helping others, kindness, empathy, generosity, volunteering, caring for elderly, sharing with those in need, the joy of giving" }
      },
      {
        id: "body-safety", label: "הגוף שלי הוא רק שלי", image: topicBodySafety,
        description: "לומדים על גבולות וביטחון", ageLabel: "4-8",
        logic: { outfit: "everyday casual clothes", background: "warm safe environment with a gentle glowing protective bubble around the child, soft hearts and stars", theme: "body boundaries, personal safety, consent, saying no, good touch bad touch, body autonomy, empowerment, telling a trusted adult" }
      },
      {
        id: "just-be-me", label: "פשוט להיות אני", image: topicJustBeMe,
        description: "כל ילד מיוחד בדרך שלו", ageLabel: "4-8",
        logic: { outfit: "colorful casual clothes expressing individuality", background: "sunny inclusive park with diverse children playing together, bubbles floating, butterflies, wheelchairs and crutches visible naturally", theme: "disability awareness, inclusion, celebrating differences, self-acceptance, every child is special, being proud of who you are, kindness, accessibility" }
      },
      {
        id: "we-are-special", label: "כולנו מיוחדים ודומים", image: topicWeAreSpecial,
        description: "שונים מבחוץ, אותו דבר מבפנים", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes", background: "colorful magical garden with diverse flowers, rainbow-colored glowing hearts and stars, children of different appearances holding hands", theme: "diversity and inclusion, different family structures, different appearances, celebrating uniqueness, empathy, we look different on the outside but inside our hearts we all feel love and dream the same way" }
      },
    ]
  },
  {
    id: "growing-together",
    title: "גדלים ביחד",
    emoji: "🌱",
    castImage: castMia,
    castName: "מיה",
    topics: [
      // NEW topics
      {
        id: "magic-of-trying", label: "הקסם שבניסיון", image: topicTryingAgain,
        description: "לומדים שנפילה היא חלק מההצלחה", ageLabel: "3-6",
        logic: { outfit: "comfortable casual clothes", background: "bright playroom with colorful blocks, some fallen and some built into a tower, sparkles of magic around", theme: "dealing with failure, perseverance, trying again, growth mindset, resilience, not giving up, learning from mistakes, the magic of persistence" }
      },
      {
        id: "grandparents-night", label: "הלילה המיוחד בממלכת סבא וסבתא", image: topicGrandparentsNight,
        description: "לילה קסום אצל סבא וסבתא", ageLabel: "3-6",
        logic: { outfit: "cozy pajamas", background: "warm cozy living room at night with lamp light, family photos on wall, cookies on table, magical sparkles", theme: "grandparents, family bonding, sleeping at grandparents house, intergenerational love, bedtime stories, feeling safe away from home, special traditions" }
      },
      {
        id: "sibling-team", label: "צוות מנצח - אהבת אחים", image: topicSiblingLove,
        description: "אחים ואחיות - צוות לכל החיים", ageLabel: "3-6",
        logic: { outfit: "matching team jerseys", background: "colorful kids bedroom with toys, team banner, sparkles and stars", theme: "sibling love, teamwork between brothers and sisters, sharing, resolving conflicts, supporting each other, being a team, family bonds" }
      },
      {
        id: "magic-keys", label: "מפתחות הקסם", image: topicMagicKeys,
        description: "תודה, בבקשה וסליחה - המילים הקסומות", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes", background: "magical golden doorway with warm light streaming through, sparkles and floating hearts, three glowing keys", theme: "manners, saying thank you, saying please, saying sorry, politeness, social skills, magic words, kindness in communication, respect" }
      },
      {
        id: "secret-keeper", label: "שומר הסודות", image: topicStrangerDanger,
        description: "לא הולכים עם זרים", ageLabel: "4-8",
        logic: { outfit: "superhero cape with protective shield", background: "safe neighborhood street, confident child with glowing protective shield", theme: "stranger danger, not going with strangers, personal safety, telling a trusted adult, saying no to strangers, body safety, empowerment, knowing safe adults" }
      },
      // Existing topics moved here
      {
        id: "body-hero-teeth", label: "צחצוח שיניים קסום", image: topicTeethBrushing,
        description: "עם פיית השיניים והדרקון", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes at home", background: "bright magical bathroom with sparkles and friendly dental fairy dragon", theme: "teeth brushing, dental hygiene, making brushing fun, sensory experience" }
      },
      {
        id: "body-hero-bath", label: "אמבטיה של כיף", image: topicBathShower,
        description: "בועות, ברווזון וקצף", ageLabel: "3-6",
        logic: { outfit: "bath time with rubber ducky cap", background: "colorful bubble bath with floating toys and rainbow bubbles", theme: "bath time fun, getting clean, water play, sensory experience" }
      },
      {
        id: "body-hero-nails", label: "גזירת ציפורניים", image: topicNailTrimming,
        description: "עם הפיות הקסומות", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes", background: "magical bathroom with fairies and sparkles, friendly nail clippers", theme: "nail trimming, grooming routine, overcoming sensory discomfort" }
      },
      {
        id: "body-hero-hands", label: "שטיפת ידיים", image: topicHandWashing,
        description: "מנצחים את החיידקים!", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes", background: "bright colorful bathroom with soap bubbles and friendly germs being washed away", theme: "hand hygiene, washing hands, staying healthy, sensory experience" }
      },
      {
        id: "barber-visit", label: "ביקור אצל הספר", image: topicBarberVisit,
        description: "תספורת קסומה וכיפית", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes with barber cape", background: "friendly colorful barber shop with mirrors, sparkles, and fun chair", theme: "visiting the barber, haircut, overcoming fear, grooming, bravery" }
      },
      {
        id: "dentist-visit", label: "ביקור אצל רופא/ת השיניים", image: topicDentistVisit,
        description: "הולכים לרופא שיניים בלי פחד", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes", background: "friendly colorful dental clinic with sparkles, kind dentist, and fun dental chair", theme: "visiting the dentist, overcoming fear, dental checkup, bravery, health" }
      },
      {
        id: "pacifier-fairy", label: "פיית המוצץ", image: topicPacifier,
        description: "נפרדים מהמוצץ בקסם", ageLabel: "0-3",
        logic: { outfit: "cozy pajamas", background: "magical nursery with sparkles and gentle fairy", theme: "saying goodbye to pacifier, growing up, milestone transition, managing change" }
      },
      {
        id: "potty-training", label: "גמילה מחיתולים", image: topicPottyTraining,
        description: "הופכים לילד/ה גדול/ה!", ageLabel: "0-3",
        logic: { outfit: "everyday casual clothes", background: "cheerful colorful bathroom with a friendly potty chair, stickers on the wall, and a supportive teddy bear", theme: "potty training, transitioning from diapers, growing up milestone, independence, positive reinforcement" }
      },
      {
        id: "brave-taster", label: "הטועם האמיץ", image: topicBraveTaster,
        description: "טועמים אוכל חדש באומץ", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes with a chef hat or apron", background: "warm colorful kitchen with fruits, vegetables, and sparkles on the table", theme: "trying new foods, picky eating, bravery, sensory exploration, healthy eating" }
      },
      {
        id: "independence", label: "אני יכול/ה לבד!", image: topicIndependence,
        description: "מתלבשים ומסתדרים לבד", ageLabel: "4-8",
        logic: { outfit: "mismatched fun clothes the child picked themselves", background: "bright cheerful bedroom with open wardrobe, clothes scattered playfully, warm morning sunlight and sparkles", theme: "independence, self-dressing, doing things alone, growing up, confidence, pride in self-reliance" }
      },
      {
        id: "new-sibling", label: "נולד לי אח/ות", image: topicNewSibling,
        description: "מקבלים תינוק חדש במשפחה", ageLabel: "3-6",
        logic: { outfit: "comfortable home clothes", background: "warm nursery room with crib, mobile, soft lighting, and family atmosphere", theme: "welcoming new sibling, sharing attention, becoming a big brother/sister, family changes, emotions about new baby" }
      },
      {
        id: "fear-of-dark", label: "פחד מהחושך", image: topicFearOfDark,
        description: "מגלים שאין מה לפחד", ageLabel: "3-6",
        logic: { outfit: "cozy pajamas with soft slippers", background: "enchanted bedroom at night with a protective glowing nightlight, stars, and friendly shadows", theme: "overcoming fear of darkness, bravery, emotional regulation, calming bedtime, feeling safe" }
      },
      {
        id: "lost-tooth", label: "נפלה לי שן", image: topicLostTooth,
        description: "פיית השיניים באה לבקר", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes", background: "magical bedroom at night with a tiny glowing tooth fairy, sparkles, and a little tooth under a pillow", theme: "losing a tooth, growing up, tooth fairy, excitement and courage, body changes" }
      },
      {
        id: "pocket-kiss", label: "נשיקה בכיס", image: topicPocketKiss,
        description: "פרידה בבוקר עם אהבה", ageLabel: "3-6",
        logic: { outfit: "everyday clothes with a small backpack", background: "kindergarten entrance at morning with warm sunlight, parent giving a kiss, a tiny glowing heart tucked in pocket", theme: "separation anxiety, morning goodbye, feeling safe, love and comfort, transitioning to kindergarten" }
      },
      {
        id: "anger-cloud", label: "ענן הכעס שלי", image: topicAngerCloud,
        description: "לומדים להתמודד עם כעס", ageLabel: "3-6",
        logic: { outfit: "comfortable home clothes", background: "cozy room with a dark fluffy cloud above that transforms into a rainbow cloud with sparkles and deep breaths", theme: "anger management, emotional regulation, tantrums, deep breathing, calming down, naming emotions, self-control" }
      },
      {
        id: "mom-dont-go", label: "אמא אל תלכי", image: topicMomDontGo,
        description: "מתמודדים עם פרידה בבוקר", ageLabel: "3-6",
        logic: { outfit: "everyday clothes with a small backpack", background: "kindergarten entrance at morning with warm golden sunlight, magical sparkles, a glowing heart in the child's pocket", theme: "separation anxiety, missing mom, morning goodbye, magical invisible string connecting parent and child, feeling safe and loved even apart, building confidence" }
      },
      {
        id: "friendship-courage", label: "חברים בגן", image: topicFriendship,
        description: "משחקים ומתגברים על קשיים", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes suitable for playing", background: "colorful kindergarten playground with sandbox and sunny weather", theme: "social skills, making friends, playing together, sharing, managing emotions" }
      },
      {
        id: "sharing-fun", label: "כמה כיף לחלוק", image: topicSharing,
        description: "לחלוק זה כיף!", ageLabel: "3-6",
        logic: { outfit: "everyday casual clothes", background: "colorful kindergarten with toys and snacks, children playing together happily", theme: "sharing toys, generosity, kindness, social skills, taking turns" }
      },
      {
        id: "apologize", label: "ללמוד לבקש סליחה", image: topicApologize,
        description: "לומר סליחה ולתקן", ageLabel: "4-8",
        logic: { outfit: "everyday casual clothes", background: "colorful kindergarten with soft lighting, two children facing each other with gentle expressions", theme: "apologizing, taking responsibility, empathy, repairing friendships, emotional growth" }
      },
      {
        id: "new-house", label: "עוברים לבית חדש", image: topicNewHouse,
        description: "הרפתקה של מעבר דירה", ageLabel: "3-6",
        logic: { outfit: "comfortable casual clothes", background: "new colorful house with moving boxes, a magical garden with flowers blooming, warm golden sunlight, sparkles", theme: "moving to a new house, change, leaving friends, making new friends, adapting, feeling safe in a new place, family support" }
      },
      {
        id: "first-day-kindergarten", label: "היום הראשון בגן", image: topicFirstDayKindergarten,
        description: "מתחילים הרפתקה חדשה בגן", ageLabel: "3-6",
        logic: { outfit: "everyday clothes with a small colorful backpack", background: "whimsical kindergarten entrance with oversized crayons, floating magical ABC letters, warm golden sunlight and sparkles", theme: "first day at kindergarten, separation anxiety, making new friends, new beginnings, bravery, excitement, adapting to new environment" }
      },
      {
        id: "my-special-family", label: "המשפחה המיוחדת שלי", image: topicMySpecialFamily,
        description: "חוגגים את כל סוגי המשפחות", ageLabel: "3-6",
        logic: { outfit: "comfortable cozy home clothes", background: "warm loving living room with family photos on the wall showing diverse families, soft golden light, floating hearts and sparkles", theme: "celebrating all family types, single-parent families, same-sex parents, grandparent-led families, blended families, adoptive families, unconditional love, feeling safe, belonging" }
      },
    ]
  },
  {
    id: "imagination-kingdom",
    title: "ממלכת הדמיון",
    emoji: "🏰",
    castImage: castLeo,
    castName: "ליאו",
    topics: [
      {
        id: "underwater-journey", label: "הרפתקה במצולות הים", image: topicUnderwater,
        description: "הרפתקה קסומה מתחת למים", ageLabel: "3-8",
        logic: { outfit: "magical diving suit with glowing accents", background: "vibrant underwater world with coral reefs, bioluminescent jellyfish, friendly sea turtle, bubbles and sparkles", theme: "underwater exploration, ocean discovery, sensory wonder, marine life, imagination, courage, nature beauty" }
      },
      {
        id: "rain-party", label: "רוקדים בגשם", image: topicRainParty,
        description: "רוקדים בגשם עם מטריות צבעוניות", ageLabel: "3-6",
        logic: { outfit: "rain boots and a colorful raincoat with hood", background: "garden in the rain with puddles, rainbow reflections, colorful umbrellas, and sparkling raindrops", theme: "sensory play, rain, nature, joy, jumping in puddles, weather exploration" }
      },
      {
        id: "space-adventure", label: "טיסה בחלל", image: topicSpaceHero,
        description: "מסע בין כוכבים ופלאות", ageLabel: "3-8",
        logic: { outfit: "astronaut spacesuit with helmet", background: "outer space with stars, planets, and galaxies", theme: "exploration and discovery in space, bravery, imagination" }
      },
      {
        id: "magic-kingdom", label: "ממלכת הקסם", image: topicMagicCastle,
        description: "הרפתקה קסומה בארמון", ageLabel: "3-6",
        logic: { outfit: "royal prince/princess attire with crown", background: "magical castle with towers and enchanted gardens", theme: "fantasy and magic in a royal kingdom, kindness, helping others" }
      },
      {
        id: "cloud-adventure", label: "טיול בעננים", image: topicCloudAdventure,
        description: "מעופפים בין עננים קסומים", ageLabel: "3-6",
        logic: { outfit: "light airy clothes with tiny wings", background: "dreamy sky filled with fluffy magical clouds, rainbows, floating islands, and sparkling stars", theme: "imagination, flying, dreaming, sensory wonder, freedom, creativity" }
      },
      {
        id: "zoo-adventure", label: "טיול בגן החיות", image: topicZoo,
        description: "פוגשים חיות ומתרגלים שיתוף", ageLabel: "3-6",
        logic: { outfit: "comfortable outdoor clothes with backpack", background: "colorful zoo with friendly animals, fences, trees", theme: "animal discovery, nature, sharing with friends, taking turns" }
      },
    ]
  },
  {
    id: "adventure-time",
    title: "יוצאים להרפתקה",
    emoji: "🚀",
    castImage: castZoe,
    castName: "זואי",
    topics: [
      {
        id: "flying-vacation", label: "{childName} כובש/ת את השמיים", image: topicFlyingVacation,
        description: "טסים לחופשה משפחתית!", ageLabel: "3-8",
        logic: { outfit: "cute travel outfit with small backpack and stuffed animal", background: "inside a magical airplane with clouds visible through window, sparkles, suitcases with stickers", theme: "flying on an airplane, family vacation, travel excitement, first flight, overcoming fear of flying, new experiences, adventure" }
      },
      {
        id: "magical-forest", label: "מסע ביער הקסום", image: topicMagicalForest,
        description: "הרפתקה ביער מלא קסם ופלאים", ageLabel: "3-8",
        logic: { outfit: "adventure clothes with small explorer backpack", background: "enchanted forest with glowing mushrooms, fairy lights, towering trees, bioluminescent flowers, friendly woodland creatures", theme: "magical forest journey, exploration, nature discovery, courage, friendly creatures, imagination, wonder, adventure" }
      },
      {
        id: "seatbelt-friend", label: "החגורה היא חברה", image: topicSeatbeltSafety,
        description: "לומדים לחגור חגורת בטיחות", ageLabel: "3-6",
        logic: { outfit: "casual clothes sitting in a car seat with seatbelt", background: "inside a colorful family car, window showing sunny road, sparkles around the seatbelt", theme: "seatbelt safety, car safety, buckling up, road safety, responsibility, the seatbelt as a protective friend, staying safe in the car" }
      },
      {
        id: "family-trip", label: "טיול משפחתי", image: topicFamilyTrip,
        description: "הרפתקה בטבע עם המשפחה", ageLabel: "3-6",
        logic: { outfit: "hiking clothes with backpack", background: "beautiful nature trail with trees, stream, flowers, and dog", theme: "family bonding, nature exploration, teamwork, helping others" }
      },
      {
        id: "birthday-party", label: "מסיבת יום הולדת", image: topicBirthday,
        description: "חוגגים ומשתפים עם חברים", ageLabel: "3-6",
        logic: { outfit: "party clothes, festive attire", background: "colorful kindergarten or party venue with cake, decorations, friends", theme: "birthday celebration, friendship, sharing joy, being a good host" }
      },
    ]
  },
];

const ALL_TOPICS = ADVENTURE_CATEGORIES.flatMap(cat => cat.topics);

const TopicCard = ({
  topic,
  isSelected,
  onSelect,
  isLiked,
  onToggleLike,
  compact = false,
  displayLabel,
}: {
  topic: AdventureTopic;
  isSelected: boolean;
  onSelect: (topic: AdventureTopic) => void;
  isLiked: boolean;
  onToggleLike: (topicId: string) => void;
  compact?: boolean;
  displayLabel: string;
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
        alt={displayLabel}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Heart/Wishlist button */}
      <div
        className="absolute top-1.5 left-1.5 z-10"
        onClick={(e) => { e.stopPropagation(); onToggleLike(topic.id); }}
        role="button"
        aria-label={isLiked ? "הסר מהמועדפים" : "הוסף למועדפים"}
      >
        <Heart
          className={cn(
            "w-5 h-5 drop-shadow-md transition-all duration-200 active:scale-125",
            isLiked ? "fill-red-500 text-red-500" : "fill-white/30 text-white"
          )}
        />
      </div>

      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
          <span className="text-primary-foreground text-xs">✓</span>
        </div>
      )}

      {/* Age badge */}
      <div className="absolute bottom-7 left-1.5 bg-black/50 backdrop-blur-sm text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold">
        {topic.ageLabel}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
        <h4 className="font-bold text-xs leading-tight">{displayLabel}</h4>
      </div>
    </div>
  </button>
);

const CategoryCarousel = ({
  category,
  formData,
  onTopicSelect,
  isExpanded,
  onToggleExpand,
  likedTopics,
  onToggleLike,
}: {
  category: AdventureCategory;
  formData: StoryFormData;
  onTopicSelect: (topic: AdventureTopic) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  likedTopics: Set<string>;
  onToggleLike: (topicId: string) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
      {/* Category Hero Card */}
      <div className="px-4 mb-2">
        <div
          ref={heroRef}
          className="relative w-full rounded-2xl overflow-hidden shadow-lg transition-all duration-700 ease-out"
          style={{
            aspectRatio: '16/9',
            transform: heroVisible ? 'scale(1)' : 'scale(0.93)',
            opacity: heroVisible ? 1 : 0.6,
          }}
        >
          {category.castImage ? (
            <img
              src={category.castImage}
              alt={category.castName || category.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
            <div>
              <h3 className="text-base font-black text-white drop-shadow-md">{category.title}</h3>
              <span className="text-[10px] text-white/70 font-medium">{category.topics.length} נושאים</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={onToggleExpand}
                className="text-[10px] font-bold text-white/90 hover:text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full transition-colors"
              >
                {isExpanded ? "סגור" : "צפה בהכל"}
              </button>
              {!isExpanded && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-white hover:bg-white/20" onClick={() => scroll('right')} aria-label="הקודם">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-white hover:bg-white/20" onClick={() => scroll('left')} aria-label="הבא">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded ? (
        /* Grid View */
        <div className="grid grid-cols-2 gap-2.5 px-4 pb-2">
          {category.topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isSelected={formData.topic === topic.id}
              onSelect={onTopicSelect}
              isLiked={likedTopics.has(topic.id)}
              onToggleLike={onToggleLike}
              displayLabel={renderTopicLabel(topic.label, formData.childName, formData.childGender)}
            />
          ))}
        </div>
      ) : (
        /* Carousel */
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
              isLiked={likedTopics.has(topic.id)}
              onToggleLike={onToggleLike}
              compact
              displayLabel={renderTopicLabel(topic.label, formData.childName, formData.childGender)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TopicStep = ({ formData, updateFormData }: TopicStepProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { likedTopics, toggleLike } = useTopicWishlist();

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

  const toggleExpand = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  return (
    <div className="space-y-3 -mx-3 -mt-2">
      {/* Title */}
      <div className="text-center px-3 pt-1">
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          בחרו את ההרפתקה
        </h1>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          ✨ כל סיפור נכתב מחדש במיוחד עבור הילד/ה שלך ומשלב את שמו/ה בעלילה
        </p>
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
              isExpanded={expandedCategories.has(cat.id)}
              onToggleExpand={() => toggleExpand(cat.id)}
              likedTopics={likedTopics}
              onToggleLike={toggleLike}
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
