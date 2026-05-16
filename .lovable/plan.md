## Landing page tagline update

In `src/pages/Adventure.tsx` (bottom CTA section, lines ~167–181):

1. Remove the existing paragraph:
   `<p className="text-white/90 text-xs font-bold drop-shadow-md">הסיפור הראשון שלכם במתנה 🎁</p>`

2. Add a new tagline directly above the CTA button (after `<WelcomeGiftBanner ... />`), matching existing typography style:
   ```tsx
   <p className="text-white text-sm font-bold drop-shadow-md text-center">
     ✨ סיפורים מותאמים אישית עם הילד שלך כגיבור ⭐
   </p>
   ```

Nothing else changes — spinning coin, CTA button, background image, welcome banner, header, and navigation remain untouched.