// Testing / throwaway mail services that may not receive login codes.
// A domain matches itself and any subdomain (e.g. x.mailosaur.net).
export const DISPOSABLE_EMAIL_DOMAINS = [
  "mailosaur.net", "mailosaur.io",
  "guerrillamail.com", "guerrillamail.info", "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz", "guerrillamail.de",
  "guerrillamailblock.com", "grr.la", "sharklasers.com", "pokemail.net", "spam4.me",
  "mailinator.com", "mailinator.net", "mailinator2.com",
  "yopmail.com", "yopmail.fr", "yopmail.net",
  "tempmail.com", "temp-mail.org", "temp-mail.io", "tempmail.net", "tempmail.dev", "tempmailo.com", "tempr.email",
  "10minutemail.com", "10minutemail.net", "10minemail.com", "20minutemail.com",
  "throwawaymail.com", "trashmail.com", "trashmail.de", "getnada.com", "nada.email",
  "dispostable.com", "maildrop.cc", "mailnesia.com", "mintemail.com", "fakeinbox.com",
  "emailondeck.com", "mohmal.com", "mailpoof.com", "moakt.com", "tmail.ws", "1secmail.com",
  "1secmail.net", "1secmail.org", "mail.tm", "mail.gw", "burnermail.io", "inboxkitten.com",
  "mailcatch.com", "spamgourmet.com", "testmail.app", "inbox.testmail.app", "mailtrap.io", "ethereal.email",
];

const KEYWORDS = ["mailosaur", "guerrillamail", "mailinator", "yopmail", "tempmail", "temp-mail", "10minutemail", "throwaway", "trashmail"];

/**
 * Full check: the short local list above + the big public list in the database
 * (public.blocked_email_domains via is_disposable_email, includes subdomains).
 * On a database error only the local list decides (never lock out real parents).
 */
// deno-lint-ignore no-explicit-any
export async function isBlockedEmail(admin: any, email: string | null | undefined): Promise<boolean> {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return false;
  if (isDisposableEmail(e)) return true;
  try {
    const { data, error } = await admin.rpc("is_disposable_email", { p_email: e });
    if (error) { console.error("[disposable-email] rpc failed", error.message); return false; }
    return data === true;
  } catch (err) {
    console.error("[disposable-email] rpc threw", err);
    return false;
  }
}

export const DISPOSABLE_EMAIL_MESSAGE_HE = "אי אפשר להירשם עם כתובת מייל זמנית. נסו כתובת מייל קבועה.";

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith("." + d))) return true;
  return KEYWORDS.some((k) => domain.includes(k));
}
