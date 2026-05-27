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
import topicFirstDaySchool from "@/assets/topic-first-day-school.jpg";
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
import topicLearningPackage from "@/assets/topic-learning-package.jpeg";
const topicDinosaurs = `${TOPIC_IMAGES_BASE}/topic-dinosaurs.png`;
const topicCardboardHouse = `${TOPIC_IMAGES_BASE}/topic-cardboard-house.png`;
const topicCandyAlive = `${TOPIC_IMAGES_BASE}/topic-candy-alive.png`;
const topicTalkingToys = `${TOPIC_IMAGES_BASE}/topic-talking-toys.png`;
const topicFarmAnimals = `${TOPIC_IMAGES_BASE}/topic-farm-animals.png`;
const topicUnicorn = `${TOPIC_IMAGES_BASE}/topic-unicorn.png`;
import topicSafeRoom from "@/assets/topic-safe-room.png";
import topicDadInReserves from "@/assets/topic-dad-in-reserves.jpg";
import topicShabbat from "@/assets/topic-shabbat.jpg";
import topicPets from "@/assets/topic-pets.jpg";
import topicCooking from "@/assets/topic-cooking.jpg";
import topicJoy from "@/assets/topic-joy.jpg";
import topicTorahHero from "@/assets/topic-torah-hero.png";
const topicMosesBasket = `${TOPIC_IMAGES_BASE}/topic-moses-basket.png`;
const topicExodus = `${TOPIC_IMAGES_BASE}/topic-exodus.png`;
const topicNoahArk = `${TOPIC_IMAGES_BASE}/topic-noah-ark.png`;
const topicJosephBrothers = `${TOPIC_IMAGES_BASE}/topic-joseph-brothers.png`;
const topicDavidGoliath = `${TOPIC_IMAGES_BASE}/topic-david-goliath.png`;
const topicAbrahamSarah = `${TOPIC_IMAGES_BASE}/topic-abraham-sarah.png`;
const topicJonahFish = `${TOPIC_IMAGES_BASE}/topic-jonah-fish.png`;
const topicSamson = `${TOPIC_IMAGES_BASE}/topic-samson.png`;
const topicEsther = `${TOPIC_IMAGES_BASE}/topic-esther.png`;
const topicHanukkah = `${TOPIC_IMAGES_BASE}/topic-hanukkah-miracle.png`;
// Topics using storage bucket images (Pixar 3D style generated via Gemini)
const topicFindAFriend = `${TOPIC_IMAGES_BASE}/topic-find-a-friend.png`;
const topicScreenTime = `${TOPIC_IMAGES_BASE}/topic-screen-time.png`;
const topicDivorce = `${TOPIC_IMAGES_BASE}/topic-divorce.png`;
const topicSickGrandparent = `${TOPIC_IMAGES_BASE}/topic-sick-grandparent.png`;
const topicMakingMistakes = `${TOPIC_IMAGES_BASE}/topic-making-mistakes.png`;
const topicCryingIsOk = `${TOPIC_IMAGES_BASE}/topic-crying-is-ok.png`;
const topicCloudKingdom = `${TOPIC_IMAGES_BASE}/topic-cloud-kingdom.png`;
const topicDragonParty = `${TOPIC_IMAGES_BASE}/topic-dragon-party.png`;
const topicStrangeInventions = `${TOPIC_IMAGES_BASE}/topic-strange-inventions.png`;
const topicSpaceJourney = `${TOPIC_IMAGES_BASE}/topic-space-journey.png`;
const topicFriendshipCourage = `${TOPIC_IMAGES_BASE}/topic-friendship-courage.png`;
const topicAcceptingDifferences = `${TOPIC_IMAGES_BASE}/topic-accepting-differences.png`;
const topicHowBodyWorks = `${TOPIC_IMAGES_BASE}/topic-how-body-works.png`;
const topicWaitingInLine = `${TOPIC_IMAGES_BASE}/topic-waiting-in-line.png`;
const topicPoliteness = `${TOPIC_IMAGES_BASE}/topic-politeness.png`;
const topicEmotionRegulation = `${TOPIC_IMAGES_BASE}/topic-emotion-regulation.png`;
const topicPatience = `${TOPIC_IMAGES_BASE}/topic-patience.png`;
const topicPlayRules = `${TOPIC_IMAGES_BASE}/topic-play-rules.png`;
const topicSelfConfidence = `${TOPIC_IMAGES_BASE}/topic-self-confidence.png`;
const topicNatureSecrets = `${TOPIC_IMAGES_BASE}/topic-nature-secrets.png`;
const topicHolidaysSeasons = `${TOPIC_IMAGES_BASE}/topic-holidays-seasons.png`;

