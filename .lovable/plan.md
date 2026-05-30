## Goal

When a user finishes viewing a story for the first time (reaches the last page), show a friendly prompt:

> שתפו את הסיפור שלכם בוואטסאפ עם האנשים שאתם אוהבים 💛

with a single WhatsApp share button. Shown once per story per device.

## Where

`src/pages/StoryViewer.tsx` — the completion moment already exists at line ~1628 where `trackStoryCompleted(story.id)` fires after `newPage >= maxPage`. The existing `handleShareWhatsApp` (line 1128) already builds the correct WhatsApp URL using the story's public slug and a Hebrew message, so the banner button will simply call it.

## Behavior

- On reaching the last page for the first time per story:
  - Check `localStorage` key `whatsapp_share_prompt_shown_{storyId}`.
  - If not set, open a bottom sheet / centered modal banner with:
    - Text: "שתפו את הסיפור שלכם בוואטסאפ עם האנשים שאתם אוהבים 💛"
    - Primary button: "שתפו בוואטסאפ" (green WhatsApp style) → calls `handleShareWhatsApp()` then closes.
    - Small close (X) button → closes and marks as shown.
  - In both cases set the localStorage flag so it does not appear again.
- Guarded so it does not show in demo mode (mirrors `guardDemo` wrapping that already exists on `handleShareWhatsApp` in the header).
- Does not appear if `story.is_demo` / locked virtual page logic blocks navigation past the preview (only fires on actual completion).

## Implementation

1. Add a new lightweight component `src/components/story/ShareCompletionBanner.tsx`:
   - Props: `open: boolean`, `onClose: () => void`, `onShare: () => void`.
   - RTL Dialog (shadcn) styled to match the dark StoryViewer theme: warm gradient card, 💛 emoji, large WhatsApp icon button (`MessageCircle` from lucide or simple WhatsApp green `#25D366` styling using semantic tokens where possible — local one-off color is acceptable since this matches WhatsApp brand).
2. In `StoryViewer.tsx`:
   - Add state: `const [shareCompletionOpen, setShareCompletionOpen] = useState(false);`
   - In the `if (newPage >= maxPage)` block (line 1628), after `trackStoryCompleted`, check the localStorage flag and `setShareCompletionOpen(true)` if not previously shown and not in demo.
   - Render `<ShareCompletionBanner open={shareCompletionOpen} onClose={...} onShare={...} />` at the bottom of the JSX tree alongside other modals.
   - On close or share, write `localStorage.setItem('whatsapp_share_prompt_shown_' + story.id, '1')`.
   - On share, call existing `handleShareWhatsApp()` then close.

## Out of scope

- No changes to analytics events, pricing, or any other modal.
- No changes to FlipbookViewer or PublicStoryViewer.
- No changes to the existing share button in the header.
