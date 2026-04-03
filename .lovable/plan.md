

## Plan: Add Photo Consent and Marketing Email Consent Checkboxes

### Summary
Add two consent checkboxes: (1) a required photo consent checkbox in the child profile form that gates the "המשיכו" button when a photo is uploaded, and (2) an optional marketing email consent checkbox in the GeneratingStep signup form. Both need new database columns.

### Database Migration
Add two new columns:
- `children.photo_consent` — `boolean DEFAULT false`
- `profiles.marketing_consent` — `boolean DEFAULT false`

### File Changes

#### 1. `src/components/wizard/ChildInfoStep.tsx`
- Add `photoConsent` state (`useState(false)`)
- Reset `photoConsent` to `false` when photo is removed
- Insert a checkbox below the photo upload area (after the upload label, line ~855):
  ```
  ☐ אני מסכים/ה לשימוש בתמונה לצורך יצירת איורי הסיפור בלבד
  ```
- Only visible when `formData.childPhoto` exists
- Pass `photoConsent` up via `updateFormData` or expose it — since `canProceedStep1` in CreateStory needs to check it, add `photoConsent` to `StoryFormData`

#### 2. `src/pages/CreateStory.tsx`
- Update `canProceedStep1`: if `formData.childPhoto` exists, also require `formData.photoConsent === true`
- Add `photoConsent: false` to `INITIAL_DATA`

#### 3. `src/pages/CreateStory.tsx` — `StoryFormData` interface
- Add `photoConsent: boolean` field

#### 4. `src/components/wizard/GeneratingStep.tsx`
- Add `marketingConsent` state (`useState(false)`)
- Insert an optional checkbox below the terms checkbox (line ~843):
  ```
  ☐ אני רוצה לקבל קופונים ומבצעים במייל (אופציונלי)
  ```
- After successful signup, save `marketing_consent` to profiles table alongside terms acceptance
- Pass `photo_consent: formData.photoConsent` when saving child to Supabase in `saveChildToSupabase`

#### 5. `src/components/wizard/ChildInfoStep.tsx` — localStorage save
- Include `photoConsent` in the saved child data object

### Technical Details
- `canProceedStep1` changes: `formData.childName.trim().length > 0 && (!formData.childPhoto || formData.photoConsent)`
- Photo consent checkbox uses existing `Checkbox` component, same purple styling
- Marketing consent saved via: `await supabase.from("profiles").update({ marketing_consent: marketingConsent, ... }).eq("id", newUser.id)`
- When photo is deleted (Trash button), reset `photoConsent` to false via `updateFormData({ childPhoto: null, childAvatarUrl: null, photoConsent: false })`

### Files modified
1. DB migration — add `photo_consent` to `children`, `marketing_consent` to `profiles`
2. `src/pages/CreateStory.tsx` — add `photoConsent` to interface + initial data + canProceed logic
3. `src/components/wizard/ChildInfoStep.tsx` — photo consent checkbox UI + localStorage persistence
4. `src/components/wizard/GeneratingStep.tsx` — marketing consent checkbox + save to profiles

