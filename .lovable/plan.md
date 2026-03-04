

## Plan: Split Each Story Page into Illustration + Text Pages

### What Changes
For **all ages** (removing the toddler-only merge logic), each DB story page will be split into **two virtual pages**:
1. **Illustration page** — fullscreen image, no text at all
2. **Text page** — text on a soft pastel gradient background, no illustration

### Files to Change

#### 1. `src/pages/StoryViewer.tsx`
- **Virtual pages builder** (lines 799-824): Change the `useMemo` to always split each DB page into 2 virtual pages — one `type: 'illustration'` and one `type: 'text'`. Remove the toddler merging logic entirely.
  ```ts
  type VirtualPage = {
    type: 'illustration' | 'text';
    dbPage: StoryPage;
    illustrationUrl: string | null;
    illustrationPrompt: string | null;
    text: string;
  };
  ```
  For each DB page, push two entries: first the illustration page (with `type: 'illustration'`), then the text page (with `type: 'text'`).

- **Rendering logic** (lines 1073-1149): Update the `currentVirtual` content page rendering to check `currentVirtual.type`:
  - `'illustration'`: Show fullscreen image (or generating skeleton / topic placeholder) with **no text overlay at all** — remove the entire bottom text section.
  - `'text'`: Show the pastel gradient background (using existing `getTopicTheme`) with centered text in dark color, no illustration behind it. Keep the existing frosted-glass text styling.

- **Page counter**: Adjust the page counter display — since virtual pages are now doubled, show something like `Math.ceil((currentPage + 1) / 2) / DB pages count` or simply the raw virtual page number.

- **Edit/nikud actions**: The `page` reference for editing should still map to the correct `dbPage` regardless of whether user is on the illustration or text virtual page.

#### 2. `src/pages/PublicStoryViewer.tsx`
- Apply the same split logic to the `virtualPages` `useMemo` (lines 79-102): remove toddler merging, always split into illustration + text pairs.
- Update the rendering section (lines 216-258): same two-mode rendering as StoryViewer.
- Update `VirtualPage` interface to include a `type` field.

### No other files need changes.

