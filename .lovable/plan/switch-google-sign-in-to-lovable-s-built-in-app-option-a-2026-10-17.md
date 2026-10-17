# Switch Google sign-in to Lovable's built-in app (option A)

## What I found
- On soulstory.co.il, "המשך עם Google" goes through Lovable's sign-in service, which sends Google the app ID `661304871912-…` and the return address `https://oauth.lovable.app/callback`.
- Google doesn't allow that return address for this app, so it shows redirect_uri_mismatch. This is most likely your own Google Cloud app, which is still saved in the sign-in settings.

## What I'll do
1. Switch Google sign-in to Lovable's built-in Google app and remove your own Client ID/Secret from use.
2. Check on soulstory.co.il that Google now gets Lovable's built-in app ID and doesn't reject the return address.
3. Report what worked. You'll need to finish the actual Google account choice yourself, because I can't sign in to your Google account.

## Unchanged
The sign-in screen, the email-code sign-in, password sign-in, payments, prices, Grow, and any code.

## Notes
- Google's consent screen will show Lovable's name instead of SolStories.
- Existing users who signed in with Google keep the same account, because accounts are matched by email.

## Technical details
Run the social-login setup tool with providers ["google"]. It switches the provider to managed credentials. Then follow `/~oauth/initiate` on soulstory.co.il through oauth.lovable.app to accounts.google.com, confirm the client_id changed, and confirm Google's page shows no error.
