

## Plan: Guest Landing Screen for Library Page

### Problem
When an unauthenticated user taps "ספרייה" in the bottom nav, they see an empty white page with the logged-in library header and empty state — confusing and unappealing.

### Solution
Add an early return in `Library.tsx` for unauthenticated users that renders an engaging Pixar-style guest screen encouraging registration.

### Single Change: `src/pages/Library.tsx`

**Add a guest screen** right after the auth loading check (~line 478), before the main library content. When `!user && !authLoading`:

- Full-height screen with the night-sky gradient matching the library header (`#1a0f3a` → `#2d1a6e`)
- Hero image using existing `library-child-reading.jpeg` asset (child reading on tablet)
- Headline: "✨ הספרייה הקסומה מחכה לכם!"
- Subtitle: "צרו סיפורים מותאמים אישית עם הילד שלכם כגיבור — ושמרו אותם בספרייה האישית שלכם לתמיד"
- Three feature pills (icons + text):
  - 📚 "ספרייה אישית לכל המשפחה"
  - 🎨 "סיפורים בסגנון Pixar עם תמונת הילד"
  - 📥 "הורדה לקריאה אופליין בכל זמן"
- CTA button: "הירשמו חינם והתחילו!" → navigates to `/auth`
- Secondary link: "יש לכם חשבון? התחברו" → also `/auth`
- `MobileNavigation` at bottom

No new files, no database changes. Just an early return block in the existing `Library.tsx`.

