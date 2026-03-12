

## Plan: Complete the Referral System

### What Already Exists
- `profiles.referral_code` and `profiles.share_coins` columns
- `referrals` table for tracking
- `use-referral.ts` hook with code generation, sharing, coin redemption
- `ShareAndEarn.tsx` page with full sharing UI
- `processReferral()` in Auth.tsx that handles URL-based referrals (`?ref=CODE`)
- Referral code stored in localStorage from URL params

### What's Missing (3 changes)

**1. Add referral code input field to signup form (`src/pages/Auth.tsx`)**
- Add a `referralCodeInput` state variable
- Add an optional text field after the role selection: "יש לך קוד הפניה? הזן כאן"
- When user submits signup, if `referralCodeInput` is filled, save it to localStorage as `referral_code` (same key `processReferral` already reads from)
- This way the existing `processReferral` function handles everything automatically

**2. Update `processReferral` to award `story_credits` instead of `share_coins` (`src/pages/Auth.tsx`)**
- Currently awards `share_coins` which must be manually redeemed
- The user wants the referrer to receive 1 free story credit directly
- Change the update to increment `story_credits` instead of `share_coins`

**3. Add referral section to Settings screen (`src/pages/Settings.tsx`)**
- Add a section titled "הזמינו חבר/ה וקבלו סיפור במתנה! 🎉"
- Show the user's referral code with a copy button
- Show a pre-written share message: "הצטרפו ל-SolStorie's וקבלו סיפור ראשון חינם! השתמשו בקוד שלי: [CODE] בהרשמה 🎉"
- Import and use `useReferral` hook
- Place it between the credits button and the PWA install section

### No Database Changes Required
All needed columns and tables already exist.

