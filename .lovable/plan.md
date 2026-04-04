

## Plan: Redesign Install App Popup with Platform-Specific Instructions

### What changes
**Only one file:** `src/components/story/InstallAppPrompt.tsx`

### New design
Replace the current conditional iOS/Android/fallback layout with a single clean popup that shows **both** platform instructions always:

**Header** — gradient background (purple→pink→orange), title "📲 התקינו את האפליקציה!", subtitle "גישה מהירה מהמסך הבית שלכם"

**Body** — two instruction cards stacked:
1. **אייפון** card: "פתחי ב-Safari, לחצי על 📤 ואז ״הוסף למסך הבית״"
2. **אנדרואיד** card: "לחצי על ⋮ בדפדפן ואז ״הוסף למסך הבית״"

Each card has a subtle purple-50 background, rounded corners, and platform emoji/icon.

**Close** — X button in top-right corner of the dialog. Remove the "אולי אחר כך" text button.

### Dismiss logic
- Keep existing `localStorage.getItem(STORAGE_KEY)` check — once dismissed, never show again
- Set `STORAGE_KEY` on close (already done)
- If Android `beforeinstallprompt` is available, still show a native install button below the instructions

### What stays the same
- The `justCreatedFirstStory` trigger
- The standalone detection (don't show if already installed)
- The `beforeinstallprompt` capture for Android native install
- The `STORAGE_KEY = "install_prompt_seen"` localStorage key
- No other files are modified

