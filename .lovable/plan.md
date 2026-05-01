## Plan: Refine AuthStep Card Layout

Update `src/components/wizard/AuthStep.tsx` only — visual changes, no logic touched.

### Changes

1. **Remove hero image**
   - Delete the `<img src={heroImage} ... />` element above the card.
   - Remove the now-unused `import heroImage from "@/assets/hero-solstories-welcome.png"`.

2. **Make the card taller / more portrait & spacious**
   - Container: keep `max-w-sm` but increase vertical breathing room. Update outer wrapper to center vertically (`justify-center` + add top margin).
   - Card padding: `p-5` → `p-8` (more generous on all sides).
   - Card vertical spacing: `space-y-3` → `space-y-6`.
   - Heading block: `space-y-1` → `space-y-2`; bump heading size to `text-lg` and subtitle to `text-sm` for better proportion in the larger card.
   - Form internal spacing: `space-y-2.5` → `space-y-4`.
   - Input heights: `h-9` → `h-11` for a more elegant, less cramped feel.
   - Mode toggle buttons: `py-1.5` → `py-2.5`, font `text-xs` → `text-sm`.
   - Submit button: `py-2.5` → `py-3.5`, font `text-sm` → `text-base`.
   - Google button: `py-2.5` → `py-3`, keep styling otherwise.
   - Checkbox label rows: increase gap slightly (`gap-2` → `gap-2.5`) and bump text from `text-[11px]` to `text-xs` for readability in the more spacious card.

3. **Preserved unchanged**
   - All state, validation, handlers (`handleSubmit`, `handleGoogleSignIn`, `saveChildToSupabase`).
   - Dark starry background (`#0d0a1f` + radial-gradient stars).
   - Glassmorphism (`bg-white/10 backdrop-blur-xl border-white/20`).
   - All form fields, OAuth flow, terms/marketing checkboxes, headings text content.

### Files touched
- `src/components/wizard/AuthStep.tsx` (visual/layout only)
