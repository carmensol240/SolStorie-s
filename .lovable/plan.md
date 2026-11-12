# Two stuck stories after the short-instruction release - findings and fix

## 1. Exact cause
Not out of AI credits: the AI service shows no failed calls since 08:55 (no 402/429). Nothing crashed in short-prompt, detectRequestedOutfit or the new clothes check either.

The real chain (Ari's story, generate-illustrations log):

```text
09:21:01 [ref-wait] page-1 illustration ready after 29 check(s)      <- each page first waited ~90 s for page 1
09:21:22-29 [IMG-GEN-RESULT] page=2..8 success=true                  <- all 7 pages WERE drawn
09:21:24 [Page 1] second picture failed check (not 3D Pixar ... painterly watercolor)
09:21:30-39 [IDENTITY-CHECK] page=2..8 MISMATCH - different style, render style
           (Image B is 3D CGI while Image A is watercolor illustration); redrawing (max 2)
09:21:44 shutdown                                                    <- the run hit its time limit mid-redraw
```

Three things combined:
- **A bug in the new code:** in short mode the drawing correctly leaves out page 1, but the check after drawing still compares each page to page 1 (`pageRef = coverReferenceUrl` in generate-illustrations, line ~2095, instead of the short-mode value, which is empty).
- **Page 1 came out flat watercolor (2D)** and was kept anyway (the "page 1 is never empty, keep the closest" rule). So every good 3D page "failed" for being different from page 1 and went into redraws.
- **Time limit:** each page first waits up to 120 s for page 1 (not needed in short mode), then draws (~25 s), then checks, then redraws. The run was stopped mid-redraw. Pictures are saved to the page only after the checks, so nothing was written and no log line appeared. Sol's story looks the same (its logs have already rolled off; pages 1, 5, 7 finished before the limit).

## 2. Fix (code only, does not lengthen the short instruction - locked rule 5 stays)
In `supabase/functions/generate-illustrations/index.ts`:
- In short mode, the check after drawing is against the **avatar** only (style, face, clothes, text, flags, shape) - never against page 1.
- In short mode, pages do not wait for page 1 (no `waitForPageOneIllustration`), since page 1 is not sent.
- Safety net for time: if the run is close to its time limit, save the best picture that passed the 3D check instead of starting another redraw (alert the admin if it is a look failure only). A 2D picture is never saved.
- Make the first drawing of page 1 in short mode strict on 3D: a watercolor/2D picture is not kept as "closest" while a 3D try exists.

Tests (`short-prompt_test.ts` / new small test): short mode -> check picture = avatar, no page-1 reference, no page-1 wait. No locked test is weakened. Update the AGENTS.md rule.

## 3. Completing the two stories (no charge, no redraw of finished pages)
After the fix is live, an admin run of generate-illustrations per missing page only (single page, `firstDrawing:true`, no charge):
- Ari (1258dee1): pages 2-8.
- Sol (c4532152): pages 2, 3, 4, 6, 8, 9, 10, 11, 12 (all pages with no picture; pages 1, 5, 7 stay).
- Then the story moves to ready by itself.

**Needs your decision:** Ari's page 1 is a flat watercolor picture, which breaks locked rule 4 (always 3D). Redrawing it changes a customer story, so I will only do it if you approve. I also need to look at Sol's page 1 (not checked yet).

## 4. Cost
- Build: about 2-4 credits.
- Completion: about 16 drawings + checks, roughly $0.8-1.6 in AI usage (plus 1 more if you approve Ari's page 1).
