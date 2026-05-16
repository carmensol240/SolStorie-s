## Goal

Replace the demo story viewer in `src/pages/DemoStory.tsx` with a video player using the uploaded MP4, and add a WhatsApp share button below it. Keep the existing header and the "צרו את הסיפור שלכם ✨" CTA intact.

## Changes

1. **Copy the uploaded video** `user-uploads://סרטון_לדוגמא.mp4` to `src/assets/demo-story-video.mp4` so it can be imported and bundled.

2. **Rewrite `src/pages/DemoStory.tsx`**:
   - Remove all story-fetching logic: `useState`/`useEffect` for `story`/`loading`/`error`, the `supabase.rpc("get_public_story")` call, `tryFetch`, `DEMO_SLUG`/`DEMO_UUID` constants, `DemoPage`/`DemoStoryData` interfaces, pagination state (`currentPage`, `goPrev`, `goNext`), swipe handlers, and the prev/next chevron buttons.
   - Remove imports no longer used: `useState`, `useEffect`, `Loader2`, `ChevronLeft`, `ChevronRight`, `BookFrame`, `BookPage`, `supabase`, `getPublicIllustrationUrl`, `useSwipe`, `cn`.
   - Add a `<video>` element with `controls`, `playsInline`, `preload="metadata"`, centered with `max-w-3xl mx-auto w-full`, `rounded-2xl overflow-hidden shadow-xl border border-white/40`, `aspect-video` for responsive sizing, importing the video via `import demoVideo from "@/assets/demo-story-video.mp4"`.
   - Keep the existing header exactly as is (back button + "סיפור לדוגמה" badge).
   - Below the video, add a WhatsApp share button styled to match the existing rounded gradient buttons in the file. It opens `https://wa.me/?text=<encoded>` in a new tab with the exact prefilled text: `ראו איך יצרתי סיפור מותאם אישית לילד שלי עם SolStorie's ✨ סיפור ראשון חינם! soulstory.co.il`. Use the `MessageCircle` icon from `lucide-react` (since `WhatsApp` isn't in lucide) with green gradient colors to differentiate from the primary CTA.
   - Keep the existing "צרו את הסיפור שלכם ✨" CTA button below the WhatsApp button, unchanged.

## Out of scope

- No changes to routing, the header, the bottom CTA, or any other file.
- No changes to the `get_public_story` RPC or demo DB data.

