
## Premium Upgrade Screen: "ארגז הכלים של SoulStory"

### Overview
Create a new dedicated page (`/toolkit`) for the SoulStory premium toolkit subscription. This is a focused, warm landing page -- separate from the existing `/upgrade` credits page -- that sells only the yearly toolkit subscription with the updated pricing (29.90 ILS) and messaging.

### 1. New Page: `src/pages/Toolkit.tsx`

A standalone screen with the magical dark theme (matching existing app style):

**Header Section:**
- Warm gradient background with floating stars (reuse existing pattern)
- Close/back button (top-left)
- Title: "ארגז הכלים של SoulStory" with gradient text
- Subtitle: Warm introductory text about connecting deeply with children

**Benefits Cards (3 glassmorphism cards):**
- Card 1: "10 טיפים משני חיים בכל חודש" -- icon: Lightbulb or Sparkles
- Card 2: "איך לדבר בשפה שלהם ולמנוע 'אנטי'" -- icon: MessageCircleHeart or Heart
- Card 3: "כלים פרקטיים ליצירת חיבור עמוק עם הילדים" -- icon: HandHeart or Users

Each card: `bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl` with a colored icon and Hebrew text.

**Pricing Section:**
- Large price display: "29.90 ₪ לשנה שלמה"
- Trust line: "תשלום חד-פעמי - ללא מנוי מתחדש וללא הפתעות"
- Small lock/shield icon next to the trust line

**CTA Button (fixed bottom):**
- Warm gradient: `from-amber-500 to-orange-500`
- Text: "אני רוצה את ארגז הכלים"
- Glow effect matching existing CTA style

**"Maybe Later" link:**
- Below the CTA: "אולי אחר כך" text link navigating to `/adventure`

**Payment Flow:**
- Reuse existing PayPalButton component and toolkit purchase logic from Upgrade.tsx
- Reuse PurchaseSuccessModal (subscription variant) and PurchaseFailedModal

**No mention of:** Read Aloud, Accessibility, or credit packages.

### 2. Update Pricing Config: `src/config/pricing.ts`

- Change `TOOLKIT_SUBSCRIPTION.price` from `19.90` to `29.90`
- Update `TOOLKIT_SUBSCRIPTION.label` to `"ארגז הכלים של SoulStory"`
- Update `TOOLKIT_SUBSCRIPTION.description` to match the new messaging

### 3. Add Route: `src/App.tsx`

- Add route: `<Route path="/toolkit" element={<RequireTerms><Toolkit /></RequireTerms>} />`

### 4. Update Existing References

- In `src/pages/Profile.tsx` and `src/components/story/SubscriberUpsellModal.tsx`: Update any "upgrade" navigation links that point to the toolkit to use `/toolkit` instead of `/upgrade`
- The existing `/upgrade` page for credit packages remains unchanged

### Technical Details

- **Files to create:** 1 (`src/pages/Toolkit.tsx`)
- **Files to modify:** 3 (`src/config/pricing.ts`, `src/App.tsx`, `src/pages/Profile.tsx`)
- **Dependencies:** None new -- uses existing components (PayPalButton, PurchaseSuccessModal, PurchaseFailedModal, Button, Badge)
- **Database:** No changes -- reuses existing `purchases` table and `is_subscriber` profile flag
- **Icons:** Lucide icons only (Sparkles, Heart, Users, Crown, Shield)
