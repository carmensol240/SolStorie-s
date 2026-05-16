Add a personalized greeting at the very top of `src/components/wizard/ChildInfoStep.tsx`, above the existing "ספרו לנו על הילד/ה" title.

## Changes (single file: `src/components/wizard/ChildInfoStep.tsx`)

1. **Imports**: ensure `useAuth` from `@/hooks/use-auth` and `supabase` from `@/integrations/supabase/client` are imported (add if missing). `useState` / `useEffect` are already imported.

2. **State + fetch**: inside the component, add:
   - `const { user } = useAuth();`
   - `const [displayName, setDisplayName] = useState<string | null>(null);`
   - `useEffect` that, when `user` exists, queries `profiles.display_name` by `user.id` and falls back to `user.email?.split('@')[0]`. Same pattern used in `src/pages/Home.tsx`.

3. **Render greeting** at the very top of the returned JSX (before the existing title block), guarded by `user`:
   ```tsx
   {user && (
     <div className="mb-3 text-center">
       <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
         שלום, {displayName || "משתמש"}! 👋
       </h2>
     </div>
   )}
   ```
   Style matches the existing wizard's purple→pink→orange gradient theme.

4. Nothing else in the file changes (profiles row, title, spacing, etc. stay exactly as they are).
