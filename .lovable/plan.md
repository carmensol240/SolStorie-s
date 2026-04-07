

## Plan: Fix Coloring Kit Purchase — Add Error Handling & Remove Unsafe Casts

### Problem
The coloring kit purchase callback in `Upgrade.tsx` doesn't check for Supabase errors from `insert` or `update` calls. If either fails (e.g. RLS, network), it silently continues and shows the success toast without actually updating `coloring_credits`. The `as any` casts also hide potential type issues.

### Fix — single file: `src/pages/Upgrade.tsx`

### Lines 619-639: Add error checking to both Supabase calls and remove `as any`

Replace the coloring kit success handler body with:

```ts
const { error: purchaseError } = await supabase.from('purchases').insert({
  user_id: user.id,
  package_name: COLORING_KIT_PACKAGE.id,
  credits_purchased: COLORING_KIT_PACKAGE.pages,
  amount_ils: COLORING_KIT_PACKAGE.price,
  status: 'completed',
});
if (purchaseError) throw purchaseError;

// Increment coloring_credits on profile
const { data: profile, error: selectError } = await supabase
  .from('profiles')
  .select('coloring_credits')
  .eq('id', user.id)
  .maybeSingle();
if (selectError) throw selectError;

const currentCredits = profile?.coloring_credits ?? 0;
const { error: updateError } = await supabase
  .from('profiles')
  .update({ coloring_credits: currentCredits + COLORING_KIT_PACKAGE.pages })
  .eq('id', user.id);
if (updateError) throw updateError;

setShowColoringKitPayPal(false);
trackEvent({ ... }); // unchanged
window.dispatchEvent(new CustomEvent('coloring-credits-updated'));
toast.success(`🎨 נוספו ${COLORING_KIT_PACKAGE.pages} דפי צביעה בהצלחה!`);
```

Key changes:
1. Destructure and throw `error` from all three Supabase calls (insert, select, update)
2. Remove `as any` casts — `coloring_credits` is already in the types
3. If any step fails, it now properly falls into the `catch` block showing the failure modal

### What stays the same
- All design, layout, colors, buttons
- Other purchase flows (story, edit kit, educator, toolkit)
- No other files changed

