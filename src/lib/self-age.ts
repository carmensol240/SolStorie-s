/**
 * Finds the child's own age written in "fixed details" ("בת 3, אחות ל...").
 * Only a "בן N" / "בת N" at the very start of the text (or of the first phrase)
 * counts — "אח גדול בן 10" describes someone else and is ignored.
 */
export function detectSelfAgeInDetails(text: string | null | undefined): number | null {
  if (!text) return null;
  const first = text.trim().split(/[,.;\n،]/)[0]?.trim() ?? "";
  const m = first.match(/^(?:היא\s+|הוא\s+)?(?:בן|בת)\s*(?:ה-?\s*)?(\d{1,2})(?:\s|$)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 12 ? n : null;
}

/** The age to ask about, or null when the details agree with the chosen age. */
export function selfAgeMismatch(details: string | null | undefined, chosenAge: number | null | undefined): number | null {
  const n = detectSelfAgeInDetails(details);
  return n !== null && n !== chosenAge ? n : null;
}
