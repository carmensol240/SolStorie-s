

## Fix Story Page Layout for Pages Without Illustrations

### Problem
Pages without generated illustrations show a broken image placeholder or a "generate" button, which looks unprofessional. Since images are now generated for every two pages, half the pages will have no illustration.

### Solution

**File: `src/pages/StoryViewer.tsx` (lines 1079-1173)**

Update the single page layout to conditionally render based on whether the page has an illustration:

1. **Pages WITH illustration** -- Keep the current vertical layout: illustration at top (max 40vh), scrollable text below.

2. **Pages WITHOUT illustration** -- Skip the illustration container entirely. Expand the text to fill the full page height with:
   - A subtle paper-texture background (`bg-[#FFFBF5]`) with a decorative top border (gradient line)
   - Full rounded corners on the text container
   - Centered text with generous padding
   - Same font size, line-height (2.2), and nikud support

3. **Remove** the `MissingIllustrationPrompt` and shimmer loading for regular story pages (keep it only on the cover page where it makes sense).

### Technical Details

In the story page render section (~line 1079-1173), replace the current layout with a conditional:

```
if page.illustration_url exists:
  render illustration (40vh) + text below (flex-1 scrollable)
else:
  render full-height text-only page with decorative border at top
```

The text-only page will have:
- `h-full` flex column layout
- A thin gradient decorative line at top (purple-to-pink, matching the app theme)
- `flex-1 min-h-0 overflow-y-auto` for the text area
- Same `max-w-lg mx-auto`, same font styling, same page indicator

Navigation arrows remain in the same position regardless of page type.

**No database or backend changes needed.**
