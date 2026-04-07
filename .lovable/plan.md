

## Plan: Add Debug Logging + Prominent Success Toast to Coloring Kit Purchase

### Problem
The coloring kit purchase code looks correct but we need visibility into what happens at each step. The existing `toast.success` may not be prominent enough.

### Changes — single file: `src/pages/Upgrade.tsx`

### 1. Add console.log at each step of the coloring kit purchase callback (lines 616-649)

Add logging before and after each Supabase call:
```ts
onSuccess={async () => {
  if (!user) return;
  try {
    console.log('🎨 [COLORING PURCHASE] Starting purchase flow for user:', user.id);
    
    const { error: purchaseError } = await supabase.from('purchases').insert({...});
    console.log('🎨 [COLORING PURCHASE] Insert result:', purchaseError ? `FAILED: ${purchaseError.message}` : 'SUCCESS');
    if (purchaseError) throw purchaseError;

    const { data: profile, error: selectError } = await supabase.from('profiles').select('coloring_credits')...;
    console.log('🎨 [COLORING PURCHASE] Current credits:', profile?.coloring_credits, 'Select error:', selectError?.message ?? 'none');
    if (selectError) throw selectError;

    const currentCredits = profile?.coloring_credits ?? 0;
    const newCredits = currentCredits + COLORING_KIT_PACKAGE.pages;
    console.log('🎨 [COLORING PURCHASE] Updating credits:', currentCredits, '->', newCredits);
    
    const { error: updateError } = await supabase.from('profiles').update({ coloring_credits: newCredits })...;
    console.log('🎨 [COLORING PURCHASE] Update result:', updateError ? `FAILED: ${updateError.message}` : 'SUCCESS');
    if (updateError) throw updateError;

    // ... existing cleanup code ...
    console.log('🎨 [COLORING PURCHASE] ✅ Complete! New balance:', newCredits);
  } catch (error) {
    console.error('🎨 [COLORING PURCHASE] ❌ FAILED:', error);
    // ... existing error handling ...
  }
}
```

### 2. Replace the toast with a more prominent centered toast (line 643)

Replace the existing `toast.success(...)` with a sonner toast that uses a longer duration and description:
```ts
toast.success('🎨 נוספו קרדיטי צביעה!', {
  description: `נוספו ${COLORING_KIT_PACKAGE.pages} דפי צביעה לחשבונך. יתרה חדשה: ${newCredits}`,
  duration: 6000,
});
```

### What stays the same
- All design, layout, colors, buttons
- Purchase logic flow (insert → select → update)
- Error handling
- No other files changed

