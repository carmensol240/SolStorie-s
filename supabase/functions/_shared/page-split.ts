// Keeps every story page short enough to read on a phone.
// Pages longer than MAX_PAGE_CHARS (counted without nikud) are split at
// sentence boundaries into an extra page instead of being squeezed.
// Continuation pages never get their own illustration.

export const MAX_PAGE_CHARS = 300;

const NIKUD_RE = /[\u0591-\u05C7]/g;

export function pageLength(text: string): number {
  return (text || "").replace(NIKUD_RE, "").trim().length;
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?…]+(?:[.!?…]+["'”׳״)]*\s*)|[^.!?…]+$/g) || [text];
  return parts.map((p) => p.trim()).filter(Boolean);
}

function splitWords(sentence: string, max: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const w of sentence.split(/\s+/)) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && pageLength(next) > max) { out.push(cur); cur = w; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

export function splitPageText(text: string, max = MAX_PAGE_CHARS): string[] {
  const clean = (text || "").trim();
  if (pageLength(clean) <= max) return [clean];
  const units = splitSentences(clean).flatMap((s) => (pageLength(s) > max ? splitWords(s, max) : [s]));
  const chunks: string[] = [];
  let cur = "";
  for (const u of units) {
    const next = cur ? `${cur} ${u}` : u;
    if (cur && pageLength(next) > max) { chunks.push(cur); cur = u; } else cur = next;
  }
  if (cur) chunks.push(cur);
  // Avoid a tiny last page: merge it back if it still fits.
  if (chunks.length > 1 && pageLength(chunks[chunks.length - 1]) < 40) {
    const merged = `${chunks[chunks.length - 2]} ${chunks[chunks.length - 1]}`;
    if (pageLength(merged) <= max) chunks.splice(-2, 2, merged);
  }
  return chunks;
}

export interface SplittablePage {
  page_number: number;
  text: string;
  illustration_prompt?: string | null;
  [key: string]: unknown;
}

/**
 * Splits long pages and renumbers 1..N. `illustrate(page)` decides (on the
 * ORIGINAL numbering) whether a page gets a picture; continuation pages never do.
 * Each returned page carries `_illustrate`.
 */
export function splitLongPages<T extends SplittablePage>(
  pages: T[],
  illustrate: (page: T) => boolean,
  max = MAX_PAGE_CHARS,
): Array<T & { _illustrate: boolean }> {
  const out: Array<T & { _illustrate: boolean }> = [];
  const sorted = [...pages].sort((a, b) => a.page_number - b.page_number);
  for (const page of sorted) {
    const wants = illustrate(page);
    splitPageText(String(page.text || ""), max).forEach((chunk, i) => {
      out.push({
        ...page,
        text: chunk,
        illustration_prompt: i === 0 ? page.illustration_prompt ?? null : null,
        _illustrate: i === 0 ? wants : false,
      });
    });
  }
  out.forEach((p, i) => { p.page_number = i + 1; });
  return out;
}
