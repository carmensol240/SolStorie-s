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

export interface TopicItem {
  id: string;
  label: string;
  image: string;
  ageRange: string;
}

export interface CharacterSection {
  id: string;
  character: string;
  characterEn: string;
  categoryLabel: string;
  categoryEmoji: string;
  heroImage: string;
  topics: TopicItem[];
}

export const EDUCATOR_TOOLBOX_IMAGE = topicEducationalToolbox;

export const CHARACTER_SECTIONS: CharacterSection[] = [
  {
    id: "heroes",
    character: "סול",
    characterEn: "Sol",
    categoryLabel: "גיבורי על",
    categoryEmoji: "🦸",
    heroImage: castSol,
    topics: [
      { id: "superheroes", label: "אנחנו גיבורי על", image: topicSuperheroes, ageRange: "3-8" },
      { id: "body-safety", label: "הגוף שלי הוא רק שלי", image: topicBodySafety, ageRange: "3-8" },
      { id: "road-safety", label: "שומרי הדרכים", image: topicRoadSafety, ageRange: "3-6" },
      { id: "environment", label: "שומר כדור הארץ", image: topicEnvironment, ageRange: "4-8" },
      { id: "we-are-special", label: "כולנו מיוחדים ודומים", image: topicWeAreSpecial, ageRange: "4-8" },
      { id: "just-be-me", label: "פשוט להיות אני", image: topicJustBeMe, ageRange: "4-8" },
      { id: "helping-others", label: "הלב של סול", image: topicHelpingOthers, ageRange: "3-6" },
    ],
  },
  {
    id: "growing",
    character: "מיה",
    characterEn: "Mia",
    categoryLabel: "גדלים ביחד",
    categoryEmoji: "🌱",
    heroImage: castMia,
    topics: [
      { id: "stranger-danger", label: "שומרי הסודות", image: topicStrangerDanger, ageRange: "3-8" },
      { id: "body-hero-teeth", label: "צחצוח שיניים קסום", image: topicTeethBrushing, ageRange: "3-6" },
      { id: "body-hero-bath", label: "אמבטיה של כיף", image: topicBathShower, ageRange: "3-6" },
      { id: "bathtime", label: "בועת גר", image: topicBathtime, ageRange: "3-6" },
      { id: "toothbrush", label: "מברשת השיניים הקסומה", image: topicToothbrush, ageRange: "3-6" },
      { id: "body-hero-hands", label: "שטיפת ידיים", image: topicHandWashing, ageRange: "3-6" },
      { id: "potty-training", label: "גמילה מחיתולים", image: topicPottyTraining, ageRange: "0-3" },
      { id: "pacifier-fairy", label: "פיית המוצץ", image: topicPacifier, ageRange: "0-3" },
      { id: "first-day-kindergarten", label: "יום ראשון בגן", image: topicFirstDayKindergarten, ageRange: "3-6" },
      { id: "mom-dont-go", label: "אמא אל תלכי", image: topicMomDontGo, ageRange: "3-6" },
      { id: "fear-of-dark", label: "סול מגלה שהחושך לא מפחיד", image: topicFearOfDark, ageRange: "3-6" },
      { id: "friendship-courage", label: "חברים בגן", image: topicFriendship, ageRange: "3-6" },
      { id: "sharing", label: "כמה כיף לחלוק", image: topicSharing, ageRange: "3-6" },
      { id: "apologize", label: "ללמוד לבקש סליחה", image: topicApologize, ageRange: "3-6" },
      { id: "trying-again", label: "הקסם שבניסיון", image: topicTryingAgain, ageRange: "3-6" },
      { id: "independence", label: "אני יכולה לבד!", image: topicIndependence, ageRange: "3-6" },
      { id: "anger-cloud", label: "ענן הכעס", image: topicAngerCloud, ageRange: "3-6" },
      { id: "brave-taster", label: "הטועם האמיץ", image: topicBraveTaster, ageRange: "3-6" },
      { id: "clean-room", label: "לסדר את החדר", image: topicCleanRoom, ageRange: "3-6" },
      { id: "new-house", label: "עוברים לבית חדש", image: topicNewHouse, ageRange: "4-8" },
      { id: "dentist-visit", label: "ביקור אצל רופא השיניים", image: topicDentistVisit, ageRange: "3-6" },
      { id: "barber-visit", label: "ביקור אצל הספר", image: topicBarberVisit, ageRange: "3-6" },
      { id: "lost-tooth", label: "שן נופלת!", image: topicLostTooth, ageRange: "4-8" },
      { id: "body-hero-nails", label: "גזירת ציפורניים", image: topicNailTrimming, ageRange: "3-6" },
      { id: "seatbelt-safety", label: "חגורת בטיחות", image: topicSeatbeltSafety, ageRange: "3-6" },
      { id: "new-sibling", label: "אח/ות חדש/ה", image: topicNewSibling, ageRange: "3-6" },
      { id: "bedtime-story", label: "סיפור לפני השינה", image: topicBedtime, ageRange: "3-6" },
    ],
  },
  {
    id: "imagination",
    character: "ליאו",
    characterEn: "Leo",
    categoryLabel: "ממלכת הדמיון",
    categoryEmoji: "🏰",
    heroImage: castLeo,
    topics: [
      { id: "magic-kingdom", label: "ממלכת הקסם", image: topicMagicCastle, ageRange: "3-8" },
      { id: "magical-forest", label: "היער הקסום", image: topicMagicalForest, ageRange: "3-8" },
      { id: "cloud-adventure", label: "הרפתקה בעננים", image: topicCloudAdventure, ageRange: "3-6" },
      { id: "kingdom", label: "הממלכה הרחוקה", image: topicKingdom, ageRange: "4-8" },
      { id: "magic-keys", label: "המפתחות הקסומים", image: topicMagicKeys, ageRange: "4-8" },
      { id: "space", label: "מסע לכוכבים", image: topicSpace, ageRange: "4-8" },
      { id: "rain-party", label: "מסיבה בגשם", image: topicRainParty, ageRange: "3-6" },
    ],
  },
  {
    id: "adventure",
    character: "זואי",
    characterEn: "Zoe",
    categoryLabel: "יוצאים להרפתקה",
    categoryEmoji: "🚀",
    heroImage: castZoe,
    topics: [
      { id: "space-adventure", label: "הרפתקה בחלל", image: topicSpaceHero, ageRange: "4-8" },
      { id: "zoo-adventure", label: "טיול בגן החיות", image: topicZoo, ageRange: "3-6" },
      { id: "family-trip", label: "טיול משפחתי", image: topicFamilyTrip, ageRange: "3-8" },
      { id: "birthday-party", label: "יום הולדת", image: topicBirthday, ageRange: "3-6" },
      { id: "underwater", label: "הרפתקה מתחת למים", image: topicUnderwater, ageRange: "4-8" },
      { id: "flying-vacation", label: "טיסה לחופשה", image: topicFlyingVacation, ageRange: "3-8" },
      { id: "sibling-love", label: "אהבת אחים", image: topicSiblingLove, ageRange: "3-6" },
      { id: "my-special-family", label: "המשפחה המיוחדת שלי", image: topicMySpecialFamily, ageRange: "3-8" },
      { id: "grandparents-night", label: "לילה אצל סבא וסבתא", image: topicGrandparentsNight, ageRange: "3-6" },
      { id: "pocket-kiss", label: "הנשיקה בכיס של אמא", image: topicPocketKiss, ageRange: "3-6" },
    ],
  },
  {
    id: "edu",
    character: "בן",
    characterEn: "Ben",
    categoryLabel: "ארגז כלים חינוכי",
    categoryEmoji: "🎓",
    heroImage: topicEducationalToolbox,
    topics: [
      { id: "social-skills-edu", label: "מיומנויות חברתיות", image: topicFriendship, ageRange: "3-6" },
      { id: "values-emotions-edu", label: "ערכים ורגשות", image: topicAngerCloud, ageRange: "3-6" },
      { id: "holidays-seasons-edu", label: "חגים ועונות השנה", image: topicRainParty, ageRange: "3-6" },
      { id: "life-skills-edu", label: "מיומנויות חיים", image: topicIndependence, ageRange: "3-6" },
    ],
  },
];
