

## Plan: Add Story Preview Carousel to Upgrade Page

### Overview
Add a swipeable carousel section above the pricing cards showing 3 "open book" story pairs. Each pair displays an illustration on one side and a styled text page on the other, giving users a preview of what they'll get.

### Step 1 — Copy illustration images to project
Copy the 3 illustration images from uploads to `src/assets/`:
- `preview-sol-mom-kitchen.jpeg` (girl in yellow dress with mom)
- `preview-soldier-hug.jpeg` (soldier kneeling hugging girl)
- `preview-mom-hug.jpeg` (mom hugging daughter in living room)

The text pages will be rendered as styled HTML (not images), matching the dark purple theme shown in the screenshots.

### Step 2 — Create `StoryPreviewCarousel` component
New file: `src/components/paywall/StoryPreviewCarousel.tsx`

- Uses the existing `Carousel` components from `src/components/ui/carousel.tsx`
- Title: "הציצו לתוך הסיפור ✨"
- 3 slides, each showing a "book spread" with:
  - Right side (RTL): illustration image (object-cover, rounded)
  - Left side (RTL): dark purple text page with Hebrew text, matching the app's night-sky theme
- Book-like styling: rounded-xl container with subtle border and shadow matching the purple theme
- `CarouselDots` indicator below
- Auto-advances every 5 seconds (optional embla autoplay)
- Responsive: side-by-side on tablet+, stacked or slightly smaller on mobile

Text content for each pair (rendered, not images):
1. "זאת סול.\nסול בת ארבע.\nהיא יושבת על השטיח.\nהשטיח רך.\nריח מתוק באוויר.\nאמא אופה ופלים."
2. "אבא תמיד חוזר.\nאבא אוהב אותה.\nהאהבה גדולה.\nהיא בלב של סול."
3. "כשעצוב, הם מתחבקים.\nחיבוק גדול וחם.\nהרבה אהבה בחיבוק.\nהלב של סול שמח."

### Step 3 — Insert carousel into Upgrade.tsx
Add the `StoryPreviewCarousel` component between the "Credit Badge" section (line 319) and the "Limited-time offer badge" (line 322). Import the new component at the top.

```tsx
<StoryPreviewCarousel />
```

### Files modified
1. `src/assets/preview-sol-mom-kitchen.jpeg` — new image asset
2. `src/assets/preview-soldier-hug.jpeg` — new image asset
3. `src/assets/preview-mom-hug.jpeg` — new image asset
4. `src/components/paywall/StoryPreviewCarousel.tsx` — new carousel component
5. `src/pages/Upgrade.tsx` — import and render the carousel

