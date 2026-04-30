## Replace signup section with single "Create story" CTA on /library (logged-out)

**Scope:** `src/pages/Library.tsx`, lines ~608–626 (the not-logged-in landing block).

### Change

Replace both buttons:
- Primary: `הירשמו חינם והתחילו! 🚀` → `/auth`
- Secondary link: `יש לכם חשבון? התחברו` → `/auth`

with a single button:

```tsx
<button
  onClick={() => navigate("/create")}
  className="w-full max-w-xs py-3.5 rounded-full font-black text-base text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center"
  style={{
    background: 'linear-gradient(135deg, #ec4899, #a855f7, #6366f1)',
    boxShadow: '0 8px 30px -8px rgba(168,85,247,0.5)',
  }}
>
  צרו את הסיפור הראשון שלכם ✨
</button>
```

The secondary "יש לכם חשבון? התחברו" link is removed entirely. No other UI (hero image, headline, subtitle, feature pills, MobileNavigation) changes. No other files are touched.

### Notes

- `/create` is a public route in `App.tsx` (not wrapped by `RequireTerms`), so unauthenticated users can navigate there. The CreateStory wizard already gates auth at its own internal step, per the existing flow.
- Keeps the same gradient styling for visual consistency.