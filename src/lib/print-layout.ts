// Pure print-book layout: page size, safe area and page order.
// Square 21x21 cm book, 3 mm bleed per side → 216x216 mm PDF page, rendered at 300 DPI.

export const TRIM_MM = 210;
export const BLEED_MM = 3;
export const PAGE_MM = TRIM_MM + BLEED_MM * 2; // 216
export const SAFE_MM = 13; // 10 mm inside the cut line
export const DPI = 300;
export const PAGE_PX = Math.round((PAGE_MM / 25.4) * DPI); // 2551

export type PrintLang = 'he' | 'en';

export type PrintSlot =
  | { kind: 'cover' }
  | { kind: 'insideCover' }
  | { kind: 'dedication' }
  | { kind: 'text'; storyIndex: number; storyIndexes: number[] }
  | { kind: 'illustration'; storyIndex: number; withText?: boolean }
  | { kind: 'decorative'; storyIndex: number }
  | { kind: 'talk' }
  | { kind: 'theEnd' }
  | { kind: 'drawMoment' }
  | { kind: 'ourHero' }
  | { kind: 'blank' }
  | { kind: 'backCover' };

export const printLang = (language?: string | null): PrintLang =>
  language === 'en' ? 'en' : 'he';

/**
 * Builds the full page order. Index 0 = printed page 1.
 * A story page with a picture opens a spread: text (even page) facing its picture (odd page).
 * A page without a picture joins the previous spread's text when that spread has a picture
 * (or is itself a picture-less spread) and still holds only one story page (max two per text page). Otherwise it opens
 * its own spread facing a decorative page — so decorative pages appear only for truly missing pictures.
 */
export function buildPageSequence(
  pages: { illustration_url: string | null }[],
  opts: { skipDrawMomentFiller?: boolean; textOnPicture?: boolean } = {},
): PrintSlot[] {
  if (opts.textOnPicture) return buildTextOnPictureSequence(pages, opts);
  type Spread = { idx: number[]; pic: boolean };
  const spreads: Spread[] = [];
  pages.forEach((p, i) => {
    const pic = !!p.illustration_url;
    const last = spreads[spreads.length - 1];
    if (!pic && last && last.idx.length === 1) last.idx.push(i);
    else spreads.push({ idx: [i], pic });
  });
  const seq: PrintSlot[] = [{ kind: 'cover' }, { kind: 'insideCover' }, { kind: 'dedication' }];
  spreads.forEach(sp => {
    const first = sp.idx[0];
    seq.push({ kind: 'text', storyIndex: first, storyIndexes: sp.idx }); // even printed page
    seq.push(sp.pic ? { kind: 'illustration', storyIndex: first } : { kind: 'decorative', storyIndex: first });
  });
  // Ending: talk page and "next adventure" always; fillers to a multiple of 4 in this order, blank only after them.
  return finishSequence(seq, opts);
}

/** Ages 0–4: one page per story page — the picture with its text on it (a text page only when there is no picture). */
function buildTextOnPictureSequence(
  pages: { illustration_url: string | null }[],
  opts: { skipDrawMomentFiller?: boolean },
): PrintSlot[] {
  const seq: PrintSlot[] = [{ kind: 'cover' }, { kind: 'insideCover' }, { kind: 'dedication' }];
  pages.forEach((p, i) => {
    seq.push(p.illustration_url
      ? { kind: 'illustration', storyIndex: i, withText: true }
      : { kind: 'text', storyIndex: i, storyIndexes: [i] });
  });
  return finishSequence(seq, opts);
}

function finishSequence(seq: PrintSlot[], opts: { skipDrawMomentFiller?: boolean }): PrintSlot[] {
  seq.push({ kind: 'talk' }, { kind: 'theEnd' });
  const fillers: PrintSlot[] = opts.skipDrawMomentFiller
    ? [{ kind: 'ourHero' }]
    : [{ kind: 'drawMoment' }, { kind: 'ourHero' }];
  while ((seq.length + 1) % 4 !== 0) seq.push(fillers.shift() ?? { kind: 'blank' });
  seq.push({ kind: 'backCover' });
  return seq;
}

/** Design pixels per typographic point on the 1240px design page (216 mm wide). */
export const DESIGN_PX = 1240;
export const PX_PER_PT = (25.4 / 72) * (DESIGN_PX / PAGE_MM); // ≈ 2.07

/** Ages 0–4 (age ranges "0-2" and "2-4"): the text is printed on the picture, in a dark band at the bottom. */
export const isTextOnPictureAge = (ageRange?: string | null): boolean =>
  ageRange === '0-2' || ageRange === '2-4';

