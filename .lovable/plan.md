

## Plan: Screen Flow & UI Optimization for SoulStory

This plan covers 4 areas: onboarding flow cleanup, home screen simplification, PWA install (already done), and character consistency.

---

### 1. Fix About Screen Scroll Position (scroll to top)

**File: `src/pages/About.tsx`**

Add a `useEffect` that scrolls the window to the top on mount, so users always see the content from the beginning.

```tsx
useEffect(() => {
  window.scrollTo(0, 0);
}, []);
```

---

### 2. Remove Redundant Onboarding Screen -- Merge Consent into Registration

Currently, after signup, users go through: About -> Auth -> Onboarding (terms consent) -> Adventure. The Onboarding page (`/onboarding`) is essentially a duplicate of the About screen with a terms checkbox.

**Changes:**

**File: `src/pages/Auth.tsx`**
- In the signup tab, add a terms/privacy checkbox directly into the registration form (similar to what's already in Onboarding)
- On signup, automatically save `terms_accepted_at` to the profile so users skip Onboarding entirely
- Remove the redirect to `/onboarding` after signup -- go straight to `/adventure`

**File: `src/pages/Auth.tsx` (useEffect for terms check)**
- After login (existing users), keep the existing check: if terms not accepted, redirect to `/onboarding`
- After signup (new users), terms are accepted during registration, so redirect directly to `/adventure`

**File: `src/components/RequireTerms.tsx`**
- No changes needed -- it already handles the flow correctly

**File: `src/pages/Onboarding.tsx`**
- Keep the page for existing users who haven't accepted terms yet (backward compatibility)
- No removal needed

---

### 3. Home Screen Cleanup (Adventure Screen)

**File: `src/pages/Adventure.tsx`**
- The Adventure screen already has only one CTA button ("יוצאים להרפתקה") which is hidden when the WelcomeGiftBanner is visible
- Adjust background image positioning to ensure the floating kids are fully visible: change `backgroundPosition` from `'center'` to `'center top'` or `'center 20%'` so the kids aren't cut off
- Reduce overlay darkness to make the image more visible

---

### 4. PWA Install Button (Already Implemented)

The functional PWA install button is already implemented in Settings with SoulStory branding. No additional changes needed.

---

### 5. Character Consistency -- Sol's Fixed Profile

**File: `supabase/functions/generate-illustrations/index.ts`**

Update the `getDefaultProfile` function to use Sol's specific characteristics as the default female profile:
- Age: 4 years old
- Hair: curly brown hair
- Eyes: brown eyes
- Default outfit: pink dress

```typescript
function getDefaultProfile(...): CharacterProfile {
  const isFemale = childGender === "female";
  return {
    gender: childGender,
    genderHebrew: genderHebrew,
    hairDescription: isFemale 
      ? "curly brown hair with soft natural curls" 
      : "short tousled dark brown hair",
    clothingDescription: isFemale 
      ? "a pretty pink dress" 
      : "colorful casual clothes",
    ageDescription: ageRange || (isFemale ? "4" : "3-6"),
    skinTone: "warm medium olive",
    eyeColor: isFemale ? "large warm brown" : "large dark brown",
  };
}
```

This ensures that when no photo is provided, the default female character matches Sol's appearance. The Visual Anchor system already enforces outfit consistency across all pages.

---

### Technical Summary of Files to Edit

| File | Change |
|------|--------|
| `src/pages/About.tsx` | Add scroll-to-top on mount |
| `src/pages/Auth.tsx` | Add terms checkbox to signup form; save terms on signup; skip onboarding for new users |
| `src/pages/Adventure.tsx` | Adjust background image position for better visibility |
| `supabase/functions/generate-illustrations/index.ts` | Update default female profile to match Sol |

