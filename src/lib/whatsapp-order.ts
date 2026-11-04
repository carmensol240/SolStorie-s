/**
 * "We'll prepare it for you" WhatsApp order link.
 *
 * Used in exactly two places (no floating button anywhere):
 *  - the homepage, right under the pricing cards (HomeExplainer)
 *  - the paywall / package selection screen after the free taste (DemoLockModal)
 *
 * Both open in a new tab and pre-fill the same message so the parent only has
 * to type the child's name, age and topic.
 */

const WHATSAPP_PHONE_INTL = "972535577007";

export const WHATSAPP_ORDER_MESSAGE = [
  "היי! אשמח שתכינו לי סיפור אישי 😊",
  "",
  "שם הילד/ה:",
  "",
  "גיל:",
  "",
  "נושא הסיפור:",
  "",
  "(מצרף/ת תמונה)",
].join("\n");

/** wa.me link with the message URL-encoded. */
export const WHATSAPP_ORDER_URL = `https://wa.me/${WHATSAPP_PHONE_INTL}?text=${encodeURIComponent(
  WHATSAPP_ORDER_MESSAGE
)}`;

/** Screen-reader label used on both links. */
export const WHATSAPP_ORDER_LABEL = "פתיחת וואטסאפ בחלון חדש";
