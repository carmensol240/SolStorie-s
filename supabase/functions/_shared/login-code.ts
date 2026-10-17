// Shared helpers for passwordless email login codes (send-login-code / verify-login-code).
export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const EMAIL_COOLDOWN_MS = 60 * 1000;
export const EMAIL_PER_HOUR = 5;
export const IP_PER_HOUR = 5;
export const SITE_PER_DAY = 300;

const enc = new TextEncoder();

export async function hmac(value: string): Promise<string> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

export function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

export function safeReturnTo(raw: unknown): string {
  if (typeof raw !== "string") return "/create";
  const v = raw.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\") || v.length > 300) return "/create";
  return v;
}

export function clientIp(req: Request): string {
  return (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim();
}
