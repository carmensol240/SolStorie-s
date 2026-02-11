

## Final Brand Casing Refinement

### Single Change Required

**File: `src/hooks/use-pdf-export.ts` (line 63)**

Update the domain casing in the PDF watermark:
- **Current**: `"SoulStory™ – כרמית כהן | סיפורים עם נשמה | © 2026 | www.soulstory.co.il"`
- **New**: `"SoulStory™ – כרמית כהן | סיפורים עם נשמה | © 2026 | www.SoulStory.co.il"`

Only the URL changes from lowercase `soulstory` to CamelCase `SoulStory` to match the brand identity.

### Already Correct (No Changes Needed)

| Item | Status |
|------|--------|
| "SoulStory™" CamelCase in all headers, logos, toasts | Correct across all 18 files |
| index.html title and OG tags | Correct |
| PWA manifest | Correct |
| Profile attributions | Correct |
| Legal pages (Privacy, Terms) | Correct |
| Child profile frames 160px+ with object-cover | Correct |
| Sparkly toolkit box below header | Correct |

