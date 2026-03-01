// Cast hero images
import castSol from "@/assets/cast-sol-adventure.jpg";
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
// New topic images from storage
const TOPIC_IMAGES_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/topic-images`;
const topicBloodTest = `${TOPIC_IMAGES_BASE}/topic-blood-test.png`;
const topicHelpingAtHome = `${TOPIC_IMAGES_BASE}/topic-helping-at-home.png`;
const topicHomeOfLove = `${TOPIC_IMAGES_BASE}/topic-home-of-love.png`;
const topicPlayingTogether = `${TOPIC_IMAGES_BASE}/topic-playing-together.png`;
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
import topicEducationalToolbox from "@/assets/topic-educational-toolbox.jpeg";
import topicSafeRoom from "@/assets/topic-safe-room.png";

export interface TopicItem {
  id: string;
  label: string;
  description: string;
  image: string;
  ageRange: string;
  keywords?: string[];
  featured?: boolean;
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
    id: "values",
    character: "",
    characterEn: "",
    categoryLabel: "עולם הערכים",
    categoryEmoji: "💎",
    heroImage: castSol,
    topics: [
      { id: "superheroes", label: "אנחנו גיבורי על", description: "סיפור על כוחות-על אמיתיים: אומץ, חסד ונחישות. הילד/ה מגלה שכל אחד יכול להיות גיבור על בדרכו המיוחדת.", image: topicSuperheroes, ageRange: "3-8" },
      { id: "body-safety", label: "הגוף שלי הוא רק שלי", description: "סיפור חשוב על גבולות הגוף, מגע בטוח ומגע לא נעים, ואיך אומרים 'לא' בביטחון ומספרים למבוגר.", image: topicBodySafety, ageRange: "3-8" },
      { id: "road-safety", label: "שומרי הדרכים", description: "הרפתקה מרתקת על בטיחות בדרכים: חציית כביש בזהירות, רמזורים, מעבר חציה ואיך נהיים שומרי דרכים אמיתיים.", image: topicRoadSafety, ageRange: "3-6" },
      { id: "environment", label: "שומר כדור הארץ", description: "סיפור על אהבת הטבע והסביבה: מיחזור, שמירה על ניקיון ולמה חשוב לטפל בעולם שלנו.", image: topicEnvironment, ageRange: "4-8" },
      { id: "we-are-special", label: "כולנו מיוחדים ודומים", description: "סיפור על קבלה והכלה: כל אחד נראה שונה ומיוחד, אבל בפנים כולנו רוצים אותו דבר – אהבה וחברות.", image: topicWeAreSpecial, ageRange: "4-8" },
      { id: "just-be-me", label: "פשוט להיות אני", description: "סיפור מעצים על קבלה עצמית: לאהוב את מי שאני, עם כל התכונות המיוחדות שלי.", image: topicJustBeMe, ageRange: "4-8" },
      { id: "helping-others", label: "הלב של סול", description: "סיפור חם על עזרה לזולת: איך מחווה קטנה של חסד יכולה להאיר את היום של מישהו אחר.", image: topicHelpingOthers, ageRange: "3-6" },
      { id: "stranger-danger", label: "שומרי הסודות", description: "סיפור חינוכי על זהירות מזרים: מתי אומרים 'לא', מתי מספרים למבוגר ואיך נשארים בטוחים.", image: topicStrangerDanger, ageRange: "3-8" },
      { id: "seatbelt-safety", label: "חגורת בטיחות", description: "סיפור על חשיבות חגירת חגורת הבטיחות ברכב: למה היא מגינה עלינו ואיך הופכים את זה להרגל.", image: topicSeatbeltSafety, ageRange: "3-6" },
      { id: "blood-test", label: "סול וגיבורי הבריאות", description: "סיפור מעודד על ביקור בבדיקת דם: סול מגלה שהיא גיבורת בריאות אמיתית ומקבלה מדבקת כוכב.", image: topicBloodTest, ageRange: "3-6" },
      { id: "true-friendship", label: "חברות אמת", description: "סיפור על חברות אמיתית: לא רק שמחים ביחד ביום שמש, אלא גם עומדים לצד החבר/ה כשהיום קשה וה-שמיים אפורים.", image: topicFriendship, ageRange: "4-8", keywords: ["חברות", "חבר אמת", "נאמנות", "תמיכה"] },
      { id: "accepting-differences", label: "קבלת השונה", description: "סיפור על פגישה עם מישהו שנראה שונה לגמרי – ועל הגילוי הגדול שמתחת לשטח, לבבות כל-כך דומים.", image: topicWeAreSpecial, ageRange: "4-8", keywords: ["שונות", "קבלה", "הכלה", "אחרות"] },
      { id: "helping-home", label: "עזרה בבית", description: "סיפור על הגאווה שבשותפות: כשכולם עוזרים – לסדר, לבשל, לנקות – הבית הופך לפרויקט משפחתי שכולם חלק ממנו.", image: topicHelpingAtHome, ageRange: "3-6", keywords: ["עזרה", "בית", "שיתוף", "משפחה", "אחריות"] },
    ],
  },
  {
    id: "emotions",
    character: "",
    characterEn: "",
    categoryLabel: "התמודדות ורגשות",
    categoryEmoji: "🌱",
    heroImage: castMia,
    topics: [
      { id: "body-hero-teeth", label: "צחצוח שיניים קסום", description: "סיפור מהנה על צחצוח שיניים: איך הופכים את הצחצוח להרפתקה קסומה שמגינה על החיוך שלנו.", image: topicTeethBrushing, ageRange: "3-6", keywords: ["שיניים", "צחצוח", "היגיינה", "פה"] },
      { id: "body-hero-bath", label: "אמבטיה של כיף", description: "סיפור על הקסם שבאמבטיה: בועות סבון, משחקי מים וגילוי שרחצה יכולה להיות חוויה מדהימה.", image: topicBathShower, ageRange: "3-6", keywords: ["מקלחת", "רחצה", "סבון", "היגיינה", "מים", "ניקיון", "להתרחץ", "אמבט"] },
      
      { id: "home-of-love", label: "הבית של האהבה", description: "סיפור מרגש על הקשר המיוחד בין ילד/ה להורה: בית מלא אהבה, חיבוקים וביטחון.", image: topicHomeOfLove, ageRange: "3-8" },
      { id: "playing-together", label: "משחקים יחד בגינה", description: "סיפור על משחק משותף ושיתוף פעולה: לחלוק כדור, להמציא משחקים וליהנות יחד בגינה.", image: topicPlayingTogether, ageRange: "3-6" },
      { id: "body-hero-hands", label: "שטיפת ידיים", description: "סיפור על שטיפת ידיים נכונה: למה חשוב לשטוף ידיים ואיך הופכים את זה להרגל כיפי.", image: topicHandWashing, ageRange: "3-6", keywords: ["היגיינה", "ניקיון", "חיידקים", "סבון"] },
      { id: "potty-training", label: "גמילה מחיתולים", description: "סיפור מעודד על המעבר לסיר או אסלה: כל ילד/ה עושה את זה בקצב שלו – וזה בסדר גמור!", image: topicPottyTraining, ageRange: "0-3" },
      { id: "pacifier-fairy", label: "פיית המוצץ", description: "סיפור קסום על פרידה מהמוצץ: פיית המוצץ מגיעה לאסוף אותו ומשאירה הפתעה מיוחדת.", image: topicPacifier, ageRange: "0-3" },
      { id: "first-day-kindergarten", label: "יום ראשון בגן", description: "סיפור על ההתרגשות והחשש של היום הראשון בגן: חברים חדשים, משחקים והגננת החמה.", image: topicFirstDayKindergarten, ageRange: "3-6" },
      { id: "mom-dont-go", label: "אמא אל תלכי", description: "סיפור על חרדת נטישה: איך מתמודדים עם הרגע שאמא הולכת ומגלים שהיא תמיד חוזרת.", image: topicMomDontGo, ageRange: "3-6" },
      { id: "fear-of-dark", label: "סול מגלה שהחושך לא מפחיד", description: "סיפור על התגברות על פחד מהחושך: לגלות שהחושך מלא כוכבים, ירח וחלומות יפים.", image: topicFearOfDark, ageRange: "3-6" },
      { id: "friendship-courage", label: "חברים בגן", description: "סיפור על חברות אמיתית: איך מתחילים לדבר עם ילד חדש, מה עושים כשיש ריב ואיך מתפייסים.", image: topicFriendship, ageRange: "3-6" },
      { id: "sharing", label: "כמה כיף לחלוק", description: "סיפור על שיתוף ונדיבות: לחלוק צעצועים, ממתקים ורגעים – ולגלות שלתת זה לקבל.", image: topicSharing, ageRange: "3-6" },
      { id: "apologize", label: "ללמוד לבקש סליחה", description: "סיפור על אחריות ופיוס: מה קורה כשטועים, למה חשוב להתנצל ואיך מרגישים אחרי.", image: topicApologize, ageRange: "3-6" },
      { id: "trying-again", label: "הקסם שבניסיון", description: "סיפור על התמדה: גם כשלא מצליחים בפעם הראשונה, הקסם האמיתי הוא לנסות שוב ושוב.", image: topicTryingAgain, ageRange: "3-6" },
      { id: "independence", label: "אני יכולה לבד!", description: "סיפור מעצים על עצמאות: להתלבש, לשים נעליים ולגלות את הכוח לעשות דברים לבד.", image: topicIndependence, ageRange: "3-6" },
      { id: "anger-cloud", label: "ענן הכעס", description: "סיפור על ויסות רגשי: מה עושים כשענן הכעס מגיע, איך נושמים עמוק ומפזרים אותו.", image: topicAngerCloud, ageRange: "3-6" },
      { id: "brave-taster", label: "הטועם האמיץ", description: "סיפור על אכילה בריאה: להתגבר על הפחד מאוכל חדש ולגלות טעמים מפתיעים ומשמחים.", image: topicBraveTaster, ageRange: "3-6" },
      { id: "clean-room", label: "לסדר את החדר", description: "סיפור על סדר וניקיון: איך הופכים את סידור החדר למשימה מהנה שכיף לעשות.", image: topicCleanRoom, ageRange: "3-6" },
      { id: "new-house", label: "עוברים לבית חדש", description: "סיפור על מעבר דירה: ההתרגשות, הגעגוע למקום הישן והגילוי שבית חדש מלא בהפתעות.", image: topicNewHouse, ageRange: "4-8" },
      { id: "dentist-visit", label: "ביקור אצל רופא השיניים", description: "סיפור מרגיע על ביקור אצל רופא השיניים: מה קורה שם, למה זה חשוב ושאין סיבה לפחד.", image: topicDentistVisit, ageRange: "3-6" },
      { id: "barber-visit", label: "ביקור אצל הספר", description: "סיפור על תספורת ראשונה או ביקור אצל הספר: הכיסא הגבוה, הגלימה והתוצאה המדהימה.", image: topicBarberVisit, ageRange: "3-6" },
      { id: "lost-tooth", label: "שן נופלת!", description: "סיפור מרגש על שן שמתנדנדת ונופלת: ההתרגשות, פיית השיניים וההפתעה שמחכה מתחת לכרית.", image: topicLostTooth, ageRange: "4-8" },
      { id: "body-hero-nails", label: "גזירת ציפורניים", description: "סיפור על גזירת ציפורניים: למה חשוב לגזור ואיך הופכים את זה לרגע קטן ונעים.", image: topicNailTrimming, ageRange: "3-6" },
      { id: "new-sibling", label: "אח/ות חדש/ה", description: "סיפור על הגעת תינוק חדש למשפחה: ההתרגשות, הקנאה הקטנה והאהבה הגדולה שצומחת.", image: topicNewSibling, ageRange: "3-6" },
      { id: "bedtime-story", label: "סיפור לפני השינה", description: "סיפור מרגיע לפני השינה: שגרת ערב חמימה, חיבוק, נשיקה וחלומות מתוקים.", image: topicBedtime, ageRange: "3-6" },
      { id: "pocket-kiss", label: "הנשיקה בכיס של אמא", description: "סיפור מרגש על נשיקה שאמא שמה בכיס: בכל רגע של געגוע, אפשר לשלוף אותה ולהרגיש קרוב.", image: topicPocketKiss, ageRange: "3-6" },
      { id: "sibling-love", label: "צוות מבצע – אהבת אחים", description: "סיפור על הקשר בין אחים: ריבים קטנים, הרפתקאות משותפות ואהבה שלא נגמרת.", image: topicSiblingLove, ageRange: "3-6" },
      { id: "my-special-family", label: "המשפחה המיוחדת שלי", description: "סיפור על סוגי משפחות שונים: כל משפחה מיוחדת בדרכה, והדבר החשוב ביותר הוא האהבה.", image: topicMySpecialFamily, ageRange: "3-8" },
      { id: "safe-room-sirens", label: "* שהייה בממ\"ד ואזעקות", description: "סיפור מרגיע ומחזק על הרגעים בממ\"ד: איך נשארים רגועים כשנשמעת אזעקה, מה עושים יחד כמשפחה ולמה הממ\"ד הוא המקום הכי בטוח. סיפור שעוזר לילדים להרגיש מוגנים, אהובים ובטוחים.", image: topicSafeRoom, ageRange: "0-8", keywords: ["ממד", "אזעקה", "מלחמה", "פחד", "בטחון", "מקלט", "צבע אדום", "סירנה", "מוגנות", "רגיעה"], featured: true },
    ],
  },
  {
    id: "creativity",
    character: "",
    characterEn: "",
    categoryLabel: "דמיון ויצירה",
    categoryEmoji: "🎨",
    heroImage: castLeo,
    topics: [
      { id: "zoo-adventure", label: "טיול בגן החיות", description: "הרפתקה מלאת חיות בגן החיות: לפגוש אריות, ג'ירפות, קופים ולגלות עובדות מדהימות.", image: topicZoo, ageRange: "3-6" },
      { id: "cloud-adventure", label: "טיול בעננים", description: "הרפתקה קסומה מעל העננים: לדמיין צורות, לגלוש על עננים ולפגוש דמויות מפתיעות.", image: topicCloudAdventure, ageRange: "3-6" },
      { id: "magic-kingdom", label: "ממלכת הקסם", description: "מסע לממלכה קסומה עם טירות, דרקונים ידידותיים ושבילים מסתוריים מלאי הפתעות.", image: topicMagicCastle, ageRange: "3-8" },
      { id: "rain-party", label: "רוקדים בגשם", description: "הרפתקה ברחובות הגשומים: שלוליות, מגפיים צבעוניות וריקוד שמח תחת הטיפות.", image: topicRainParty, ageRange: "3-6" },
      { id: "underwater", label: "הרפתקה במעמקי הים", description: "צלילה לעולם התת-ימי: דגים צבעוניים, אלמוגים, צבי ים ואוצרות נסתרים.", image: topicUnderwater, ageRange: "3-8" },
      { id: "magical-forest", label: "מסע ביער הקסום", description: "הרפתקה ביער קסום ומלא חיים: עצים מדברים, פרפרים זוהרים ושבילים מסתוריים.", image: topicMagicalForest, ageRange: "3-6" },
      { id: "space-adventure", label: "סול מכבסת את השמיים", description: "הרפתקה בין כוכבים: טיסה לחלל, מפגש עם כוכבי לכת ונחיתה על הירח.", image: topicSpaceHero, ageRange: "3-8" },
      { id: "magic-keys", label: "המפתחות הקסומים", description: "חיפוש אחר מפתחות קסומים שפותחים דלתות לעולמות מדהימים ומסתוריים.", image: topicMagicKeys, ageRange: "4-8" },
      { id: "cloud-kingdom", label: "ממלכת העננים", description: "הרפתקה מעל הכל: מסע אל ממלכה שבנויה לגמרי מעננים, שם חיים יצורים עשויי אוויר וקלים כנוצה.", image: topicCloudAdventure, ageRange: "3-6", keywords: ["עננים", "ממלכה", "קסם", "שמיים"] },
      { id: "dragon-party", label: "מסיבת הדרקונים", description: "הזמנה בלתי-צפויה למסיבה של דרקונים ידידותיים: ריקודים, אש בצבעי קשת ושיר שמח שמדהים את כל היער.", image: topicMagicCastle, ageRange: "3-8", keywords: ["דרקון", "מסיבה", "קסם", "ידידות"] },
      { id: "strange-inventions", label: "המצאות משונות", description: "ילד/ה עם דמיון פורה מחליט/ה להמציא את הדבר הכי מוזר שנראה אי-פעם – ומגלה שהמצאות הגדולות ביותר מתחילות בחיוך.", image: topicMagicKeys, ageRange: "4-8", keywords: ["המצאות", "יצירתיות", "מדע", "פיתוח"] },
    ],
  },
  {
    id: "curiosity",
    character: "",
    characterEn: "",
    categoryLabel: "סקרנות ומדע",
    categoryEmoji: "🔬",
    heroImage: castZoe,
    topics: [
      { id: "family-trip", label: "טיול משפחתי", description: "הרפתקה משפחתית בטבע: טיולים, פיקניקים, גילויים והרבה זמן איכות ביחד.", image: topicFamilyTrip, ageRange: "3-6" },
      { id: "birthday-party", label: "מסיבת יום הולדת", description: "מסיבת יום הולדת מושלמת: עוגה, בלונים, חברים, משחקים והפתעות מדהימות.", image: topicBirthday, ageRange: "3-6" },
      { id: "grandparents-night", label: "הלילה המיוחד במלכות סבא וסבתא", description: "לילה קסום אצל סבא וסבתא: סיפורים, ממתקים, פינוקים וזכרונות שנשארים לתמיד.", image: topicGrandparentsNight, ageRange: "3-6" },
      { id: "flying-vacation", label: "טיסה לחופשה", description: "הרפתקה ראשונה במטוס: ההתרגשות, ההמראה, מבט מהחלון ופיצוח האוזניים.", image: topicFlyingVacation, ageRange: "3-8" },
      { id: "space-journey", label: "מסע בחלל", description: "הרפתקה בין כוכבי הלכת: לגלות שבכל כוכב יש סוד משלו, שהיקום גדול אין-סוף וכדור הארץ שלנו הוא הפלא הכי גדול.", image: topicSpaceHero, ageRange: "4-8", keywords: ["חלל", "כוכבים", "כוכבי לכת", "מדע", "אסטרונאוט"] },
      { id: "nature-secrets", label: "סודות הטבע", description: "טיול בין העצים, האבנים והיצורים הקטנים: הטבע מלא סודות שמחכים לילד/ה סקרן/ית שיפקח/תפקח עיניים וישמע/תשמע.", image: topicEnvironment, ageRange: "3-8", keywords: ["טבע", "עצים", "חרקים", "גילוי", "מדע"] },
      { id: "how-body-works", label: "איך הגוף שלנו עובד", description: "מסע פנימה: לגלות שהגוף הוא מכונה מדהימה שעובדת בשבילנו כל הזמן – הלב מציב, הריאות נושמות והמוח חולם.", image: topicBloodTest, ageRange: "4-8", keywords: ["גוף", "בריאות", "מדע", "לב", "מוח"] },
    ],
  },
  {
    id: "edu",
    character: "",
    characterEn: "",
    categoryLabel: "ארגז כלים חינוכי",
    categoryEmoji: "🎓",
    heroImage: topicEducationalToolbox,
    topics: [
      { id: "waiting-in-line-edu", label: "⏰ המתנה בתור – מתי מגיע תורי?", description: "מדריך חברתי מובנה (Carol Gray): למה חשוב לחכות, איך עושים את זה ומה מרוויחים כשממתינים בסבלנות.", image: topicSharing, ageRange: "3-6" },
      { id: "emotion-regulation-edu", label: "🌊 ויסות רגשות – לנשום ולהירגע", description: "מדריך חברתי מובנה (Carol Gray): כלים מעשיים לזהות את הרגש, לנשום ולמצוא דרך בריאה לבטא כעס ותסכול.", image: topicAngerCloud, ageRange: "3-8" },
      { id: "holidays-seasons-edu", label: "🗓️ מעגל השנה – חגים ועונות", description: "מדריך חברתי מובנה (Carol Gray): סיפורים על מעגל השנה, חגים, עונות, מסורות ומנהגים שמלווים אותנו.", image: topicRainParty, ageRange: "3-8" },
      { id: "play-rules-edu", label: "🎲 כללי משחק – לשחק בהוגנות", description: "מדריך חברתי מובנה (Carol Gray): לחכות לתור, לא לרמות, לשמוח בהצלחה של חברים ולקבל הפסד בכבוד.", image: topicFriendship, ageRange: "3-6" },
      { id: "self-confidence-edu", label: "💪 ביטחון עצמי – אני יכול/ה!", description: "מדריך חברתי מובנה (Carol Gray): להאמין בעצמי, לנסות דברים חדשים ולדעת שאני מסוגל/ת.", image: topicIndependence, ageRange: "3-8" },
      { id: "honesty-edu", label: "🪄 כנות – לומר את האמת בעדינות", description: "מדריך חברתי מובנה (Carol Gray): ילדים רבים מרגישים שקשה לומר את האמת. כשהאמת נאמרת בעדינות, היחסים נשארים חזקים והלב קל.", image: topicApologize, ageRange: "3-8", keywords: ["אמת", "כנות", "מיומנות חברתית", "carol gray"] },
      { id: "cooperation-edu", label: "🤝 עבודת צוות – ביחד אנחנו חזקים", description: "מדריך חברתי מובנה (Carol Gray): בכיתה או בגן, כשכל אחד תורם את חלקו, המשימה הגדולה הופכת לאפשרית ולמשמחת.", image: topicPlayingTogether, ageRange: "3-8", keywords: ["שיתוף פעולה", "קבוצה", "צוות", "carol gray"] },
      { id: "patience-edu", label: "⏳ סבלנות – לחכות בשקט ובשלווה", description: "מדריך חברתי מובנה (Carol Gray): יש רגעים שצריך לחכות – לתורנו, לתשובה, לסיום. נשימה עמוקה עוזרת לגוף ולמחשבות להירגע.", image: topicAngerCloud, ageRange: "3-8", keywords: ["סבלנות", "ויסות", "המתנה", "carol gray"] },
      { id: "politeness-edu", label: "🎩 נימוס – מילים שפותחות לבבות", description: "מדריך חברתי מובנה (Carol Gray): מילים כמו 'תודה' ו'בבקשה' הן לא רק כללים – הן הדרך שבה מראים לאחרים שרואים אותם ומכבדים אותם.", image: topicSharing, ageRange: "3-8", keywords: ["אדיבות", "נימוס", "דרך ארץ", "carol gray"] },
      { id: "respecting-elders-edu", label: "👴 כבוד למבוגרים – להקשיב וללמוד", description: "מדריך חברתי מובנה (Carol Gray): להקשיב כשמדברים אליך, לחכות לתורך ולהגיד תודה – אלה דרכים שמראות כבוד ועושות טוב לכולם.", image: topicGrandparentsNight, ageRange: "3-8", keywords: ["כבוד", "מבוגרים", "דרך ארץ", "carol gray"] },
      { id: "eating-with-cutlery-edu", label: "🍴 לאכול עם סכו״ם – הכלים המבריקים שלי", description: "מדריך חברתי מובנה (Carol Gray): כשאני אוכל/ת עם כף ומזלג, הידיים שלי נשארות נקיות והאוכל מגיע בדיוק לפה. זה מרגיש גדול ומיוחד!", image: topicBraveTaster, ageRange: "2-6", keywords: ["אכילה", "סכום", "כלי אוכל", "עצמאות", "carol gray"] },
    ],
  },
];