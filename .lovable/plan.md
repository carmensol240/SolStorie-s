## Update Educator/Professional Package Pricing

### Scope
Update the educator/professional package from 25 stories / ₪199 to **20 stories / ₪229** (~11.5₪ per story). Keep all free edits, coloring pages, signup gifts, and other logic exactly as-is.

### Files to change

1. **`src/config/pricing.ts`**  
   Update `EDUCATOR_PACKAGE`:
   - `stories`: 25 → 20
   - `price`: 199 → 229
   - `pricePerStory`: `"8₪"` → `"11.5₪"`
   - `freeEdits` and `freeColoringPages` stay unchanged.

2. **`src/pages/Upgrade.tsx`**  
   Update the hardcoded educator description on line 480 from "30 סיפורים + 2 עריכות לסיפור + 8 דפי צביעה" to reflect the new 20-story count. Keep the rest of the UI unchanged.

3. **`supabase/functions/verify-purchase/index.ts`**  
   Update the `educator` entry in `packageConfig`: `stories`: 25 → 20. `freeEdits` and `coloringPages` stay unchanged.

4. **`supabase/functions/paypal-webhook/index.ts`**  
   Update `AMOUNT_TO_PACKAGE`:
   - Key `199` → `229`
   - `stories`: 25 → 20
   - `freeEdits` and `coloringPages` stay unchanged.
   - The other package amounts (basic/popular/premium) are left untouched per instruction.

5. **`src/pages/AdminDashboard.tsx`**  
   Update the educator display label from "אנשי חינוך (25 סיפורים)" to reflect 20 stories.

6. **`src/components/home/LoggedInHome.tsx`**  
   Update the educator welcome banner text that references "25 סיפורים ב-199 ש״ח" to match the new pricing.

### What stays exactly the same
- `PRICING_PACKAGES` (3/49, 10/129, 15/179)
- Free stories on signup
- Editing credits, coloring pages, and all other credit logic
- Any other UI, flows, or business rules