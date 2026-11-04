# Shorter, clearer homepage on mobile

The page is about 4,420px tall on a 390px phone today, roughly 5.2 screens. The goal is about half that. Prices, payments and sign-up stay exactly as they are.

## Changes

1. **Hero video buttons**: "🔊 הפעילו את השיר" / "השתקה" and the pause button move out of the video and sit in a centered row right below it. Both stay at least 48px tall and keep their current accessibility labels. The video still starts muted and plays automatically, and reduced-motion behaviour doesn't change.
2. **Dead space under the main button**: the extra bottom gap under "יוצאים להרפתקה ✨" goes. I'll keep only what's needed so the bottom menu doesn't cover content at the very end of the page. The "גללו לגלות עוד" arrow will point to the next section.
3. **Remove** the "כל ילד ראוי לסיפור משלו" block.
4. **"איך זה עובד"**: one compact row of 3 small steps, each an icon plus a short label: "מספרים על הילד", "בוחרים נושא", "מקבלים ספר". The long explanations go.
5. **"הכירו את החבורה"**: one horizontal row you swipe sideways, with small round character pictures and names, instead of the tall grid.
6. **Topics**: the title becomes "מעל 100 נושאים", with one sideways-scrolling row of small topic chips (text only) about 12 everyday topics long. It replaces the 4 big picture cards.
7. **Remove** the "מה מקבלים" section.
8. **Full-story price card** (homepage only): instead of repeating the whole digital list, it shows one line: "כל מה שבדיגיטלי + ספר להדפסה". The price, badge and the digital card don't change. The product details used for payment aren't touched.

Desktop gets the same sections. The step row and the chip rows simply have more room there.

## Checking
I'll take screenshots of the full homepage at 390px and 1366px, plus a close-up of the buttons under the video, and tell you the new page height on mobile. Nothing gets published until you approve.

## Technical details
- `src/pages/Adventure.tsx`: move the sound/pause controls out of the absolute overlay into a flex row after the video container. Reduce the CTA wrapper bottom padding (the 76px safe-area pad is no longer needed because HomeExplainer follows). The scroll hint targets `home-how`.
- `src/components/home/HomeExplainer.tsx`: delete the `home-what` and `home-included` sections and the INCLUDED constant. STEPS becomes compact `grid-cols-3`. The cast and topic lists become `flex overflow-x-auto snap-x` rows. Add a TOPIC_CHIPS list. For `k === "full"`, render the single summary line instead of `p.includes`. Reduce the section spacing.
- Don't change `supabase/functions/_shared/catalog.ts`, so the price tests and purchase flow stay the same.
