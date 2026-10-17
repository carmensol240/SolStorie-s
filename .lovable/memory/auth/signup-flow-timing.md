---
name: signup-flow-timing
description: Sign-up happens BEFORE the story wizard on one screen (Google + email code), wizard has 4 steps
type: feature
---
Guest pressing "create story" → /auth?returnTo=/create → one screen: title "נרשמים בקליק, והסיפורים שלכם נשמרים בספרייה", Google button first, email + "שלחו לי קוד" (passwordless OTP, no name/phone/password), terms line with links, small "התחברות עם סיסמה" link for existing password users. Text ≥14px, buttons ≥48px.
After sign-in → straight to wizard step 1. Logged-in users skip the screen.
Wizard steps: פרטי הילד ← התאמה אישית ← נושא ← יצירה (no auth step).
Gift credit and welcome email only for genuinely new accounts; same email = same account.
