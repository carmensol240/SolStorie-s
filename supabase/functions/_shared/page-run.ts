// How one generate-illustrations page run is shaped.
// Short-instruction stories (short-prompt.ts) draw every page from the child's avatar only, so:
//  - the check after drawing compares the page with the avatar, never with page 1;
//  - pages never wait for page 1 (it is not sent to the drawing).
// Every run must finish before the platform cuts the request (~150 s): a redraw starts only when
// there is time left for it; otherwise the existing keep/hold rules decide right away, so the
// page is saved or held (with a log row + admin alert) instead of the run being killed silently.

/** Time we allow one invocation to use before the platform cut-off (~150 s). */
export const INVOCATION_BUDGET_MS = 140_000;
/** Time one more drawing + upload + check needs. */
export const REDRAW_NEEDS_MS = 50_000;

/** True when a step that needs `needMs` still fits in the invocation budget. */
export function hasTimeFor(startedAt: number, now: number, needMs = REDRAW_NEEDS_MS, budgetMs = INVOCATION_BUDGET_MS): boolean {
  return now - startedAt + needMs <= budgetMs;
}

/** Picture the page is compared with after drawing: null = compare with the avatar only. */
export function pageCheckReference(pageNumber: number, short: boolean, pageOneUrl: string | null): string | null {
  if (short || pageNumber === 1) return null;
  return pageOneUrl;
}

/** Whether a page run must wait for page 1's picture before drawing. */
export function waitsForPageOne(short: boolean): boolean {
  return !short;
}
