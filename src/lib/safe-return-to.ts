/**
 * Only internal paths are allowed as a post-login destination.
 * Must start with a single "/" (not "//" or "/\\"); anything else → fallback.
 */
export const DEFAULT_RETURN_TO = "/create";

export function safeReturnTo(raw: string | null | undefined, fallback = DEFAULT_RETURN_TO): string {
  if (!raw || typeof raw !== "string") return fallback;
  const v = raw.trim();
  if (!v.startsWith("/")) return fallback;
  if (v.startsWith("//") || v.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(v)) return fallback;
  return v;
}
