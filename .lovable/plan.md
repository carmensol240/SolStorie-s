

## Plan: Fix PWA Install Prompt on Story Completion

### Problem
Two issues prevent the install prompt from showing:
1. The browser's `beforeinstallprompt` event fires early on page load, but the component only listens for it once `justCreatedFirstStory` becomes true (at the end of the story). By then the event was already fired and missed.
2. A 30-second delay timer starts only when the user reaches the last page — unnecessary friction on the completion screen.

### Solution

#### 1. `src/components/story/InstallAppPrompt.tsx`
- **Always** listen for `beforeinstallprompt` on mount (separate `useEffect`), storing the deferred prompt regardless of story state.
- Remove the 30-second timer — show the dialog immediately when `justCreatedFirstStory` becomes true.
- Keep existing checks: skip if already seen (`localStorage`), skip if already installed (standalone mode).
- Keep iOS detection and instructions unchanged.

#### 2. No changes needed to `src/pages/StoryViewer.tsx`
The prop logic `justCreatedStory && (isClosingPage || isEndPage)` is correct — it gates display to the completion screen only.

### Technical details
- Split into two `useEffect` hooks: one for capturing `beforeinstallprompt` (runs once on mount), one for showing the dialog when `justCreatedFirstStory` flips to `true`.
- iOS path remains unchanged (shows manual instructions).
- Android/desktop path uses the captured deferred prompt for native install.

### Files modified
1. `src/components/story/InstallAppPrompt.tsx`

