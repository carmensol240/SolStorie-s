

## Premium Tips Toolkit and Subscription Feature

### Overview
Transform the existing "הטיפ של כרמית" tips box in the Profile screen into a premium "sparkly" toolkit with subscriber/non-subscriber states, add a yearly subscription option to the Upgrade screen, and update the purchase success modal with a warm welcome message.

### 1. Premium "Sparkly" Tips Box in Profile

**File: `src/pages/Profile.tsx`**

Replace the current plain tips section (lines 248-259) with a premium toolkit:

- **Title**: "ערכת הכלים של כרמית: NLP וחינוך מקרב"
- **Design**: Animated sparkle border using CSS keyframes (golden gradient border that shimmers), a soft amber/purple glow shadow, and a Sparkles icon
- **Subscriber state** (using `useSubscription` hook):
  - If `isSubscriber === true`: Show the rotating monthly NLP tips (same cycling logic, same tips array)
  - If `isSubscriber === false`: Show a "locked/preview" state with a blurred or faded first tip, a lock icon overlay, and a CTA button: "פתחו את המדריך השנתי המלא ב-19.90 ש״ח" that navigates to `/upgrade?toolkit=true`
- **Attribution**: "כרמית כהן, מייסדת StoryTime"
- Add CSS animation for the sparkle border effect using Tailwind's `animate` and inline `@keyframes`

### 2. Yearly Subscription on Upgrade Screen

**File: `src/pages/Upgrade.tsx`**

Add a new subscription card **above** the existing credit packages:

- **Design**: A distinct glassmorphism card with a golden/amber gradient border and a Crown icon
- **Title**: "מנוי שנתי לערכת הכלים של כרמית"
- **Price**: "19.90 ש״ח לשנה"
- **Description**: "ליווי רגשי וכלים מעולם ה-NLP שמתעדכנים בכל חודש. הפכו כל סיפור לרגע של חיבור עמוק וצמיחה עבור הילד שלכם."
- **CTA button**: "הירשמו למנוי" -- triggers PayPal flow with amount 19.90
- On success: update `profiles.is_subscriber = true` via Supabase, show success modal with warm welcome
- Conditionally shown: only visible when `?toolkit=true` query param is present OR always shown as a separate section below the credit packages

**File: `src/config/pricing.ts`**

Add a new subscription constant:
```typescript
export const TOOLKIT_SUBSCRIPTION = {
  id: "toolkit_yearly",
  price: 19.90,
  label: "מנוי שנתי לערכת הכלים של כרמית",
  description: "ליווי רגשי וכלים מעולם ה-NLP שמתעדכנים בכל חודש.",
};
```

### 3. Purchase Success Modal - Warm Welcome for Subscribers

**File: `src/components/paywall/PurchaseSuccessModal.tsx`**

Add an optional `isSubscription` prop. When true, show a different message:
- Heading: "ברוכים הבאים למשפחת StoryTime!"
- Body: "שמחה שהצטרפתם. מעכשיו תקבלו כל חודש כלים חדשים מעולם ה-NLP והחינוך המקרב שיעזרו לכם להפוך כל סיפור לרגע של חיבור אמיתי.\n\nבהצלחה ובשמחה,\nכרמית כהן"
- Navigate to `/profile` instead of `/library`

### 4. Subscriber Status Update

**File: `src/pages/Upgrade.tsx`** (subscription purchase handler)

On successful toolkit subscription purchase:
- Insert into `purchases` table with `package_name: 'toolkit_yearly'`
- Update `profiles` table: set `is_subscriber = true` for the user
- Show the subscription-specific success modal

### 5. Items Already Done (No Changes Needed)

- **Sky Screen (Home)**: Bottom CTA already hidden when welcome banner is visible
- **Profile header**: 160px child profile circles already in place
- **PWA Settings**: "קיצור דרך למסך הבית" already functional with install/installed states
- **Branding**: "כרמית כהן" consistently used
- **UI cleanup**: No read-aloud/accessibility icons on main screens
- **Image fitting**: All images use `object-cover`

---

### Technical Details

| File | Change |
|------|--------|
| `src/pages/Profile.tsx` | Import `useSubscription`, replace tips section with premium sparkly toolkit (subscriber/locked states) |
| `src/pages/Upgrade.tsx` | Add yearly toolkit subscription card with PayPal flow and `is_subscriber` update |
| `src/config/pricing.ts` | Add `TOOLKIT_SUBSCRIPTION` constant |
| `src/components/paywall/PurchaseSuccessModal.tsx` | Add `isSubscription` prop with warm welcome message signed by "כרמית כהן" |

**No database changes needed** -- the `profiles.is_subscriber` column already exists with a `boolean` type and `false` default.

**No new dependencies required.**