/** Young readers (age range starting below 5) get the larger minimum print size. */
export const isYoungReader = (ageRange?: string | null): boolean => {
  const first = parseInt(String(ageRange ?? '').split('-')[0], 10);
  return Number.isFinite(first) ? first < 5 : true;
};

/** Minimum print text size in points: 20 pt for young readers, 16 pt for older ones. */
export const minPrintPt = (young: boolean) => (young ? 20 : 16);
/** Starting (largest) print text size in points, so the text fills about 60% of the page. */
export const maxPrintPt = (young: boolean) => (young ? 30 : 24);

/** Font steps (design px) for a text page: largest size down to the age minimum, then line-height 1.75 → 1.6.
 *  Never goes below the minimum; if still too tall the renderer reflows lines into a paragraph. */
export function textFitSteps(young: boolean): { font: number; line: number }[] {
  const max = Math.round(maxPrintPt(young) * PX_PER_PT);
  const min = Math.ceil(minPrintPt(young) * PX_PER_PT);
  const steps: { font: number; line: number }[] = [];
  for (let f = max; f > min; f -= 2) steps.push({ font: f, line: 1.75 });
  steps.push({ font: min, line: 1.75 }, { font: min, line: 1.65 }, { font: min, line: 1.6 });
  return steps;
}

export const PRINT_TEXTS = {
  he: {
    dir: 'rtl' as const,
    storyOf: (n: string) => `הסיפור של ${n}`,
    belongsTo: 'הספר הזה שייך ל-',
    dedication: 'הַסִּפּוּר הַזֶּה נִכְתַּב בִּמְיֻחָד עֲבוּר ______________',
    theEnd: 'סוֹף',
    nextAdventure: (n: string, male: boolean) => `לאן ${male ? 'ייצא' : 'תצא'} ${n} להרפתקה הבאה?`,
    scanNext: 'סרקו ויוצרים את הסיפור הבא',
    drawMoment: 'ציירו את הרגע האהוב עליכם בסיפור',
    ourHero: (male: boolean) => (male ? 'הגיבור שלנו' : 'הגיבורה שלנו'),
    photoHere: 'הדביקו כאן תמונה',
    dateLine: 'תאריך:',
    memoryLine: 'זיכרון מהיום שקראנו:',
    tagUs: (n: string) => `צלמו את ${n} עם הספר ותייגו אותנו`,
    joinWorld: 'הצטרפו לעולמה הקסום של סול',
    heroOf: (n: string) => `${n} — הגיבור/ה של הסיפור`,
    tagline: 'כל ילד הוא גיבור הסיפור שלו',
    sub: 'סיפורים מותאמים אישית עם הילד שלך כגיבור',
    scan: 'סרקו ליצירת הסיפור הבא של הילד שלכם',
    created: (n: string, d: string) => `הסיפור של ${n} · נוצר ב-${d}`,
    rights: "© SolStorie's™ · כל הזכויות שמורות",
    locale: 'he-IL',
  },
  en: {
    dir: 'ltr' as const,
    storyOf: (n: string) => `${n}'s story`,
    belongsTo: 'This book belongs to',
    dedication: 'This story was written especially for ______________',
    theEnd: 'The End',
    nextAdventure: (n: string, _male: boolean) => `Where will ${n} go on the next adventure?`,
    scanNext: 'Scan to create the next story',
    drawMoment: 'Draw your favorite moment from the story',
    ourHero: (_male: boolean) => 'Our hero',
    photoHere: 'Stick a photo here',
    dateLine: 'Date:',
    memoryLine: 'A memory from the day we read it:',
    tagUs: (n: string) => `Snap a photo of ${n} with the book and tag us`,
    joinWorld: "Join Sol's magical world",
    heroOf: (n: string) => `${n} — the hero of the story`,
    tagline: 'Every child is the hero of their own story',
    sub: 'Personalized stories with your child as the hero',
    scan: "Scan to create your child's next story",
    created: (n: string, d: string) => `${n}'s story · created ${d}`,
    rights: "© SolStorie's™ · All rights reserved",
    locale: 'en-US',
  },
};

export const PRINT_NOTE: Record<PrintLang, string> = {
  he: 'ספר ריבועי 21×21 ס"מ עם 3 מ"מ לחיתוך. בהדפסה בבית: גודל אמיתי (100%). במכון הדפסה: כריכה בצד ימין.',
  en: 'Square book 21×21 cm with 3 mm bleed. Home printing: actual size (100%). Print shop: cover on the left side.',
};

/** Contain-fit rectangle for an image of (w,h) inside a square of side s. */
export function containRect(w: number, h: number, s: number) {
  const k = Math.min(s / w, s / h);
  const dw = w * k, dh = h * k;
  return { x: (s - dw) / 2, y: (s - dh) / 2, w: dw, h: dh };
}
