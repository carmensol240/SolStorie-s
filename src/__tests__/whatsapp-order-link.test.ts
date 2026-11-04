/**
 * "We'll prepare it for you" WhatsApp link.
 *
 * Rules it guards:
 *  - the link points at 053-5577007 (972535577007) and pre-fills the exact message
 *  - it appears in exactly two places: homepage under the pricing cards, and the
 *    paywall after the free taste — never as a floating button
 *  - both links open in a new tab and carry the accessible label
 *  - the accessibility statement shows the same phone number
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  WHATSAPP_ORDER_URL,
  WHATSAPP_ORDER_MESSAGE,
  WHATSAPP_ORDER_LABEL,
} from "../lib/whatsapp-order";

const read = (rel: string) => readFileSync(resolve(__dirname, "../..", rel), "utf8");

describe("the WhatsApp order link", () => {
  it("opens a chat with 053-5577007", () => {
    expect(WHATSAPP_ORDER_URL.startsWith("https://wa.me/972535577007?text=")).toBe(true);
  });

  it("pre-fills the message with name, age and topic fields", () => {
    expect(WHATSAPP_ORDER_MESSAGE).toBe(
      "היי! אשמח שתכינו לי סיפור אישי 😊\n\nשם הילד/ה:\n\nגיל:\n\nנושא הסיפור:\n\n(מצרף/ת תמונה)"
    );
    expect(WHATSAPP_ORDER_URL).toBe(
      `https://wa.me/972535577007?text=${encodeURIComponent(WHATSAPP_ORDER_MESSAGE)}`
    );
  });

  it("uses the accessible label", () => {
    expect(WHATSAPP_ORDER_LABEL).toBe("פתיחת וואטסאפ בחלון חדש");
  });
});

describe("the two places it appears", () => {
  const homepage = read("src/components/home/HomeExplainer.tsx");
  const paywall = read("src/components/story/DemoLockModal.tsx");

  for (const [name, source] of [
    ["homepage pricing section", homepage],
    ["paywall after the free taste", paywall],
  ]) {
    it(`${name} links to WhatsApp in a new tab with the label`, () => {
      expect(source).toContain("WHATSAPP_ORDER_URL");
      expect(source).toContain('target="_blank"');
      expect(source).toContain("WHATSAPP_ORDER_LABEL");
    });
  }

  it("is not a floating button anywhere in the app", () => {
    const users = read("src/lib/whatsapp-order.ts");
    expect(users).toContain("no floating button");
    expect(homepage).not.toMatch(/fixed bottom|fixed inset|bottom-4|bottom-6/);
    expect(paywall).not.toMatch(/fixed bottom|fixed inset|bottom-4|bottom-6/);
  });
});

describe("the phone number shown to parents", () => {
  it("the accessibility statement lists 053-5577007", () => {
    const statement = read("src/pages/AccessibilityStatement.tsx");
    expect(statement).toContain('"053-5577007"');
    expect(statement).not.toContain("050-2480020");
  });
});
