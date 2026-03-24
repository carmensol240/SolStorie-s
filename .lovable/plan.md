

## Plan: Separate Illustrations and Text into Distinct Pages

### What changes

Rewrite the `virtualPages` mapping logic (lines 1027-1077) for ages 3+ so that DB pages are split into a fixed pattern: **illustration-only pages** and **text-only pages**, never mixed.

### Pattern

```text
Cover (index -1) → illustration (from cover logic, unchanged)
Then for each DB page that has an illustration:
  → Virtual page: illustration-only (full screen, no text)
  → Virtual page: text-only (dark starry background)
For DB pages without illustration:
  → Virtual page: text-only
```

This naturally produces the requested rhythm: illustration → text → text → illustration → text → text... because typically every other DB page has an illustration.

### Single change location

**File: `src/pages/StoryViewer.tsx`, lines 1047-1073** (the `else` branch for ages 3+)

Replace the current logic that creates either `illustration` (with text overlay) or `text` pages with:

```typescript
for (const page of story.pages) {
  const hasText = page.text && page.text.trim().length > 0;
  const hasIllustration = !!page.illustration_url;
  const isCoverIllust = coverIllustration && page.id === coverIllustration.id;

  // Illustration page — full screen, NO text
  if (hasIllustration && !isCoverIllust) {
    result.push({
      type: 'illustration',
      dbPage: page,
      illustrationUrl: page.illustration_url,
      illustrationPrompt: page.illustration_prompt || null,
      text: '', // empty — no text on illustration pages
    });
  }

  // Text page — always separate
  if (hasText) {
    result.push({
      type: 'text',
      dbPage: page,
      illustrationUrl: null,
      illustrationPrompt: null,
      text: page.text,
    });
  }
}
```

Then in the **rendering section** (line ~1443-1574), simplify the `illustration` type branch to always show fullscreen illustration without any text overlay — remove the short/long text branching entirely, show only the image with page number.

### What stays the same
- Cover page, dedication, closing page, end/feedback page — unchanged
- Toddler (0-2) combined layout — unchanged
- Text-only page rendering (starry background) — unchanged
- Navigation, audio, series logic, all other components — unchanged

