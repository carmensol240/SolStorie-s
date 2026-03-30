

## Plan: Add No-Text Rule to Coloring Page Prompt

### Change — `supabase/functions/generate-coloring-page/index.ts` line 73

Replace:
```
Output ONLY the coloring page image, nothing else.`,
```

With:
```
Output ONLY the coloring page image, nothing else. Do not include any text, labels, letter names, or written words anywhere in the image.`,
```

Single line edit. No other files or logic touched.

