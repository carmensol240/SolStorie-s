

## Plan: Update Onboarding Flow, About Page, and Adventure Screen

### Summary
Three changes: (1) Shorten About page with expandable content and terms checkbox, (2) Post-login already redirects to `/adventure` — no change needed, (3) Add CSS animations to Adventure screen and smart navigation from the CTA button.

---

### 1. About Page (`src/pages/About.tsx`)

**Collapse content below the fold:**
- Keep the top section (logo, tagline, first CTA area) visible
- Wrap everything from the "personal intro" paragraph (line 117) down to the bottom CTA (line 214) inside a collapsible section controlled by a `showMore` state, initially `false`
- Show a "קרא עוד ↓" text link that toggles `showMore` to reveal the full content

**Add terms checkbox before CTA:**
- Add a checkbox + label: `☐ קראתי ואני מסכימה לתנאי השימוש` with a link to `/terms`
- The "בואו נתחיל!" button becomes `disabled` when checkbox is unchecked (grayed out, `cursor-not-allowed`, reduced opacity)

**Button behavior unchanged** — navigates to `/auth` on click.

### 2. Post-Login Redirect

Already handled correctly — `Auth.tsx` line 258 defaults `returnTo` to `/adventure`, and line 283 navigates there if terms are accepted. **No changes needed.**

### 3. Adventure Screen Animations (`src/pages/Adventure.tsx`)

**Add floating sparkle particles:**
- Add an overlay `div` with ~15 small animated star/sparkle elements using CSS `@keyframes` for floating upward motion, similar to the About page's star pattern but with vertical drift

**Soft glow shimmer on video:**
- Add a subtle animated gradient overlay that pulses gently over the video

**Pulsing CTA button:**
- The button already has `animate-[glow-pulse_2.5s_ease-in-out_infinite]`. Enhance with a subtle `scale` pulse keyframe if not already defined

**Fade-in entrance:**
- Add `animate-fade-in` class to the main container

**Smart CTA navigation:**
- Change the button's `onClick` from `navigate("/create")` to an async function that:
  1. Checks if any child profiles exist: `supabase.from("child_profiles").select("id", { count: "exact", head: true }).eq("user_id", user.id)`
  2. If `count > 0` → navigate to `/create`
  3. If `count === 0` → navigate to `/child-profiles` (or `/children` — wherever ChildProfiles lives)

**Add sparkle CSS keyframes** to `src/index.css` (or inline):
- `float-up`: translateY(0) → translateY(-100vh) with opacity fade, 6-10s duration, infinite loop with random delays

### Files Modified
- `src/pages/About.tsx` — collapsible content, terms checkbox, disabled button
- `src/pages/Adventure.tsx` — floating sparkles, shimmer overlay, fade-in, smart CTA routing
- `src/index.css` — add `float-up` keyframe animation (if not using inline styles)

### Technical Details
- About page uses `useState<boolean>(false)` for `showMore` toggle
- Checkbox uses existing `Checkbox` component from `@/components/ui/checkbox`
- Adventure child profile check uses existing supabase client
- No new dependencies needed

