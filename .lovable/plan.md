# Fix: story creation jumps back to the child's details

## What causes it

The waiting screen is part of the story creation page, and everything you typed is kept only in that page's memory. Anything that reloads the page, or sends you away and back, wipes it, and you start again at the child's details. There are two separate causes:

### Cause A: on the live site too, the whole page reloads itself (confirmed in the live site's code)
The site has an "auto-update" mechanism. Every 30 seconds, and **every time you come back to the tab**, it checks whether a new version was published. If one was, it reloads the page immediately, even in the middle of creating a story. A second mechanism (the offline-support service) also reloads the page when it gets updated. I found both in the code currently running on soulstory.co.il, not just in the new version. After the reload the page starts from scratch: step 1 with an empty form. That explains why you saw it on the live site, especially after a publish or after switching tabs. Meanwhile the story keeps being created on the server and does get saved, but you never reach it.

### Cause B: only in the new version, the new sign-up guard
The guard says "if there's no user, go to sign-up" and runs on every sign-in change, including during the wait. A momentary "signed out" during a sign-in refresh (when you return to the tab, or the refresh the waiting screen forces) sends you to the sign-up screen. That screen returns you straight to the story page, at step 1. The waiting screen's "please sign in again" route also returns without the resume mark, so the saved form copy isn't restored either.

- Suspect 2 (an effect that resets the form when the user changes): not the cause.
- Suspect 3 (old numbering, step 5): just an internal label, not the cause.
- Suspect 4 (resume): works, but never runs, because the return address loses the resume mark.

The old sign-up step (and the wait-for-sign-in-after-sign-up flag) doesn't reset the page by itself. The main cause on the live site is the auto-reload.

## The fix (story creation only)

1. **No automatic reloads during creation.** While a story is being created (and on the story creation page in general), the auto-update and the offline-support service don't reload. The update waits until you leave the page or the story is ready.
2. **Sign-up guard only at entry:** only after loading has finished, there's definitely no user, and no creation in progress. A sign-in refresh with the same user doesn't change the user, and a momentary empty state isn't treated as a sign-out.
3. **Saving and resuming:** when the wait starts, the form (with the photo link, not the file) and an "in progress" mark with a time are saved for this user. Every route back during creation returns with the resume mark.
4. **Safety net (your point 2):** when the story creation page opens without a form and the user has a story created in the last 15 minutes, show "הסיפור שלך מוכן" with a button to the story. If a creation is still running, show "הסיפור עדיין נוצר…" and keep checking until it's ready, with a button to the library. The child's details aren't shown in either case.
5. **Cleanup (your point 3):** the saved form and the "in progress" mark are deleted the moment the story is created successfully, and also when the user taps to start a new story (and on sign-out).
6. **No second creation, no second charge (your point 4):**
   - Resuming never starts a new creation if there's an "in progress" mark from the last 15 minutes. It only waits for the existing story.
   - Server-side protection too: every creation gets a one-time ID. If the same ID arrives again (for example from a refresh), the server returns the existing story and doesn't charge again. This needs one new field on stories (the request ID, unique per user).
   - An automated test: the same ID sent twice gives one story and one charge, and resuming with an "in progress" mark doesn't call creation again.
7. No change to payments, prices, Grow, the form fields, the story text or the pictures.

## Testing

- Reproduce both causes first (a fake new version mid-wait, and a momentary sign-out), and confirm the jump before the fix and that it stays after.
- Full creation signed in as your test account: wait several minutes, switch to another tab and back, simulate a version update mid-wait, confirm the story opens and exactly one credit was charged.
- Open the story creation page right after creation, and during creation: the "ready" / "still being created" screen appears, not the child's details.
- A signed-out visitor still goes to the sign-up screen; a signed-in one goes straight in.
- Note: each test creation costs one credit on the test account.

## Technical details

- `src/main.tsx`: the deploy-poll `check()` and SW `onNeedRefresh`/activated reload are skipped when `sessionStorage.story_generation_in_progress` is set or the path is `/create`; deferred and run on the next route change.
- `src/hooks/use-auth.ts`: `TOKEN_REFRESHED` with the same `user.id` keeps the user object; `user = null` only on `SIGNED_OUT`.
- `src/pages/CreateStory.tsx`: guard gated by `!loading`, a `hasConfirmedUser` ref, `step !== 5`; on `startGeneration` save `pending_story_formData` + `story_generation_in_progress {requestId, startedAt}` (user-scoped); safety net checks the in-progress mark / `stories` where `user_id` and `created_at > now-15m`; clear on success / "new story" / sign-out.
- `src/components/wizard/GeneratingStep.tsx`: sends `client_request_id`; on resume with a live mark, polls `stories` by request id instead of calling generate; the 401 path returns with `/create?resume=true`.
- Migration: `stories.client_request_id text` + unique index `(user_id, client_request_id)`; `generate-story` returns the existing story without deducting when it already exists (in the request-text step, before the AI call).
- Tests: vitest for the resume decision; Deno test for idempotency in `generate-story`.
