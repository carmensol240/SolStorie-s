

## Plan: Restructure App Flow — Free Browsing, Signup Before Generation

### Summary
Allow unauthenticated users to flow through About → Adventure → Child Profile → Topic Selection freely. Signup popup appears right before story generation begins. After signup, the story generates normally.

---

### Flow Overview

```text
About (/) → Adventure (/adventure) → Create Story (/create)
                                        ├─ Step 1: Child info (no auth needed)
                                        ├─ Step 2: Topic selection (no auth needed)
                                        └─ Step 3: "Generate" clicked → signup popup
                                              ├─ Signup → save child to Supabase → generate story
                                              └─ Already logged in → generate directly
```

---

### Changes

#### 1. `src/pages/About.tsx`
- Change CTA button navigation from `/auth` to `/adventure` (line 237)

#### 2. `src/pages/Adventure.tsx`
- Remove auth requirement from the CTA button logic
- "יוצאים להרפתקה" always navigates to `/create` (no child profile check — child info is step 1 of create wizard already)

#### 3. `src/App.tsx`
- Remove `<RequireTerms>` wrapper from `/adventure` route (line 65)
- Remove `<RequireTerms>` wrapper from `/create` route (line 82)
- Keep `/children` behind `<RequireTerms>` (only used by logged-in users managing profiles)

#### 4. `src/pages/CreateStory.tsx`
- Remove the auth redirect in `useEffect` (lines 103-126) — allow unauthenticated users
- Remove the auth guard render check (lines 136-138)
- When user clicks "Generate" (step 2 → step 3 transition): if not logged in, show a signup modal instead of proceeding
- After successful signup inside the modal: save child details to Supabase children table, then proceed to GeneratingStep

#### 5. New component: `src/components/story/SignupBeforeGenerateModal.tsx`
- Modal with warm design (purple/pink palette)
- Header: "🌟 עוד רגע והסיפור שלכם מוכן!"
- Subtext: "הירשמו כדי לשמור את הסיפור ולהתחיל את ההרפתקה"
- Email + password signup form (reuse auth logic from `use-auth` hook)
- Terms checkbox (required)
- Optional: "כבר יש לי חשבון" toggle to login tab
- "אולי אחר כך" dismiss button → navigates back to About page
- On successful signup: close modal, save child profile to Supabase, continue to generation

#### 6. `src/components/wizard/GeneratingStep.tsx`
- No changes needed — it already receives `formData` and calls the edge function with the authenticated user's token

---

### What stays the same
- Edge function (`generate-story`) — no changes, still requires auth
- `RequireTerms` component — no changes, just removed from 2 routes
- Auth page (`/auth`) — still available for direct login
- Child profiles page (`/children`) — still protected, used for managing multiple children
- All other protected routes remain behind `RequireTerms`

### Files modified
1. `src/pages/About.tsx` — CTA navigates to `/adventure`
2. `src/pages/Adventure.tsx` — CTA always goes to `/create`
3. `src/App.tsx` — remove RequireTerms from `/adventure` and `/create`
4. `src/pages/CreateStory.tsx` — remove auth guard, add signup modal trigger
5. `src/components/story/SignupBeforeGenerateModal.tsx` — new signup modal component

