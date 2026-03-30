

## Plan: Remove Topic Text Truncation on Story Book Cards

### Analysis
The story book cards in the library (`src/components/ui/story-book-card.tsx`) show the topic with `line-clamp-1` on line 203, which truncates long topic text to a single line.

### Change — `src/components/ui/story-book-card.tsx` line 203

Replace `line-clamp-1` with no clamp, allowing the text to wrap:

```tsx
// Before
<p className="text-white/75 text-xs mt-0.5 line-clamp-1 drop-shadow-sm">{topic}</p>

// After
<p className="text-white/75 text-xs mt-0.5 drop-shadow-sm">{topic}</p>
```

Single line change. No other files or logic touched.

