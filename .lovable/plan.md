

## Plan: Add "Child Name" Required Field to Gift Card Purchase

### Current State
- The gift card page has `recipientName` and `senderName` fields, but they appear **after** purchase on the success screen and are optional
- The WhatsApp message uses a generic "סול (או שם הילד)" placeholder
- The sender name defaults to "מישהו/י שאוהב/ת אתכם" if empty

### Changes

**File: `src/pages/GiftCard.tsx`**

1. **Add `childName` state** (new required field) and pre-populate `senderName` from `user?.user_metadata?.display_name`

2. **Add required "שם הילד מקבל המתנה" input field** in the purchase flow (before the PayPal section, around line 338), with validation — disable the purchase button if `childName` is empty

3. **Move `senderName` input to purchase screen too** (pre-filled from profile), so both names are collected before payment

4. **Update `handlePurchase`** to validate `childName` is not empty before proceeding

5. **Update `handleShareWhatsApp` message** (line 91) to use the new personalized format:
   ```
   "[senderName] שלח/ה לך מתנה קסומה! חבילת סיפורים אישיים שבהם [childName] הופך/ת לגיבור/ה של הרפתקאות מרגשות..."
   ```

6. **Remove the old recipient/sender name inputs from the success screen** (lines 162-182) since they're now collected pre-purchase

### What stays the same
- Package selection, PayPal flow, coupon creation, code display, copy functionality — all unchanged

