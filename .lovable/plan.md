## Objective
Update the 3 story package prices and replace the existing countdown timer on the `/upgrade` pricing page.

## Changes

### 1. `src/config/pricing.ts`
Update the 3 main package prices and per-story labels:

| Package | Stories | Old Price | New Price | Old per-story | New per-story |
|---------|---------|-----------|-----------|---------------|---------------|
| basic   | 3       | ₪39       | **₪49**   | 13₪           | ~16.3₪        |
| popular | 10      | ₪99       | **₪129**  | 9.9₪          | 12.9₪         |
| premium | 15      | ₪119      | **₪169**  | 7.9₪          | ~11.3₪        |

Also update `originalPrice` fields to match.

### 2. `src/pages/Upgrade.tsx`
Replace the existing countdown timer (currently targeting April 7, 2026 / "מבצע פסח") with:

- **Target:** 48 hours from deploy time (`Date.now() + 48 * 60 * 60 * 1000`)
- **Text above timer:** `⏰ ההצעה המיוחדת הזו מסתיימת בקרוב!`
- **Display:** Days, hours, minutes, seconds counting down
- **Styling:** Match existing purple/pink gradient design of the page
- **Zero behavior:** Hide the entire timer block completely when `timeLeft` reaches 0

## What stays exactly the same
- Card layout, glassmorphism styling, selection rings
- PayPal purchase logic, coupon logic, test-user logic
- All other packages (educator, edit kit, coloring kit, toolkit)
- Hero image, header text, credit badge, bottom CTA
- All other page logic and event tracking