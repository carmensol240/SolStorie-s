# Google sign-in on soulstory.co.il: what's happening and how to fix it

## What I checked (nothing changed)
I followed the real "המשך עם Google" path on the live site:
1. soulstory.co.il hands off to Lovable's sign-in service (oauth.lovable.app). This part works.
2. Lovable's service sends Google:
   - Google app (client ID): `661304871912-tsnclqtce03a57qkfhcvpcs51et1nrr1.apps.googleusercontent.com`
   - Return address (redirect_uri): `https://oauth.lovable.app/callback`
3. Google rejects it with redirect_uri_mismatch. That means this Google app doesn't list `https://oauth.lovable.app/callback` as an allowed return address.

## Answers
1. **Which Google app?** Almost certainly your own app from Google Cloud, not Lovable's built-in one. Lovable's built-in app always allows its own return address, so it wouldn't give this error. My guess is your own client ID and secret are still saved in the sign-in settings, so the new managed sign-in uses your app but sends it Lovable's return address.
2. **Which return address, and why it's rejected:** `https://oauth.lovable.app/callback`. Your Google app was set up for the old flow, which used the backend's own return address, so it doesn't allow the new one.
3. **How to fix it.** Pick one:
   - **Option A (recommended, nothing to set up):** switch Google back to Lovable's built-in app. In Lovable Cloud: Users -> Authentication Settings -> Sign In Methods -> Google, remove your own Client ID/Secret (choose the managed option). Or approve and I'll switch it for you. Downside: Google's consent screen shows Lovable's name, not SolStories.
   - **Option B (keep your own app and branding):** in Google Cloud Console -> APIs & Services -> Credentials -> your OAuth client (ID starting 661304871912) -> "Authorized redirect URIs" -> Add URI: `https://oauth.lovable.app/callback` -> Save. Keep the existing addresses. Also check that `soulstory.co.il` is listed under OAuth consent screen -> Authorized domains. Changes can take a few minutes to take effect.
4. **Go back to your own app?** You don't have to choose. Option B keeps your own app working with the new sign-in screen. Going back to the old sign-in code isn't recommended, because the new sign-up screen is built on the managed flow.

## After you decide
- Option A: I switch Google to the built-in app, then test the full Google sign-in on soulstory.co.il.
- Option B: you add the address, then I check that Google no longer rejects it.
- Nothing changes in payments, prices, Grow or the email-code sign-in.

## Technical note
The client ID that Google receives can't be confirmed from code alone. If the ID above isn't yours, it's the managed app, and I'd raise the problem with Lovable support instead.
