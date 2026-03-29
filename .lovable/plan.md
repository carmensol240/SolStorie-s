

## Plan: Replace Letter Topic Images with SVG Placeholders

### Summary
Add a `letterImage` helper function and replace the `image` field on all 22 letter topics (א–ת) with colored SVG data URIs. Number topics and all other sections remain untouched.

### Technical Details

**1. Add helper function** (after imports, before `CHARACTER_SECTIONS`):
```typescript
const letterImage = (letter: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" style="background:${color}"><text x="50%" y="55%" font-size="200" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`)}`;
```

**2. Replace `image` on each letter topic** — cycling through 8 colors:

| Letter | Color | Hex |
|--------|-------|-----|
| א | purple | #8B5CF6 |
| ב | pink | #EC4899 |
| ג | amber | #F59E0B |
| ד | teal | #14B8A6 |
| ה | orange | #F97316 |
| ו | blue | #3B82F6 |
| ז | green | #22C55E |
| ח | red | #EF4444 |
| ט | purple | #8B5CF6 |
| י | pink | #EC4899 |
| כ | amber | #F59E0B |
| ל | teal | #14B8A6 |
| מ | orange | #F97316 |
| נ | blue | #3B82F6 |
| ס | green | #22C55E |
| ע | red | #EF4444 |
| פ | purple | #8B5CF6 |
| צ | pink | #EC4899 |
| ק | amber | #F59E0B |
| ר | teal | #14B8A6 |
| ש | orange | #F97316 |
| ת | blue | #3B82F6 |

**3. File changed:** `src/components/wizard/topic-data.ts` only. No other files touched.

