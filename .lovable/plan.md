## Goal
Restructure the create-story wizard:
1. Remove the inline registration/login form from the story-loading screen (`GeneratingStep`). By the time users reach loading, they are guaranteed to be authenticated.
2. Add a new dedicated **Sign-up / Login** step in the wizard between the child-details step and the topic-selection step.
3. If the user is already logged in, that new step is skipped automatically (both forward and backward navigation).

No other behavior in the app changes.

## Current flow vs. new flow

Current (`src/pages/CreateStory.tsx`):
```
Step 1: ChildInfoStep   → Step 2: TopicStep   → Step 3: GeneratingStep
```
`GeneratingStep` itself shows an inline signup form when `!user`.

New flow:
```
Step 1: ChildInfoStep   → Step 2: AuthStep (skipped if logged in)   → Step 3: TopicStep   → Step 4: GeneratingStep
```

## Changes

### 1. New file: `src/components/wizard/AuthStep.tsx`
A dedicated step component matching the visual style of the other wizard steps (same gradient background container is provided by `CreateStory`, so this component just renders the form card).

Content (lifted/adapted from the current inline signup block in `GeneratingStep.tsx`, lines ~834–991):
- Heading: "🌟 הירשמו לשמור את הסיפור!" + short subtitle.
- Google sign-in button (reuses the existing `handleGoogleSignIn` logic, including the iframe pop-out, cookie fallback, and `pending_story_formData` storage so the OAuth resume flow keeps working).
- Email/password form with signup ↔ login toggle.
- Terms-accepted checkbox (required for signup) and optional marketing-consent checkbox.
- On successful signup/login: call `saveChildToSupabase(user.id)` (moved from `GeneratingStep`) and write `terms_accepted_at` / `terms_version` / `marketing_consent` to `profiles`.
- Props:
  ```ts
  interface AuthStepProps {
    formData: StoryFormData;
    onAuthenticated: () => void;   // parent advances wizard to next step
  }
  ```
- On success, calls `onAuthenticated()`. The parent will move to the topic step.
- No "אולי אחר כך" / dismiss option — this step is now mandatory before topic selection.

### 2. `src/components/wizard/GeneratingStep.tsx`
- Remove all signup-related state, handlers, and JSX:
  - State: `signupEmail`, `signupPassword`, `signupShowPassword`, `signupTermsAccepted`, `marketingConsent`, `signupMode`, `signupSubmitting`, `signupDismissed`, `signupCompleted`.
  - Functions: `handleSignupSubmit`, `handleGoogleSignIn`, `saveChildToSupabase` (moved to `AuthStep`).
  - JSX block "Bottom: Signup form for unauthenticated users" (~lines 834–991).
  - The conditional wrapper `{(!needsSignup || signupDismissed) && ...}` simplifies to always render the standard animated content.
  - The `needsSignup`-aware variations in the top section (compressed hero, alternate heading, capped progress bar, hidden percentage, motivational sentence card) are removed; the standard always-authenticated layout remains.
- Remove the `useEffect` that waits for `user` to appear before starting generation; just start generation on mount (the existing `if (!hasStartedRef.current && user)` check can become `if (!hasStartedRef.current)` since auth is now guaranteed).
- Remove the now-unused imports (`Mail`, `Lock`, `Eye`, `EyeOff`, `Loader2` if unused elsewhere in the file, `Checkbox`, `Input`, `z`, `emailSchema`, `passwordSchema`, `signInWithEmail`/`signUpWithEmail` from `useAuth`).
- Keep all generation, retry, illustrations-phase, error-state, and ready-popup logic untouched.

### 3. `src/pages/CreateStory.tsx`
Update the wizard step machine to a 4-step flow with conditional skipping of the auth step:

- Update `steps` labels to match the new order (4 entries):
  ```ts
  const steps = [
    { number: 1, label: "פרטי הילד/ה" },
    { number: 2, label: "הרשמה" },
    { number: 3, label: "נושא" },
    { number: 4, label: "יצירה" },
  ];
  ```
- Import `AuthStep`.
- Renumber states:
  - Step 1: `ChildInfoStep` (unchanged)
  - Step 2: `AuthStep` — rendered only when `!user`; otherwise auto-skipped
  - Step 3: `TopicStep` (was step 2)
  - Step 4: `GeneratingStep` (was step 3)
- `handleNext` logic:
  - From step 1 (`canProceedStep1`): if `user` exists → go to step 3 (skip auth), else go to step 2.
  - From step 2 (auth): no manual Next; `AuthStep`'s `onAuthenticated` callback advances to step 3.
  - From step 3 (`canProceedStep2`): credit check (existing logic), then go to step 4 and `setIsGenerating(true)`.
- `handleBack` logic:
  - From step 4: not applicable (full-screen, no header).
  - From step 3: if `user` exists → step 1 (skip auth), else step 2.
  - From step 2: step 1.
  - From step 1: navigate to `/`.
- Render guards:
  - Step 4 stays the existing full-screen `GeneratingStep` early return.
  - Steps 1–3 share the existing wizard layout (header + progress bar + bottom CTA). Step 2's bottom CTA is hidden because `AuthStep` has its own submit buttons inside the card. Implementation: render the bottom CTA only when `step !== 2`.
- Resume-after-OAuth `useEffect` (currently sets `step = 3` and `isGenerating = true`): update to `step = 4` so it lands on the new generating step number.
- Stepper indicator: if user is logged in, visually hide step 2 from the indicator (so the user doesn't see a step they never use). Implementation: `const visibleSteps = user ? steps.filter(s => s.number !== 2) : steps;` and renumber dots 1..N for display only; the underlying `step` state continues to use the canonical 1/2/3/4.

### 4. Out of scope
- `src/components/story/SignupBeforeGenerateModal.tsx` is not currently mounted from `CreateStory` flow — leave untouched.
- `Auth.tsx`, `RequireTerms.tsx`, OAuth callback handling, cookie fallback, and `/create?resume=true` resume logic: unchanged in behavior; only the step number set on resume is updated.
- No DB migrations, no edge-function changes, no styling system changes.

## Technical notes
- Persisting `formData` to `localStorage` before Google OAuth must continue to happen inside `AuthStep.handleGoogleSignIn`, identical to the current implementation in `GeneratingStep`. The resume handler in `CreateStory` already restores it and lands on the generating step.
- `saveChildToSupabase` is called once, inside `AuthStep` after a successful auth. `GeneratingStep` no longer needs it (the row is created earlier in the flow).
- Backwards/legacy: any old `pending_story_formData` resume that lands on the previously-numbered step 3 will now land on step 4 (new generating step number). This is correct because the resume flow's intent is "go straight to generating".

## QA checklist
- Logged-out user: Step 1 (child) → Step 2 (auth form, no loading visuals) → after signup → Step 3 (topic) → Step 4 (generating, no signup form anywhere).
- Logged-in user: Step 1 → Step 3 directly → Step 4. Step 2 is skipped both forward and via Back.
- Google OAuth from Step 2: redirects out, returns to `/create?resume=true`, restores formData, lands on Step 4 generating.
- Email/password signup from Step 2: child profile saved, terms accepted, advances to Step 3.
- Existing generating-screen behavior (text → illustrations → ready popup → navigation) unchanged.
- Stepper indicator shows 4 dots for guests, 3 dots for logged-in users.
