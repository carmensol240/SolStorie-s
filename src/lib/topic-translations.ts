/**
 * Comprehensive Hebrew translation map for all topic IDs.
 * Built from topic-data.ts topic IDs → labels.
 */
const TOPIC_HEBREW_MAP: Record<string, string> = {
  // Sol - Heroes
  'superheroes': 'גיבורי על',
  'body-safety': 'בטיחות הגוף',
  'road-safety': 'בטיחות בדרכים',
  'environment': 'שמירה על הסביבה',
  'we-are-special': 'כולנו מיוחדים',
  'just-be-me': 'פשוט להיות אני',
  'helping-others': 'עזרה לאחרים',
  'stranger-danger': 'זהירות מזרים',
  'seatbelt-safety': 'חגורת בטיחות',
  'blood-test': 'בדיקת דם',
  'we-are-superheroes': 'כולנו גיבורי על',

  // Mia - Growing
  'body-hero-teeth': 'צחצוח שיניים קסום',
  'body-hero-bath': 'אמבטיה של כיף',
  'helping-at-home': 'עזרה בבית',
  'home-of-love': 'הבית של האהבה',
  'playing-together': 'משחקים יחד בגינה',
  'body-hero-hands': 'שטיפת ידיים',
  'potty-training': 'גמילה מחיתולים',
  'pacifier-fairy': 'פיית המוצץ',
  'first-day-kindergarten': 'יום ראשון בגן',
  'first-day-school': 'היום הראשון בכיתה א\'',
  'mom-dont-go': 'אמא אל תלכי',
  'fear-of-dark': 'פחד מהחושך',
  'friendship-courage': 'חברים בגן',
  'sharing': 'שיתוף',
  'apologize': 'להתנצל',
  'trying-again': 'לנסות שוב',
  'independence': 'עצמאות',
  'anger-cloud': 'ענן הכעס',
  'brave-taster': 'טועם אמיץ',
  'clean-room': 'סידור החדר',
  'new-house': 'בית חדש',
  'dentist-visit': 'ביקור אצל רופא השיניים',
  'barber-visit': 'ביקור אצל הספר',
  'lost-tooth': 'שן שנפלה',
  'body-hero-nails': 'גזירת ציפורניים',
  'new-sibling': 'אח/ות חדש/ה',
  'bedtime-story': 'סיפור לפני השינה',
  'pocket-kiss': 'נשיקה בכיס',
  'sibling-love': 'אהבת אחים',
  'my-special-family': 'המשפחה המיוחדת שלי',
  'find-a-friend': 'הלב שלי רוצה חבר',
  'screen-time': 'המסך מחכה',
  'divorce': 'שני בתים, אהבה אחת',
  'sick-grandparent': 'סבא/סבתא חולה — ואני כאן',
  'making-mistakes': 'טעיתי — ומה עכשיו?',
  'crying-is-ok': 'מותר לבכות',
  'dad-in-reserves': 'אבא במילואים',

  // Leo - Imagination
  'zoo-adventure': 'טיול בגן החיות',
  'cloud-adventure': 'הרפתקה בעננים',
  'magic-kingdom': 'ממלכת הקסם',
  'rain-party': 'מסיבה בגשם',
  'underwater': 'מתחת למים',
  'magical-forest': 'יער קסום',
  'space-adventure': 'הרפתקה בחלל',
  'magic-keys': 'מפתחות קסומים',

  // Zoe - Adventure
  'family-trip': 'טיול משפחתי',
  'birthday-party': 'מסיבת יום הולדת',
  'grandparents-night': 'לילה אצל סבא וסבתא',
  'flying-vacation': 'טיסה לחופשה',
  'shabbat': 'שבת שלום',
  'pets': 'החיה שלי ואני',
  'cooking': 'שף קטן במטבח',
  'joy': 'כמה כיף לשמוח',

  // Ben - Edu (legacy entries kept for backward compat, refined versions below)

  // Legacy/alternate IDs
  'teeth-brushing': 'צחצוח שיניים',
  'bedtime': 'שעת שינה',
  'friendship': 'חברות',
  'bath-shower': 'אמבטיה ומקלחת',
  'bathtime': 'זמן אמבטיה',
  'hand-washing': 'שטיפת ידיים',
  'nail-trimming': 'גזיזת ציפורניים',
  'birthday': 'יום הולדת',
  'pacifier': 'גמילה ממוצץ',
  'magic-castle': 'טירה קסומה',
  'kingdom': 'ממלכה',
  'space': 'חלל',
  'space-hero': 'גיבור חלל',
  'zoo': 'גן חיות',
  'toothbrush': 'מברשת שיניים',
  'educational-toolbox': 'ארגז כלים חינוכי',
  'sharing-fun': 'שיתוף וכיף',
  'safe-room-sirens': 'שהייה בממ"ד ואזעקות',

  // Values topics (still active)
  'true-friendship': 'חברות אמת',
  'accepting-differences': 'קבלת השונה',
  'helping-home': 'עזרה בבית',

  // Curiosity topics
  'space-journey': 'מסע בחלל',
  'nature-secrets': 'סודות הטבע',
  'how-body-works': 'איך הגוף שלנו עובד',

  // Creativity topics
  'cloud-kingdom': 'ממלכת העננים',
  'dragon-party': 'מסיבת הדרקונים',
  'strange-inventions': 'המצאות משונות',
  'dinosaurs': 'דינוזאורים',
  'cardboard-house': 'בית מקרטון',
  'candy-alive': 'ממתקים שקמו לחיים',
  'talking-toys': 'צעצועים שמדברים',
  'farm-animals': 'חיות משק',
  'unicorn': 'חד קרן',

  // Legacy IDs (removed duplicates still need translation for existing stories)
  'honesty': 'אמירת אמת',
  'respecting-elders': 'כבוד למבוגרים',
  'cooperation': 'שיתוף פעולה',
  'patience': 'סבלנות',
  'politeness': 'אדיבות',
  'self-confidence': 'ביטחון עצמי',

  // Edu toolbox entries (refined titles)
  'honesty-edu': 'כנות – לומר את האמת בעדינות',
  'cooperation-edu': 'עבודת צוות – ביחד אנחנו חזקים',
  'patience-edu': 'סבלנות – לחכות בשקט ובשלווה',
  'politeness-edu': 'נימוס – מילים שפותחות לבבות',
  'respecting-elders-edu': 'כבוד למבוגרים – להקשיב וללמוד',
  'waiting-in-line-edu': 'המתנה בתור – מתי מגיע תורי?',
  'emotion-regulation-edu': 'ויסות רגשות – לנשום ולהירגע',
  'holidays-seasons-edu': 'מעגל השנה – חגים ועונות',
  'play-rules-edu': 'כללי משחק – לשחק בהוגנות',
  'self-confidence-edu': 'ביטחון עצמי – אני יכול/ה!',
  'eating-with-cutlery-edu': 'לאכול עם סכו״ם – הכלים המבריקים שלי',
  'rainbow-power-edu': 'כוח הקשת – פירות וירקות קסומים',

  // Torah stories
  'moses-basket': 'משה בתיבה',
  'exodus': 'יציאת מצרים',
  'noah-ark': 'נח ותיבת נח',
  'joseph-brothers': 'יוסף ואחיו',
  'david-goliath': 'דוד וגוליית',
  'abraham-sarah': 'אברהם ושרה',
  'jonah-fish': 'יונה והדג הגדול',
  'samson-hero': 'שמשון הגיבור',
  'esther-queen': 'אסתר המלכה',
  'hanukkah-miracle': 'חנוכה — נס פך השמן',

  // Learning package — letters
  'letter-alef': 'אות א׳ – אריה האמיץ',
  'letter-bet': 'אות ב׳ – הבית הקסום',
  'letter-gimel': 'אות ג׳ – גינת הפלאות',
  'letter-dalet': 'אות ד׳ – הדלת הסודית',
  'letter-he': 'אות ה׳ – ההרפתקה בהר',
  'letter-vav': 'אות ו׳ – הוורד הוורוד',
  'letter-zayin': 'אות ז׳ – הזיקית הזריזה',
  'letter-chet': 'אות ח׳ – החתול החמוד',
  'letter-tet': 'אות ט׳ – הטיול הטעים',
  'letter-yod': 'אות י׳ – הילד/ה היצירתי/ת',
  'letter-kaf': 'אות כ׳ – הכוכב הכחול',
  'letter-lamed': 'אות ל׳ – הלב הלוהט',
  'letter-mem': 'אות מ׳ – המלך המצחיק',
  'letter-nun': 'אות נ׳ – הנסיכה הנועזת',
  'letter-samekh': 'אות ס׳ – הסוס הסוער',
  'letter-ayin': 'אות ע׳ – העץ הענק',
  'letter-pe': 'אות פ׳ – הפרפר הפלאי',
  'letter-tsadi': 'אות צ׳ – הצב הצבעוני',
  'letter-qof': 'אות ק׳ – הקוף הקטן',
  'letter-resh': 'אות ר׳ – הרכבת הרועשת',
  'letter-shin': 'אות ש׳ – השמש השמחה',
  'letter-tav': 'אות ת׳ – התרנגול התקתק',

  // Learning package — numbers
  'number-1': 'מספר 1 – גיבור יחיד ומיוחד',
  'number-2': 'מספר 2 – שני חברים',
  'number-3': 'מספר 3 – שלושת הדובים',
  'number-4': 'מספר 4 – ארבע עונות השנה',
  'number-5': 'מספר 5 – חמש אצבעות קסומות',
  'number-6': 'מספר 6 – שישה חברים בגן',
  'number-7': 'מספר 7 – שבעת צבעי הקשת',
  'number-8': 'מספר 8 – שמונה רגליים של תמנון',
  'number-9': 'מספר 9 – תשע כוכבים בשמיים',
  'number-10': 'מספר 10 – עשר בלונים צבעוניים',

  // Learning package — colors
  'color-red': 'צבע אדום',
  'color-blue': 'צבע כחול',
  'color-yellow': 'צבע צהוב',
  'color-green': 'צבע ירוק',
  'color-orange': 'צבע כתום',
  'color-purple': 'צבע סגול',
  'color-pink': 'צבע ורוד',
  'color-white': 'צבע לבן',
  'color-black': 'צבע שחור',

  // Learning package — shapes
  'shape-circle': 'צורת עיגול',
  'shape-square': 'צורת ריבוע',
  'shape-triangle': 'צורת משולש',
  'shape-rectangle': 'צורת מלבן',
  'shape-heart': 'צורת לב',
  'shape-star': 'צורת כוכב',
};

/**
 * Translate a topic ID to Hebrew.
 * For stories in English, pass language='en' to keep the original topic.
 */
export const translateTopic = (topic: string, language?: string): string => {
  // For English stories, return the topic as-is (or a readable version)
  if (language === 'en') return topic.replace(/-/g, ' ');
  
  // Check the map
  if (TOPIC_HEBREW_MAP[topic]) return TOPIC_HEBREW_MAP[topic];
  
  // If topic already contains Hebrew characters, return as-is
  if (/[\u0590-\u05FF]/.test(topic)) return topic;
  
  // Fallback: replace hyphens with spaces
  return topic.replace(/-/g, ' ');
};
