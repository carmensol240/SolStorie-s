# Story form: browser "Back" moves between steps, answers kept for the tab

Answer to the photo question: today you cannot continue past step 2 without a photo. The "continue" button needs both a photo and the photo-use consent. That stays unchanged for now, and the photo part below follows it.

## How it works today
- **Moving between steps:** the step is kept only on the screen itself. The address stays `/create` for all steps, so nothing is added to the browser history. That's why the phone's "Back" leaves the form.
- **The form's own "חזרה" button:** goes back one step. On step 1 it goes to the home page.
- **Saving answers:** answers aren't saved while you fill the form, so leaving it loses them. There are only two partial saves:
  - Before opening the sample story, 5 fields are saved for the tab: name, gender, age range, story length and language.
  - Once story creation starts, the whole form is saved so it can resume after a reload or re-login. That part works and stays as it is.
- **Saved child profiles:** when the form opens, it fills in the first saved child profile from the server. A restored draft must win over this, or it would overwrite the draft.
- **The child's photo:** a new upload is kept as image data inside the form. A saved profile brings its photo address from the server instead.

## What changes
1. **Each step gets its own browser-history entry:** `/create?step=1`, `?step=2`, `?step=3`.
   - Going forward adds an entry, so the phone's or browser's "Back" returns to the previous step.
   - The form's "חזרה" button uses that same browser "Back". On step 1 it still goes home.
   - Opening `?step=2/3` directly when the earlier steps aren't complete returns to the first incomplete step.
   - The creation screen (step 5) isn't added to the history, so its current behaviour stays exactly as it is.
2. **Answers are saved for the tab:** stored in the browser's per-tab storage (sessionStorage) as you type. Saved fields:
   - name, age, gender, language, nikud
   - story length
   - hair colour and hairstyle
   - clothing type, colour, kippah
   - personality traits, fixed details
   - photo-use consent
   - topic or custom topic
   - which saved child profile is selected

   On return in the same tab, these are restored before the saved child profile loads, so they aren't overwritten.
3. **Photo:** image data is never saved in the browser.
   - If the photo came from a saved profile (an address on the server), only that address is kept.
   - Otherwise the photo field is empty on return and the parent is asked to upload again. The step 2 "continue" rule already requires a photo, so nothing breaks.
4. **When the saved answers are deleted:**
   - After a story is created successfully.
   - On sign-out (with the existing user data cleanup).
   - When "פרופיל חדש +" is clicked.
   - When "יצירת סיפור חדש" is clicked on the "unfinished story" screen.
5. **Separate for each user:** the storage key includes the user's ID: `create_draft_{userId}`. A draft that belongs to a different user is never loaded.
6. **Not touched:** story creation, the one-time request ID, credits, payment, and the creation in-progress mark.

## Technical details
- New `src/lib/create-draft.ts`:
  - `saveCreateDraft(userId, data)` removes `childPhoto` unless it is an http(s) or storage address. It never keeps `data:` image data.
  - `loadCreateDraft(userId)` and `clearCreateDraft(userId)`.
- `CreateStory.tsx`:
  - The step comes from `useSearchParams` (`step`).
  - Going forward uses `setSearchParams({step}, {push})`. "חזרה" uses `navigate(-1)` when the history entry came from the form, and otherwise `replace` to the previous step.
  - The draft is saved with a short delay after `formData` changes.
  - The draft loads once `user` is available, and passes a "restored" flag to ChildInfoStep so it skips auto-filling the first profile.
  - The existing partial save before the sample story (`create_wizard_draft`) is folded into the new draft.
- `ChildInfoStep.tsx`: auto-fill from the first profile is skipped when there is a restored draft. "פרופיל חדש" calls `clearCreateDraft`.
- `use-auth.ts` signOut: delete every `create_draft_*` key.
- Tests in `src/__tests__/create-draft.test.ts`:
  - image data isn't saved, and a server address is
  - one user's key doesn't load another user's draft
  - clearing works
- Playwright at 375px, signed in:
  - fill step 1, continue, browser Back: back on step 1 with the data
  - leave to home and come back: the data is there
  - sign out: the data is gone
