# Fix: story creation jumps back to the child's details

## What causes it (from reading the code)

The waiting screen is part of the story creation page, and everything you typed is kept only in that page's memory. Anything that sends you away from the page and back wipes it, and you start again at the child's details.

The new sign-up guard on the story creation page does exactly that. It says "if there is no signed-in user, go to the sign-up screen". It runs every time the sign-in state changes, including during the wait. Not only when the page first opens.

- **Suspect 1 — confirmed in the code.** The sign-in tracker sets "user = nobody" on every change it hears about. That includes the brief "signed out" moment when a sign-in refresh fails or races. Refreshes happen when you return to the tab, and the waiting screen also forces one before writing the story. If that moment hits mid-wait, the guard sends you to the sign-up screen. The sign-up screen sees you're actually still signed in, so it returns you straight to the story page. You land on step 1 with an empty form. Seen from the outside, it looks like "jumped back to the child's details".
- **The return address loses "resume".** The guard (and the waiting screen's "please sign in" path for an expired session) returns to the plain story page. The resume mark is dropped, so even the form copy the waiting screen saved isn't restored.
- **Suspect 2 — not the cause.** No effect resets the step or the form when the user changes. Updating "terms accepted" doesn't touch this page.
- **Suspect 3 — not the cause.** The wait is internally "step 5", while the counter shows 4 steps. That's only a label. Nothing sends anyone to step 1 after creation; on success you go to the story.
- **Suspect 4 — partly.** The resume path itself works (it restores the form and goes back to the wait). It just never runs here, because the return address loses the resume mark.

How sure: this comes from reading the code, not from catching it live. The first test step below reproduces it (a short "signed out" moment during the wait) to confirm before fixing.

## The fix (story creation only)

1. **Sign-up guard runs only once, at page entry:** only after loading has finished and there is definitely no user. Once the user is confirmed, or the wait has started, a brief "signed out" moment can never send them away.
2. **The sign-in tracker ignores token-refresh noise:** a refresh with the same user doesn't replace the user. A momentary empty state during a refresh isn't treated as "signed out" unless an actual sign-out happens.
3. **The form and step survive any return:** the form is saved for the session (without the photo file itself, only the saved photo link) when the wait starts. Every route back to the story page during creation (expired session, "please sign in") returns with the resume mark, so you go back to the wait and not to step 1.
4. No change to payments, prices, Grow, the form fields, the story text or the pictures.

## Testing

- Reproduce first: simulate a brief "signed out" during the wait, confirm it jumps to step 1 before the fix and stays after.
- Full creation signed in as your test account: start to finish, wait several minutes, switch to another tab and back mid-wait, then confirm the story opens.
- A signed-out visitor still goes to the sign-up screen; a signed-in one goes straight in.
- An automated test for the rule "a refresh with the same user doesn't send to sign-up".

## Technical details

- `src/pages/CreateStory.tsx`: guard effect (lines ~178-182) gated by a `hasConfirmedUser` ref and `step !== 5`; persist `formData` to `pending_story_formData` on `startGeneration`; resume path reused.
- `src/hooks/use-auth.ts`: in `onAuthStateChange`, skip `setUser` when `TOKEN_REFRESHED` keeps the same `user.id`; only null the user on an explicit `SIGNED_OUT`.
- `src/components/wizard/GeneratingStep.tsx`: the 401 path's `returnTo` becomes `/create?resume=true` (and persists formData like `handleSessionExpired`).
- Note: one creation costs a credit; the test will use your test account.
