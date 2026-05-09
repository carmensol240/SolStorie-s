## Goal
Center the text inside every button in the signup/login card so labels sit visually in the middle under RTL.

## File
`src/components/wizard/AuthStep.tsx` only.

## Changes
Add `flex items-center justify-center text-center` to the className of:

1. The two mode-toggle pills (lines 178–199): "הרשמה" and "כבר יש לי חשבון".
2. The submit `<Button>` (line 268): "הירשמו והמשיכו ✨" / "התחברו והמשיכו ✨" / spinner.
3. The "לצפייה בסיפור לדוגמה 📖" button (line 282).

No other styling, copy, layout, or logic is modified.
