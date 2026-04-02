

## Plan: Add "סגור ↑" Collapse Button to About Page

### Change — `src/pages/About.tsx` only

Insert a "סגור ↑" button at the bottom of the expanded content block, just before the closing `</div>` on line 205. On click, it sets `showMore` to `false` and scrolls to the top of the page via `window.scrollTo({ top: 0, behavior: 'smooth' })`.

**Insert after line 204 (after the last feature card's closing `</div>`):**
```tsx
<button
  onClick={() => {
    setShowMore(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }}
  className="text-sm text-purple-300/80 hover:text-purple-200 underline underline-offset-4 mt-6 transition-colors"
>
  סגור ↑
</button>
```

Same styling as the existing "קרא עוד ↓" link. No other files modified.

