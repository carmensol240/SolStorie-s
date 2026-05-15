# Add Dedicated WhatsApp Share Button in StoryViewer

## Goal
Add a WhatsApp-specific share button in the story reader header. Since WhatsApp's `wa.me` link cannot accept file attachments directly from the browser, the button will:
1. Generate the story PDF
2. Trigger a download of the PDF to the user's device
3. Open WhatsApp with a prefilled text message (including the public story link if available) so the user can attach the just-downloaded PDF in WhatsApp.

The existing generic share button (`handleShare` → Web Share API) stays untouched.

## Changes

### 1. `src/components/story/book-frame/BookHeader.tsx`
- Import the WhatsApp icon (use `MessageCircle` from `lucide-react`, since lucide has no official WhatsApp icon — keep visual consistency with other header icons).
- Add a new optional prop `onShareWhatsApp?: () => void`.
- Render a new tooltip button next to the existing Download PDF button:
  - aria-label: `שיתוף בוואטסאפ`
  - tooltip text: `שלח את ה-PDF בוואטסאפ`
  - Same `min-h-[44px] min-w-[44px]` styling as other buttons.
  - Color tweak: green tint (`text-green-600 hover:bg-green-100/60`) to make WhatsApp instantly recognizable.
- Disable while `isExporting` is true.

### 2. `src/pages/StoryViewer.tsx`
- Add a new handler `handleShareWhatsApp`:
  ```text
  - if !story or isExporting → return
  - toast: "מכין PDF לשיתוף בוואטסאפ..."
  - generate PDF via existing generatePdfFile(story, 'portrait')
  - trigger an automatic download of the PDF (createObjectURL + <a> click + revoke)
  - build share text:
      "📚 הסיפור של {child_name} – נוצר באהבה באפליקציית SolStories
       קישור לקריאה: {publicStoryUrl if slug exists}
       (קובץ ה-PDF מצורף)"
    Use the public slug URL `${window.location.origin}/s/{slug}` only if `story.slug` exists; otherwise omit the link line.
  - open `https://wa.me/?text={encodeURIComponent(text)}` in a new tab
  - toast info: "ה-PDF הורד! צרף אותו בצ'אט בוואטסאפ שנפתח 📎"
  - track event: trackFeatureUsed('share_whatsapp', story.id) (reuse existing analytics pattern)
  ```
- Pass `onShareWhatsApp={handleShareWhatsApp}` to `<BookHeader>` (line ~1346 area).

### 3. Memory
- After implementation, append a one-line core memory note that StoryViewer header has a WhatsApp share that downloads PDF + opens wa.me text (since attaching files to wa.me is not possible from browser).

## Out of Scope
- No changes to the existing `handleShare` (native Web Share API) button.
- No changes to layout, BookFrame, or any other reader UI.
- No backend changes.

## Technical Notes
- WhatsApp Web/App cannot receive file attachments via URL parameters — this is a platform limitation. The download-then-open-chat flow is the standard workaround.
- On mobile devices that support `navigator.share` with files (iOS/Android Chrome), the existing generic share button is the better path; this new button is explicitly for users who want the WhatsApp-only flow (e.g. desktop users).
