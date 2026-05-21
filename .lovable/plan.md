
# Show active child's name in the purchase-page book mockup

Scope: `src/components/upgrade/FlippingBookAnimation.tsx` only.

## Behavior
- Fetch the current user's active child (`children` table, `is_active = true`) and use that `name` in the mockup title.
- Fallback when no user / no active child: `"הסיפור שלך"`.

## Changes in `FlippingBookAnimation.tsx`
1. Make the component dynamic:
   - Import `useAuth` and `supabase`.
   - Add `useState<string>` for `childName`, default `"הסיפור שלך"`.
   - `useEffect` on `user?.id`: query
     ```ts
     supabase.from("children")
       .select("name")
       .eq("user_id", user.id)
       .eq("is_active", true)
       .maybeSingle()
     ```
     and set `childName` to `data?.name` when present.
2. Replace the two hardcoded `"סול רופאת החיות"` strings (spine and front-cover title) with `childName`.
3. Update the subtitle `"💛 הסיפור של סול"` to `` `💛 הסיפור של ${childName}` ``.
4. Keep all visuals, classes, image, branding text, and caption unchanged.

## Out of scope
- No changes to pricing, layout, or any other component.
- No prop API change; component remains parameterless.