const letterImage = (letter: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" style="background:${color}"><text x="50%" y="55%" font-size="200" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`)}`;

const colorImage = (name: string, baseColor: string, lightColor: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${baseColor}"/><stop offset="100%" stop-color="${lightColor}"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="12" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="400" height="400" fill="url(#bg)"/><ellipse cx="200" cy="175" rx="110" ry="95" fill="${lightColor}" opacity="0.45" filter="url(#glow)"/><text x="50%" y="82%" font-size="48" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${name}</text></svg>`)}`;

const shapeImage = (name: string, gradFrom: string, gradTo: string, shapeSvg: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${gradFrom}"/><stop offset="100%" stop-color="${gradTo}"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="10" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="400" height="400" fill="url(#bg)"/>${shapeSvg}<text x="50%" y="82%" font-size="48" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${name}</text></svg>`)}`;


export interface TopicItem {
  id: string;
  label: string;
  description: string;
  image: string;
  ageRange: string;
  keywords?: string[];
  featured?: boolean;
  subCategory?: string;
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
      { id: "accepting-differences", label: "קבלת השונה", description: "סיפור על פגישה עם מישהו שנראה שונה לגמרי – ועל הגילוי הגדול שמתחת לשטח, לבבות כל-כך דומים.", image: topicAcceptingDifferences, ageRange: "4-8", keywords: ["שונות", "קבלה", "הכלה", "אחרות"] },
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
      { id: "friendship-courage", label: "חברים בגן", description: "סיפור על חברות אמיתית: איך מתחילים לדבר עם ילד חדש, מה עושים כשיש ריב ואיך מתפייסים.", image: topicFriendshipCourage, ageRange: "3-6" },
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
      { id: "find-a-friend", label: "הלב שלי רוצה חבר 💛", description: "סיפור עדין ומעצים על ילד שמרגיש שהחברים לא כוללים אותו במשחק. הוא לומד להביע את רגשותיו, מוצא אומץ לפנות לילד אחר שגם הוא לבד, ויחד הם מגלים שחברות אמיתית מתחילה בחיוך קטן. הסיפור מותאם לגיל הרך, עוסק בחרמות בעדינות ובאופן חיובי — ללא אשמה, עם תקווה ופתרון שמח. המסר: כולם ראויים לחברות, ותמיד אפשר להתחיל מחדש.", image: topicFindAFriend, ageRange: "3-6", keywords: ["חברות", "בדידות", "חרמות", "רגשות", "אומץ", "חבר"] },
      { id: "screen-time", label: "המסך מחכה 📱", description: "סיפור קליל ומשעשע על ילד שמאוד אוהב את המסך שלו, ומגלה שכשהוא מניח אותו בצד — מחכות לו הרפתקאות, חברים ורגעים שאף מסך לא יכול לתת. המסר: המסך לא הולך לשום מקום, אבל הרגעים האמיתיים — כן.", image: topicScreenTime, ageRange: "3-6", keywords: ["מסכים", "טלוויזיה", "טאבלט", "משחק בחוץ", "זמן מסך"] },
      { id: "divorce", label: "שני בתים, אהבה אחת 🏠🏠", description: "סיפור רגיש ומחבק על ילד שיש לו שני בתים. הוא מרגיש לפעמים עצוב ומבולבל, אבל לומד שאהבת ההורים לא השתנתה ולא תשתנה לעולם. המסר: זה לא בגללך, ואתה אהוב בשני הבתים.", image: topicDivorce, ageRange: "3-8", keywords: ["גירושין", "פרידה", "שני בתים", "הורים", "אהבה"] },
      { id: "sick-grandparent", label: "סבא/סבתא חולה — ואני כאן 💛", description: "סיפור עדין ומלא אהבה על ילד שסבא או סבתא שלו חלה. הוא מרגיש פחד ועצב אבל לומד שנוכחות, חיבוק וציור קטן יכולים לתת כוח עצום. המסר: אהבה היא התרופה הכי חזקה.", image: topicSickGrandparent, ageRange: "3-8", keywords: ["סבא", "סבתא", "מחלה", "אהבה", "נוכחות", "עצב"] },
      { id: "making-mistakes", label: "טעיתי — ומה עכשיו? 🌱", description: "סיפור מעצים על ילד שעשה טעות (שבר משהו, פגע בחבר, שיקר קצת) ומרגיש בושה וצער. הוא לומד לקחת אחריות, להתנצל ולהמשיך קדימה. המסר: כולם טועים — הגיבורים הם אלה שקמים.", image: topicMakingMistakes, ageRange: "3-6", keywords: ["טעויות", "אחריות", "התנצלות", "צמיחה", "בושה"] },
      { id: "crying-is-ok", label: "מותר לבכות 🌧️🌈", description: "סיפור חם ומחבק על ילד שמחזיק את הרגשות בפנים כי חושב שבכי זה לחלשים. הוא מגלה שגם גיבורים בוכים, וששחרור הרגשות עושה אותו חזק יותר. המסר: הלב שלך חכם — תקשיב לו.", image: topicCryingIsOk, ageRange: "3-6", keywords: ["בכי", "רגשות", "אומץ", "שחרור", "חוזק"] },
      { id: "safe-room-sirens", label: "* שהייה בממ\"ד ואזעקות", description: "סיפור מרגיע ומחזק על הרגעים בממ\"ד: איך נשארים רגועים כשנשמעת אזעקה, מה עושים יחד כמשפחה ולמה הממ\"ד הוא המקום הכי בטוח. סיפור שעוזר לילדים להרגיש מוגנים, אהובים ובטוחים.", image: topicSafeRoom, ageRange: "0-8", keywords: ["ממד", "אזעקה", "מלחמה", "פחד", "בטחון", "מקלט", "צבע אדום", "סירנה", "מוגנות", "רגיעה"], featured: true },
      { id: "dad-in-reserves", label: "* אבא במילואים", description: "סיפור מחזק ומחבק על ילד/ה שאבא שלו/ה יוצא למילואים. הסיפור עוזר לעבד את הגעגוע, ומזכיר שאבא תמיד חוזר הביתה — ושהאהבה לא נעלמת גם כשהוא רחוק.", image: topicDadInReserves, ageRange: "0-8", keywords: ["מילואים", "אבא", "צבא", "געגוע", "גבורה", "חוסן", "פרידה", "משפחה"], featured: true },
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
      { id: "cloud-kingdom", label: "ממלכת העננים", description: "הרפתקה מעל הכל: מסע אל ממלכה שבנויה לגמרי מעננים, שם חיים יצורים עשויי אוויר וקלים כנוצה.", image: topicCloudKingdom, ageRange: "3-6", keywords: ["עננים", "ממלכה", "קסם", "שמיים"] },
      { id: "dragon-party", label: "מסיבת הדרקונים", description: "הזמנה בלתי-צפויה למסיבה של דרקונים ידידותיים: ריקודים, אש בצבעי קשת ושיר שמח שמדהים את כל היער.", image: topicDragonParty, ageRange: "3-8", keywords: ["דרקון", "מסיבה", "קסם", "ידידות"] },
      { id: "strange-inventions", label: "המצאות משונות", description: "ילד/ה עם דמיון פורה מחליט/ה להמציא את הדבר הכי מוזר שנראה אי-פעם – ומגלה שהמצאות הגדולות ביותר מתחילות בחיוך.", image: topicStrangeInventions, ageRange: "4-8", keywords: ["המצאות", "יצירתיות", "מדע", "פיתוח"] },
      { id: "dinosaurs", label: "🦕 דינוזאורים", description: "הרפתקה בעולם הדינוזאורים: לפגוש דינוזאורים ענקיים וידידותיים, לטוס עם טרודקטיל ולגלות סודות מהעבר הרחוק.", image: topicDinosaurs, ageRange: "3-8", keywords: ["דינוזאורים", "פרהיסטורי", "הרפתקה", "חיות"] },
      { id: "cardboard-house", label: "📦 בית מקרטון", description: "קופסת קרטון פשוטה שהופכת לטירה, ספינה או רקטה – הכל תלוי בדמיון!", image: topicCardboardHouse, ageRange: "3-6", keywords: ["קרטון", "דמיון", "יצירתיות", "משחק", "בית"] },
      { id: "candy-alive", label: "🍭 ממתקים שקמו לחיים", description: "מה קורה כשממתקים מתעוררים לחיים? סוכריות רוקדות, שוקולד שר ודובוני גומי יוצאים להרפתקה מתוקה ומפתיעה.", image: topicCandyAlive, ageRange: "3-6", keywords: ["ממתקים", "סוכריות", "דמיון", "קסם", "מתוק"] },
      { id: "talking-toys", label: "🧸 צעצועים שמדברים", description: "מה קורה בחדר כשכולם ישנים? הצעצועים מתעוררים! דובי, רובוט ובובה יוצאים יחד להרפתקה לילית מלאת הפתעות.", image: topicTalkingToys, ageRange: "3-6", keywords: ["צעצועים", "דובי", "דמיון", "לילה", "הרפתקה"] },
      { id: "farm-animals", label: "🐄 חיות משק", description: "הרפתקה בחווה: לפגוש פרות, תרנגולות, כבשים וחזירונים חמודים ולגלות מאיפה מגיעים חלב, ביצים וצמר.", image: topicFarmAnimals, ageRange: "3-6", keywords: ["חווה", "פרה", "תרנגולת", "חיות", "משק", "כבשה"] },
      { id: "unicorn", label: "🦄 חד קרן", description: "מסע קסום עם חד קרן נוצץ: לדהור בשדות פרחים, לעוף מעל קשת בענן ולגלות שהקסם האמיתי נמצא בתוכנו.", image: topicUnicorn, ageRange: "3-8", keywords: ["חד קרן", "קסם", "קשת", "פנטזיה", "יוניקורן"] },
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
      { id: "space-journey", label: "מסע בחלל", description: "הרפתקה בין כוכבי הלכת: לגלות שבכל כוכב יש סוד משלו, שהיקום גדול אין-סוף וכדור הארץ שלנו הוא הפלא הכי גדול.", image: topicSpaceJourney, ageRange: "4-8", keywords: ["חלל", "כוכבים", "כוכבי לכת", "מדע", "אסטרונאוט"] },
      { id: "nature-secrets", label: "סודות הטבע", description: "טיול בין העצים, האבנים והיצורים הקטנים: הטבע מלא סודות שמחכים לילד/ה סקרן/ית שיפקח/תפקח עיניים וישמע/תשמע.", image: topicNatureSecrets, ageRange: "3-8", keywords: ["טבע", "עצים", "חרקים", "גילוי", "מדע"] },
      { id: "how-body-works", label: "איך הגוף שלנו עובד", description: "מסע פנימה: לגלות שהגוף הוא מכונה מדהימה שעובדת בשבילנו כל הזמן – הלב מציב, הריאות נושמות והמוח חולם.", image: topicHowBodyWorks, ageRange: "4-8", keywords: ["גוף", "בריאות", "מדע", "לב", "מוח"] },
      { id: "shabbat", label: "שבת שלום!", description: "סיפור חם ומשפחתי על ערב שבת: הדלקת נרות, חלה טרייה, קידוש ושירים — הרגעים הכי יפים של השבוע כשכל המשפחה יחד.", image: topicShabbat, ageRange: "3-8", keywords: ["שבת", "נרות", "חלה", "משפחה", "קידוש", "מסורת"] },
      { id: "pets", label: "החיה שלי ואני", description: "סיפור מרגש על הקשר המיוחד בין ילד/ה לחיית המחמד: אהבה, אחריות וטיפול — ועל החברות הכי נאמנה שיש.", image: topicPets, ageRange: "3-8", keywords: ["חיות", "כלב", "חתול", "חיית מחמד", "אחריות", "אהבה"] },
      { id: "cooking", label: "שף קטן במטבח", description: "סיפור משעשע על בישול ואפייה: ערבוב, טעימות, קמח על האף — ולגלות שהמנה הכי טעימה נעשית עם אהבה.", image: topicCooking, ageRange: "3-6", keywords: ["בישול", "אפייה", "מטבח", "אוכל", "שף"] },
      { id: "joy", label: "כמה כיף לשמוח!", description: "סיפור צבעוני ושמח על רגעי השמחה הקטנים שמסביבנו: חיוך של חבר, פרפר שעף, שירה בקול רם — ולגלות ששמחה נמצאת בכל מקום.", image: topicJoy, ageRange: "3-6", keywords: ["שמחה", "אושר", "חיוך", "אופטימיות", "רגשות"] },
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
      { id: "waiting-in-line-edu", label: "⏰ המתנה בתור – מתי מגיע תורי?", description: "סיפור העצמה חברתי: למה חשוב לחכות, איך עושים את זה ומה מרוויחים כשממתינים בסבלנות.", image: topicWaitingInLine, ageRange: "3-6" },
      { id: "emotion-regulation-edu", label: "🌊 ויסות רגשות – לנשום ולהירגע", description: "סיפור העצמה חברתי: כלים מעשיים לזהות את הרגש, לנשום ולמצוא דרך בריאה לבטא כעס ותסכול.", image: topicEmotionRegulation, ageRange: "3-8" },
      { id: "holidays-seasons-edu", label: "🗓️ מעגל השנה – חגים ועונות", description: "סיפור העצמה חברתי: סיפורים על מעגל השנה, חגים, עונות, מסורות ומנהגים שמלווים אותנו.", image: topicHolidaysSeasons, ageRange: "3-8" },
      { id: "play-rules-edu", label: "🎲 כללי משחק – לשחק בהוגנות", description: "סיפור העצמה חברתי: לחכות לתור, לא לרמות, לשמוח בהצלחה של חברים ולקבל הפסד בכבוד.", image: topicPlayRules, ageRange: "3-6" },
      { id: "self-confidence-edu", label: "💪 ביטחון עצמי – אני יכול/ה!", description: "סיפור העצמה חברתי: להאמין בעצמי, לנסות דברים חדשים ולדעת שאני מסוגל/ת.", image: topicSelfConfidence, ageRange: "3-8" },
      { id: "honesty-edu", label: "🪄 כנות – לומר את האמת בעדינות", description: "סיפור העצמה חברתי: ילדים רבים מרגישים שקשה לומר את האמת. כשהאמת נאמרת בעדינות, היחסים נשארים חזקים והלב קל.", image: topicApologize, ageRange: "3-8", keywords: ["אמת", "כנות", "מיומנות חברתית"] },
      { id: "cooperation-edu", label: "🤝 עבודת צוות – ביחד אנחנו חזקים", description: "סיפור העצמה חברתי: בכיתה או בגן, כשכל אחד תורם את חלקו, המשימה הגדולה הופכת לאפשרית ולמשמחת.", image: topicPlayingTogether, ageRange: "3-8", keywords: ["שיתוף פעולה", "קבוצה", "צוות"] },
      { id: "patience-edu", label: "⏳ סבלנות – לחכות בשקט ובשלווה", description: "סיפור העצמה חברתי: יש רגעים שצריך לחכות – לתורנו, לתשובה, לסיום. נשימה עמוקה עוזרת לגוף ולמחשבות להירגע.", image: topicPatience, ageRange: "3-8", keywords: ["סבלנות", "ויסות", "המתנה"] },
      { id: "politeness-edu", label: "🎩 נימוס – מילים שפותחות לבבות", description: "סיפור העצמה חברתי: מילים כמו 'תודה' ו'בבקשה' הן לא רק כללים – הן הדרך שבה מראים לאחרים שרואים אותם ומכבדים אותם.", image: topicPoliteness, ageRange: "3-8", keywords: ["אדיבות", "נימוס", "דרך ארץ"] },
      { id: "respecting-elders-edu", label: "👴 כבוד למבוגרים – להקשיב וללמוד", description: "סיפור העצמה חברתי: להקשיב כשמדברים אליך, לחכות לתורך ולהגיד תודה – אלה דרכים שמראות כבוד ועושות טוב לכולם.", image: topicGrandparentsNight, ageRange: "3-8", keywords: ["כבוד", "מבוגרים", "דרך ארץ"] },
      { id: "eating-with-cutlery-edu", label: "🍴 לאכול עם סכו״ם – הכלים המבריקים שלי", description: "סיפור העצמה חברתי: כשאני אוכל/ת עם כף ומזלג, הידיים שלי נשארות נקיות והאוכל מגיע בדיוק לפה. זה מרגיש גדול ומיוחד!", image: "https://qvdwmkxviaqcgmjotsxe.supabase.co/storage/v1/object/public/topic-images/topic-eating-with-cutlery.png", ageRange: "2-6", keywords: ["אכילה", "סכום", "כלי אוכל", "עצמאות"] },
      { id: "rainbow-power-edu", label: "🌈 כוח הקשת – פירות וירקות קסומים", description: "סיפור העצמה חברתי: כל פרי וירק הוא כוח-על מיוחד! הצבעים של הקשת מחכים בצלחת – אדום נותן אנרגיה, כתום מחזק את העיניים וירוק בונה שרירים חזקים.", image: topicBraveTaster, ageRange: "0-8", keywords: ["פירות", "ירקות", "אכילה בריאה", "צבעים", "תזונה", "כוח על"] },
    ],
  },
  {
    id: "biblical",
    character: "",
    characterEn: "",
    categoryLabel: "סיפורים תנ״כיים",
    categoryEmoji: "✡️",
    heroImage: topicTorahHero,
    topics: [
      { id: "moses-basket", label: "✡️ משה בתיבה", description: "סיפור חם ומרגש על תינוק קטן שנשמר באהבה בתיבה על הנהר — ועל הנס הגדול שחיכה לו.", image: topicMosesBasket, ageRange: "2-8", keywords: ["משה", "תיבה", "נהר", "נס", "תורה"] },
      { id: "exodus", label: "✡️ יציאת מצרים", description: "סיפור מרגש על חירות ואומץ: יחד עם משה, הילד/ה חווה את הנס הגדול של יציאת מצרים ומעבר הים.", image: topicExodus, ageRange: "3-8", keywords: ["יציאת מצרים", "פסח", "חירות", "ים סוף", "תורה"] },
      { id: "noah-ark", label: "✡️ נח ותיבת נח", description: "סיפור על נח שבנה תיבה גדולה והציל את כל החיות — ועל הקשת בענן שהבטיחה שהכל יהיה בסדר.", image: topicNoahArk, ageRange: "2-8", keywords: ["נח", "תיבה", "חיות", "קשת", "מבול", "תורה"] },
      { id: "joseph-brothers", label: "✡️ יוסף ואחיו", description: "סיפור על ילד עם כתונת צבעונית שחלם חלומות גדולים — ועל סליחה, אהבה ומשפחה שמתאחדת.", image: topicJosephBrothers, ageRange: "3-8", keywords: ["יוסף", "כתונת פסים", "חלומות", "אחים", "סליחה", "תורה"] },
      { id: "david-goliath", label: "✡️ דוד וגוליית", description: "סיפור על ילד רועה אמיץ שהוכיח שגם הקטן ביותר יכול לעשות דברים גדולים — בעזרת אמונה ואומץ.", image: topicDavidGoliath, ageRange: "3-8", keywords: ["דוד", "גוליית", "אומץ", "אמונה", "תורה"] },
      { id: "abraham-sarah", label: "✡️ אברהם ושרה", description: "סיפור על זוג אוהב שיצא למסע גדול, פתח את האוהל לכל עובר ושב, ולמד שהכנסת אורחים היא הדבר הכי יפה.", image: topicAbrahamSarah, ageRange: "3-8", keywords: ["אברהם", "שרה", "הכנסת אורחים", "חסד", "תורה"] },
      { id: "jonah-fish", label: "✡️ יונה והדג הגדול", description: "סיפור מופלא על יונה שנבלע בבטן דג ענק — ושם גילה שתמיד אפשר לחזור, להתחיל מחדש ולעשות את הדבר הנכון.", image: topicJonahFish, ageRange: "3-8", keywords: ["יונה", "דג", "ים", "תשובה", "תורה"] },
      { id: "samson-hero", label: "✡️ שמשון הגיבור", description: "סיפור על גיבור חזק במיוחד שקיבל כוח מיוחד — ושלמד שכוח אמיתי הוא להגן על אחרים באהבה.", image: topicSamson, ageRange: "4-8", keywords: ["שמשון", "כוח", "גיבור", "תורה"] },
      { id: "esther-queen", label: "✡️ אסתר המלכה", description: "סיפור על מלכה אמיצה שהצילה את עמה — ושהוכיחה שגם בת קטנה יכולה לשנות את העולם.", image: topicEsther, ageRange: "3-8", keywords: ["אסתר", "פורים", "אומץ", "מלכה", "תורה"] },
      { id: "hanukkah-miracle", label: "✡️ חנוכה — נס פך השמן", description: "סיפור קסום על פך שמן קטן שהספיק לשמונה ימים — ועל האור שמנצח את החושך.", image: topicHanukkah, ageRange: "2-8", keywords: ["חנוכה", "נרות", "שמן", "נס", "מנורה", "תורה"] },
    ],
  },
  {
    id: "learning",
    character: "",
    characterEn: "",
    categoryLabel: "ספריית הלימוד",
    categoryEmoji: "🎓",
    heroImage: topicLearningPackage,
    topics: [
      { id: "letter-alef", label: "אות א׳ – אריה האמיץ", description: "סיפור על הילד/ה שפוגש/ת את אות א׳ בדמות אריה אמיץ — המילים 'אריה', 'אמא' ו'אוכל' מלוות את כל ההרפתקה.", image: letterImage("א", "#8B5CF6"), ageRange: "3-6", keywords: ["אות א", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-bet", label: "אות ב׳ – הבית הקסום", description: "סיפור על הילד/ה שמגלה בית קסום עם בלונים, בובות ובעלי חיים — והאות ב׳ מופיעה בכל פינה.", image: letterImage("ב", "#EC4899"), ageRange: "3-6", keywords: ["אות ב", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-gimel", label: "אות ג׳ – גינת הפלאות", description: "הרפתקה בגינה קסומה עם גמד, גזר וגשם של כוכבים — כשהאות ג׳ נפגשת עם הילד/ה בכל שלב.", image: letterImage("ג", "#F59E0B"), ageRange: "3-6", keywords: ["אות ג", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-dalet", label: "אות ד׳ – הדלת הסודית", description: "סיפור על דלת סודית שמאחוריה מחכים דברים מדהימים — דובדבנים, דגים ודמיון.", image: letterImage("ד", "#14B8A6"), ageRange: "3-6", keywords: ["אות ד", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-he", label: "אות ה׳ – ההרפתקה בהר", description: "הילד/ה מטפס/ת על הר גבוה ופוגש/ת היפופוטם, הגיע הזמן להכיר את האות ה׳.", image: letterImage("ה", "#F97316"), ageRange: "3-6", keywords: ["אות ה", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-vav", label: "אות ו׳ – הוורד הוורוד", description: "סיפור על גינה של ורדים ורודים, וילונות וותיקים — והאות ו׳ שמחברת את הכל.", image: letterImage("ו", "#3B82F6"), ageRange: "3-6", keywords: ["אות ו", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-zayin", label: "אות ז׳ – הזיקית הזריזה", description: "הרפתקה עם זיקית שמשנה צבעים, זברה זזה וזיקוקים — כולם מתחילים באות ז׳.", image: letterImage("ז", "#22C55E"), ageRange: "3-6", keywords: ["אות ז", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-chet", label: "אות ח׳ – החתול החמוד", description: "סיפור על חתול חמוד שאוהב חלב, חלומות וחברים — והאות ח׳ מלווה אותו בכל מקום.", image: letterImage("ח", "#EF4444"), ageRange: "3-6", keywords: ["אות ח", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-tet", label: "אות ט׳ – הטיול הטעים", description: "הילד/ה יוצא/ת לטיול וטועם/ת טעמים חדשים — תפוחים, תותים וטירמיסו עם האות ט׳.", image: letterImage("ט", "#8B5CF6"), ageRange: "3-6", keywords: ["אות ט", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-yod", label: "אות י׳ – הילד/ה היצירתי/ת", description: "סיפור על ילד/ה שמכיר/ה את האות י׳ — יער, ירח, ים ויצירה.", image: letterImage("י", "#EC4899"), ageRange: "3-6", keywords: ["אות י", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-kaf", label: "אות כ׳ – הכוכב הכחול", description: "הרפתקה בחלל עם כוכב כחול, כדור ארץ וכנפיים — האות כ׳ מאירה את הדרך.", image: letterImage("כ", "#F59E0B"), ageRange: "3-6", keywords: ["אות כ", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-lamed", label: "אות ל׳ – הלב הלוהט", description: "סיפור על לב גדול שמלא באהבה, לבבות ולחישות — כולם עם האות ל׳.", image: letterImage("ל", "#14B8A6"), ageRange: "3-6", keywords: ["אות ל", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-mem", label: "אות מ׳ – המלך המצחיק", description: "מלך מצחיק עם משקפיים, מטריה ומפתח — כל מילה מתחילה באות מ׳.", image: letterImage("מ", "#F97316"), ageRange: "3-6", keywords: ["אות מ", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-nun", label: "אות נ׳ – הנסיכה הנועזת", description: "נסיכה נועזת עם נר, נמלים ונהר — הרפתקה עם האות נ׳.", image: letterImage("נ", "#3B82F6"), ageRange: "3-6", keywords: ["אות נ", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-samekh", label: "אות ס׳ – הסוס הסוער", description: "סוס סוער דוהר בסערה, עובר ליד ספינה וסלעים — האות ס׳ בכל מקום.", image: letterImage("ס", "#22C55E"), ageRange: "3-6", keywords: ["אות ס", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-ayin", label: "אות ע׳ – העץ הענק", description: "עץ ענק עם ענפים, עלים ועוגיות — סיפור על האות ע׳ שגדלה עם הטבע.", image: letterImage("ע", "#EF4444"), ageRange: "3-6", keywords: ["אות ע", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-pe", label: "אות פ׳ – הפרפר הפלאי", description: "פרפר פלאי עם פרחים, פיל ופנס — הכל מתחיל באות פ׳.", image: letterImage("פ", "#8B5CF6"), ageRange: "3-6", keywords: ["אות פ", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-tsadi", label: "אות צ׳ – הצב הצבעוני", description: "צב צבעוני צועד לאט ופוגש ציפור, צדפים וצעצועים — כולם עם אות צ׳.", image: letterImage("צ", "#EC4899"), ageRange: "3-6", keywords: ["אות צ", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-qof", label: "אות ק׳ – הקוף הקטן", description: "קוף קטן וקסום שאוהב קרקס, קשת וקליפות — הרפתקה עם האות ק׳.", image: letterImage("ק", "#F59E0B"), ageRange: "3-6", keywords: ["אות ק", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-resh", label: "אות ר׳ – הרכבת הרועשת", description: "רכבת רועשת עוברת ליד רחוב, רימונים ורוח — האות ר׳ נוסעת איתנו.", image: letterImage("ר", "#14B8A6"), ageRange: "3-6", keywords: ["אות ר", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-shin", label: "אות ש׳ – השמש השמחה", description: "שמש שמחה מחייכת, שלג שקט ושירים — סיפור חם על האות ש׳.", image: letterImage("ש", "#F97316"), ageRange: "3-6", keywords: ["אות ש", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "letter-tav", label: "אות ת׳ – התרנגול התקתק", description: "תרנגול מתקתק עם תוף, תפוח ותמונה — סיום מושלם לאלף-בית עם אות ת׳.", image: letterImage("ת", "#3B82F6"), ageRange: "3-6", keywords: ["אות ת", "אלף בית", "למידה"], subCategory: "🔤 אותיות" },
      { id: "number-1", label: "מספר 1 – גיבור יחיד ומיוחד", description: "סיפור על הילד/ה שפוגש/ת את מספר 1 — כוכב אחד, כלב אחד, חיוך אחד גדול. כי אחד יכול לשנות הכל.", image: topicSpaceHero, ageRange: "3-6", keywords: ["מספר 1", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "number-2", label: "מספר 2 – שני חברים", description: "סיפור חם על שני חברים שעושים כל דבר יחד — 2 נעליים, 2 ידיים, 2 לבבות.", image: topicFriendship, ageRange: "3-6", keywords: ["מספר 2", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "number-3", label: "מספר 3 – שלושת הדובים", description: "הרפתקה עם שלושה דובים חמודים: 3 קערות, 3 כסאות, 3 מיטות — ומספר 3 שמלווה את כל הדרך.", image: topicMagicalForest, ageRange: "3-6", keywords: ["מספר 3", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "number-4", label: "מספר 4 – ארבע עונות השנה", description: "סיפור צבעוני על 4 עונות — חורף, אביב, קיץ וסתיו. בכל עונה 4 הפתעות מחכות!", image: topicNatureSecrets, ageRange: "3-6", keywords: ["מספר 4", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "number-5", label: "מספר 5 – חמש אצבעות קסומות", description: "5 אצבעות ביד אחת — כל אצבע יוצאת להרפתקה משלה. ביחד הן יכולות הכל!", image: topicSuperheroes, ageRange: "3-6", keywords: ["מספר 5", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "number-6", label: "מספר 6 – שישה חברים בגן", description: "6 ילדים משחקים בגן — 6 כובעים, 6 דליים בארגז החול, ו-6 חיוכים גדולים.", image: topicFriendship, ageRange: "3-6", keywords: ["מספר 6", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "number-7", label: "מספר 7 – שבעת צבעי הקשת", description: "הרפתקה בעקבות קשת בענן — 7 צבעים מובילים ל-7 עולמות קסומים.", image: topicCloudAdventure, ageRange: "3-6", keywords: ["מספר 7", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "number-8", label: "מספר 8 – שמונה רגליים של תמנון", description: "תמנון חמוד עם 8 רגליים — כל רגל עושה משהו אחר: אחת מציירת, אחת מנגנת, אחת מחבקת!", image: topicUnderwater, ageRange: "3-6", keywords: ["מספר 8", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "number-9", label: "מספר 9 – תשע כוכבים בשמיים", description: "9 כוכבים זוהרים בלילה — כל כוכב מספר סוד קטן. מי ימצא את הכוכב התשיעי?", image: topicSpaceHero, ageRange: "3-6", keywords: ["מספר 9", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "number-10", label: "מספר 10 – עשר בלונים צבעוניים", description: "10 בלונים עפים לשמיים — נספור אותם ביחד! סיפור שמחה על המספר העגול הראשון.", image: topicBirthday, ageRange: "3-6", keywords: ["מספר 10", "ספירה", "למידה"], subCategory: "🔢 מספרים" },
      { id: "color-red", label: "צבע אדום", description: "אדום – צבע הלב, התפוח והאהבה. סיפור על הצבע האדום ועל כל הדברים היפים שהוא צובע.", image: colorImage("אדום", "#DC2626", "#F87171"), ageRange: "3-6", keywords: ["צבע אדום", "צבעים", "למידה"], subCategory: "🎨 צבעים" },
      { id: "color-blue", label: "צבע כחול", description: "כחול – צבע השמיים והים. סיפור על הצבע הכחול ועל הרגשת הרוגע והפלא שהוא מביא.", image: colorImage("כחול", "#2563EB", "#60A5FA"), ageRange: "3-6", keywords: ["צבע כחול", "צבעים", "למידה"], subCategory: "🎨 צבעים" },
      { id: "color-yellow", label: "צבע צהוב", description: "צהוב – צבע השמש והבננה. סיפור על הצבע הצהוב ועל האושר והחום שהוא מביא.", image: colorImage("צהוב", "#CA8A04", "#FDE047"), ageRange: "3-6", keywords: ["צבע צהוב", "צבעים", "למידה"], subCategory: "🎨 צבעים" },
      { id: "color-green", label: "צבע ירוק", description: "ירוק – צבע העשב והעץ. סיפור על הצבע הירוק ועל הטבע החי שסביבנו.", image: colorImage("ירוק", "#16A34A", "#4ADE80"), ageRange: "3-6", keywords: ["צבע ירוק", "צבעים", "למידה"], subCategory: "🎨 צבעים" },
      { id: "color-orange", label: "צבע כתום", description: "כתום – צבע הגזר והשקיעה. סיפור על הצבע הכתום ועל החיות והשמחה שבו.", image: colorImage("כתום", "#EA580C", "#FB923C"), ageRange: "3-6", keywords: ["צבע כתום", "צבעים", "למידה"], subCategory: "🎨 צבעים" },
      { id: "color-purple", label: "צבע סגול", description: "סגול – צבע הענבים והפרחים. סיפור על הצבע הסגול ועל הקסם שבו.", image: colorImage("סגול", "#7C3AED", "#A78BFA"), ageRange: "3-6", keywords: ["צבע סגול", "צבעים", "למידה"], subCategory: "🎨 צבעים" },
      { id: "color-pink", label: "צבע ורוד", description: "ורוד – צבע הפלמינגו והממתקים. סיפור על הצבע הורוד ועל הרכות והחמימות שבו.", image: colorImage("ורוד", "#DB2777", "#F9A8D4"), ageRange: "3-6", keywords: ["צבע ורוד", "צבעים", "למידה"], subCategory: "🎨 צבעים" },
      { id: "color-white", label: "צבע לבן", description: "לבן – צבע הענן והשלג. סיפור על הצבע הלבן ועל הניקיון והשקט שהוא מביא.", image: colorImage("לבן", "#94A3B8", "#E2E8F0"), ageRange: "3-6", keywords: ["צבע לבן", "צבעים", "למידה"], subCategory: "🎨 צבעים" },
      { id: "color-black", label: "צבע שחור", description: "שחור – צבע הלילה והכוכבים. סיפור על הצבע השחור ועל הסודות היפים של החושך.", image: colorImage("שחור", "#1E293B", "#475569"), ageRange: "3-6", keywords: ["צבע שחור", "צבעים", "למידה"], subCategory: "🎨 צבעים" },
      { id: "shape-circle", label: "צורת עיגול", description: "עיגול – הצורה המושלמת. סיפור על העיגול ועל כל הדברים העגולים שסביבנו.", image: shapeImage("עיגול", "#7C3AED", "#3B82F6", '<circle cx="200" cy="175" r="80" fill="white" opacity="0.9" filter="url(#glow)"/>'), ageRange: "3-6", keywords: ["עיגול", "צורות", "למידה"], subCategory: "🔷 צורות" },
      { id: "shape-square", label: "צורת ריבוע", description: "ריבוע – ארבע צלעות שוות. סיפור על הריבוע ועל הדברים המרובעים בחיינו.", image: shapeImage("ריבוע", "#16A34A", "#14B8A6", '<rect x="130" y="105" width="140" height="140" fill="white" opacity="0.9" filter="url(#glow)"/>'), ageRange: "3-6", keywords: ["ריבוע", "צורות", "למידה"], subCategory: "🔷 צורות" },
      { id: "shape-triangle", label: "צורת משולש", description: "משולש – שלוש פינות חדות. סיפור על המשולש ועל כל מה שיש לו שלוש צלעות.", image: shapeImage("משולש", "#EA580C", "#F59E0B", '<polygon points="200,95 280,255 120,255" fill="white" opacity="0.9" filter="url(#glow)"/>'), ageRange: "3-6", keywords: ["משולש", "צורות", "למידה"], subCategory: "🔷 צורות" },
      { id: "shape-rectangle", label: "צורת מלבן", description: "מלבן – ארוך ורחב. סיפור על המלבן ועל הדברים המלבניים שפוגשים בכל מקום.", image: shapeImage("מלבן", "#DB2777", "#F43F5E", '<rect x="110" y="125" width="180" height="100" fill="white" opacity="0.9" filter="url(#glow)"/>'), ageRange: "3-6", keywords: ["מלבן", "צורות", "למידה"], subCategory: "🔷 צורות" },
      { id: "shape-heart", label: "צורת לב", description: "לב – סמל האהבה. סיפור על צורת הלב ועל כל האהבה שהיא מייצגת.", image: shapeImage("לב", "#DC2626", "#F9A8D4", '<path d="M200,260 C140,220 100,175 100,145 C100,115 125,95 155,95 C175,95 192,108 200,125 C208,108 225,95 245,95 C275,95 300,115 300,145 C300,175 260,220 200,260Z" fill="white" opacity="0.9" filter="url(#glow)"/>'), ageRange: "3-6", keywords: ["לב", "צורות", "למידה"], subCategory: "🔷 צורות" },
      { id: "shape-star", label: "צורת כוכב", description: "כוכב – הצורה של החלומות. סיפור על הכוכב ועל כל הקסם שבשמיים.", image: shapeImage("כוכב", "#D97706", "#FDE047", '<polygon points="200,95 218,155 280,155 228,195 248,255 200,218 152,255 172,195 120,155 182,155" fill="white" opacity="0.9" filter="url(#glow)"/>'), ageRange: "3-6", keywords: ["כוכב", "צורות", "למידה"], subCategory: "🔷 צורות" },
    ],
  },
];