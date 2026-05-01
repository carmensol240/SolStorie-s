# Redesign AuthStep with magical night-sky atmosphere

Visual-only refresh of `src/components/wizard/AuthStep.tsx`. All form fields, validation, submit handlers, Google OAuth flow, and `onAuthenticated` logic stay byte-for-byte identical.

## Changes

### 1. Background — dark starry sky
Wrap the component in a full-bleed container with background `#0d0a1f` (matching the dark story-page purple). Overlay a subtle star field using a CSS radial-gradient pattern (small white dots at low opacity) so no new asset is required.

### 2. Hero image above the card
Add the home/adventure hero illustration (`@/assets/hero-solstories-welcome.png` — same group-of-children image used on `GuestLanding`) above the form card. Sized responsively (max ~160px tall on mobile, ~200px on larger viewports), centered, with a soft drop shadow / radial glow behind it so it blends into the night sky.

### 3. Glassmorphism form card
Replace the current `bg-white/80 backdrop-blur-md` card styling with a true glassmorphism look:
- `bg-white/10` (semi-transparent)
- `backdrop-blur-xl`
- `border border-white/20`
- Soft white inner glow / shadow

### 4. Text color adjustments (required so text is legible on dark bg)
- Heading: change `text-purple-700` → light `text-white`
- Subheading: light `text-purple-200/80`
- Divider "או" label and other muted greys → light variants (`text-white/60`, `bg-white/20` for divider lines)
- Checkbox labels → `text-white/70`
- Input fields: keep current input component but ensure they remain readable (the `Input` component already has `bg-card` so they stay light — no change needed inside inputs themselves)

### 5. Heading text
Change:
- From: `🌟 הירשמו לשמור את הסיפור!`
- To: `הצטרפו לעולם הסיפורים ✨`

### 6. Unchanged
- All form fields (email, password, show/hide, terms checkbox, marketing checkbox)
- Mode toggle (signup / login)
- Google sign-in button (kept as-is — white button stands out nicely on dark bg)
- All `handleSubmit`, `handleGoogleSignIn`, `saveChildToSupabase` logic
- `onAuthenticated` callback
- Props interface
- All toast messages

## Technical details

File to edit: `src/components/wizard/AuthStep.tsx` only.

Add import:
```ts
import heroImage from "@/assets/hero-solstories-welcome.png";
```

Outer wrapper sketch:
```tsx
<div
  className="min-h-screen flex flex-col items-center px-2 py-6 relative overflow-hidden"
  style={{
    background: '#0d0a1f',
    backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0.5px, transparent 1px),
                      radial-gradient(circle at 70% 60%, rgba(255,255,255,0.4) 0.5px, transparent 1px),
                      radial-gradient(circle at 40% 80%, rgba(255,255,255,0.5) 0.5px, transparent 1px)`,
    backgroundSize: '120px 120px, 200px 200px, 160px 160px',
  }}
  dir="rtl"
>
  <img src={heroImage} alt="" className="w-40 md:w-52 h-auto mb-4 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
  <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-2xl space-y-3">
    {/* heading + form unchanged in structure */}
  </div>
</div>
```

No other files touched. No DB, no edge functions, no routing changes.
