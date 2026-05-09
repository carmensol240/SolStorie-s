## Goal
Preserve wizard form data when the user clicks "לצפייה בסיפור לדוגמה 📖" to view the demo story, so when they come back to `/create` the fields they already filled (name, age, gender, language, length) are restored.

## Note on location
The "view demo story" button actually lives in **Step 2 (`AuthStep.tsx`)**, not Step 1 (`ChildInfoStep.tsx`). By the time it is clicked, Step 1's data already lives in `formData` state inside `CreateStory.tsx`. The plan therefore touches `CreateStory.tsx` and `AuthStep.tsx` — no change to `ChildInfoStep.tsx`.

If the user meant a different button inside Step 1, let me know and I'll adjust.

## Changes

### 1. `src/pages/CreateStory.tsx`
- Add a `sessionStorage` key constant, e.g. `WIZARD_DRAFT_KEY = "create_wizard_draft"`.
- In the existing initial-mount `useEffect` (the one that handles `?resume=true`), add a branch: if no resume param, try to read `sessionStorage.getItem(WIZARD_DRAFT_KEY)`. If present, parse and restore only the requested fields onto `formData` via `setFormData(prev => ({ ...prev, ...restored }))`, then `sessionStorage.removeItem(WIZARD_DRAFT_KEY)`.
- Restored fields whitelist: `childName`, `childGender`, `ageRange`, `storyLength`, `language`. (Photo, consent, topic intentionally excluded per the user's list.)
- Expose a tiny helper or just pass `formData` down to `AuthStep` so it can save it (AuthStep already receives `formData` — confirmed in current code: `<AuthStep formData={formData} ... />`).

### 2. `src/components/wizard/AuthStep.tsx`
- In the demo-story button's `onClick`, before `navigate("/demo-story")`, save the whitelisted fields:
  ```ts
  sessionStorage.setItem("create_wizard_draft", JSON.stringify({
    childName: formData.childName,
    childGender: formData.childGender,
    ageRange: formData.ageRange,
    storyLength: formData.storyLength,
    language: formData.language,
  }));
  ```
- No other changes to AuthStep.

## Out of scope
- `ChildInfoStep.tsx`, `DemoStory.tsx`, `TopicStep.tsx`, routing, photo handling, topic state, and the existing `?resume=true` OAuth flow remain untouched.

## Files to edit
- `src/pages/CreateStory.tsx`
- `src/components/wizard/AuthStep.tsx`