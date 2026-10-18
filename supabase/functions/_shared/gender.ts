// Saved child profiles may hold "boy"/"girl" (old format) or "male"/"female".
// Everything that creates a story uses "male" | "female".
export function normalizeGender(v: unknown): "male" | "female" | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (s === "male" || s === "boy" || s === "זכר") return "male";
  if (s === "female" || s === "girl" || s === "נקבה") return "female";
  return null;
}
