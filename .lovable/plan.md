## Alternate Two Cast Images Across Demo Story Pages

### Goal
Make the 6 demo story pages visually varied by alternating the 2 available cast images from the public `topic-images` Supabase bucket.

### Scope
Only `src/data/demo-story.ts` will be modified. No other files touched (DemoStory.tsx, AuthStep, routing all unchanged).

### Available Bucket Images
- `sol-superhero-book-og.png` — Sol (single hero)
- `cast-group-forest.png` — Group of friends in the forest

Public URL base: `https://qvdwmkxviaqcgmjotsxe.supabase.co/storage/v1/object/public/topic-images/`

### Alternation Pattern (6 pages)
| Page | Image | Reason |
|------|-------|--------|
| 1 | Sol | Story opens with hero alone |
| 2 | Group | Friends appear |
| 3 | Sol | Focus back on hero |
| 4 | Group | All friends together |
| 5 | Group | Group climax in forest |
| 6 | Sol | Hero closes the story |

### Implementation
1. Remove the 6 local `@/assets/cast-*` imports.
2. Define two constants with the public Supabase URLs.
3. Update each page's `illustrationUrl` per the table above.
4. Page text stays exactly as it is.