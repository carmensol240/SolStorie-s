# Cookie notice and consent before tracking

## What I found (tools loading on the site today)

1. **Meta Pixel** (ID 2132057870988224): loads on every page as soon as the site opens. It sends PageView on entry and on every page change, plus Purchase after a payment. There is also a hidden image fallback that sends PageView to Meta even when scripts are off.
2. **Google Analytics** (G-TWW52645C8): also loads on every page right away, with IP anonymization. This is a tracking tool as well, so it gets the same treatment as the Pixel.
3. **Not tracking:** Google Fonts, the site's own internal usage stats (saved in our own database, not sent to any outside company), and the Grow payment page, which opens only when you pay.
4. **Today no consent is asked**, and the privacy policy does not mention Meta or Google Analytics.
5. **The footer** (with links to terms and privacy) shows on only some pages: create story, profile, privacy, terms and accessibility. It does not appear on the home page, library or story pages.

## What I'll build

1. **Banner at the bottom on the first visit**, small, in Hebrew, without covering the content:
   "אנחנו משתמשים בעוגיות כדי שהאתר יעבוד, ובאישורך גם כדי לשפר את הפרסום שלנו."
   It has two buttons of the same size and weight, "מאשר/ת הכל" and "רק הכרחיות", and a link "למדיניות הפרטיות". It sits above the bottom menu.
2. **Meta Pixel and Google Analytics load only after "מאשר/ת הכל".** Before a choice, and after "רק הכרחיות", their code isn't loaded at all and nothing is sent to them. The hidden image fallback is removed.
3. **Necessary cookies always work:** sign-in, saved preferences and accessibility settings, whatever the choice.
4. **Your choice is saved** in the browser together with the date and the version of the notice. The banner does not come back.
5. **"הגדרות עוגיות" link** goes into the footer. Because the footer is missing from some pages, the same link also goes into the accessibility menu, which shows on every page. It reopens the banner with the current choice shown. If someone switches from "all" to "necessary only", tracking stops right away, including in other open tabs. Code that already loaded is cleared on the next page load.
6. **Privacy policy:** I'll add a short cookies section. It names Meta (advertising measurement) and Google (usage statistics) and explains how to change the choice.
7. **Nothing else changes.** Purchase tracking stays the same; it simply won't send without consent.

## Checks

A browser test against the site:
- Before any choice: zero requests to facebook.net, facebook.com or google-analytics.
- After "רק הכרחיות", including after a reload: zero requests.
- After "מאשר/ת הכל": the Pixel loads and PageView is sent.
- "הגדרות עוגיות" reopens the banner.

I'll also add automated checks for the consent rule.

## Technical details

- Remove the gtag and Meta base scripts and the noscript pixel from `index.html`. The CSP stays as it is.
- `src/lib/consent.ts`: stores `{ choice: 'all'|'necessary', version, at }` in the `cookie_consent` localStorage key. It provides `hasAdConsent()` (read fresh on each send), `setConsent()`, and a `storage` event listener so other open tabs update too.
- `src/lib/trackers.ts`: injects the Meta and gtag scripts once, only when consent is `all`.
- `CookieBanner.tsx` is mounted in `App.tsx`. A `open-cookie-settings` window event reopens it.
- `MetaPixel.tsx` and `PurchaseSuccessModal` check `hasAdConsent()` before calling `fbq`.
