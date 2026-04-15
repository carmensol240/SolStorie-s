

## Plan: Remove terms checkbox from Adventure page

### Changes in `src/pages/Adventure.tsx`

1. **Remove the terms checkbox block** (lines 183–198) — the entire `{!localStorage.getItem('terms_accepted') && (...)}` section.

2. **Remove `disabled={!termsAccepted}`** from the CTA button (line 202) and the associated disabled styles (`disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-...`), so the button is always enabled.

3. **Remove unused imports and state**:
   - Remove `Checkbox` import
   - Remove `Link` from react-router-dom imports (check if used elsewhere in file — it's used in the terms link only, so remove)
   - Remove `termsAccepted` state and `handleTermsChange` callback (lines 30–31, 62–68)

No other files or pages are modified.

