In `src/pages/StoryViewer.tsx` the demo limit is gated by **DB page number** (`DEMO_PAGE_LIMIT = 4` on `dbPage.page_number`), which allows ~8 virtual pages (each DB page renders as illustration + text). The user wants the demo to expose exactly 4 visible pages: cover (illustration), text, text, illustration — then trigger `DemoLockModal`.

**Change:** switch the demo lock to count **virtual pages** instead of DB pages, capped at 4.

```ts
// Demo paywall: limit demo users to the first 4 virtual pages (cover + ~2 text + 1 illustration)
const DEMO_VIRTUAL_PAGE_LIMIT = 4;
const isLockedVirtualPage = (index: number) => {
  if (!isDemoUser) return false;
  if (index < 0 || index >= virtualPages.length) return false;
  return index >= DEMO_VIRTUAL_PAGE_LIMIT;
};
```

Effect: virtual indices 0–3 free (cover ill1, text1, ill2, text2); navigating to index 4 opens the demo paywall. All other behavior — toddler-mode combined pages, forward-nav guard, `setDemoPaywallOpen(true)` trigger — stays as-is.

Note: virtual pages alternate illustration/text for ages 3+. The 4-page allowance matches the user's "cover + 2 text + 1 illustration" count even though the actual visual order is illustration-first.

No other file changes.