---
name: Google OAuth Production Settings
description: Google sign-in uses managed lovable.auth.signInWithOAuth from the QuickSignIn screen; legacy direct flow disabled
type: feature
---
Sign-up/sign-in screen (/auth default view, QuickSignIn) uses `lovable.auth.signInWithOAuth("google", { redirect_uri: origin + "/auth?returnTo=..." })` — managed credentials, no Google Cloud setup needed, works in preview and on soulstory.co.il.
The old direct `supabase.auth.signInWithOAuth` code in Auth.tsx/AuthStep.tsx stays disabled (GOOGLE_SIGNIN_ENABLED=false).
returnTo must pass safeReturnTo (internal path only, else /create).
