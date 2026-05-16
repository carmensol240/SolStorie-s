The greeting itself in `ChildInfoStep.tsx` (line 488) is just text + 👋 — no icon there. The "pink person icon" the user sees right above the greeting is rendered by the parent wizard header in `src/pages/CreateStory.tsx` (lines 215–219): a gradient pink/purple/orange square containing a `<User>` lucide icon, shown only on step 1.

## Change

In `src/pages/CreateStory.tsx`, remove the step-1 User icon block:

```tsx
{step === 1 && (
  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center shadow-md">
    <User className="w-4 h-4 text-white" />
  </div>
)}
```

Also drop the now-unused `User` import from `lucide-react` in that file.

Nothing else changes — greeting text, 👋, layout, and other steps stay as-is.