**Goal:** Revert `src/pages/Upgrade.tsx` to the exact state it was in on April 12th (commit `c6245cee`), matching how `PayPalButton.tsx` was previously reverted.

**Approach:**
1. Extract `src/pages/Upgrade.tsx` from git commit `c6245cee` (April 12) into a temp file.
2. Copy the temp file over the current `src/pages/Upgrade.tsx`, overwriting it completely.
3. Do not touch any other file.

**Verification:** Read the restored file to confirm it has 744 lines (same as the April 12 version).