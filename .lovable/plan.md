## Root cause

The "אפליקציה לא בטוחה / תוכננה לגרסה ישנה של Android" warning is **not** a bug in our code — it is shown by Google Play Protect when the Android system detects a WebAPK with an outdated `targetSdkVersion`.

When you "Add to Home Screen" from **Chrome**, Google mints a fresh WebAPK with an up‑to‑date `targetSdk` and Play Protect stays silent.
When you do it from **Samsung Internet** (which is what the screenshot shows — note the Samsung browser chrome and the `82` battery widget), Samsung generates its own WebAPK with an older `targetSdk`, which is exactly what Play Protect flags.

So the fix is twofold:
1. Tighten the `manifest.webmanifest` so Chrome's WebAPK minting service accepts it cleanly (any missing/invalid field forces the browser to fall back to a "shortcut" or a degraded WebAPK, which on some OEM browsers also triggers the warning).
2. Steer users to install via **Chrome** in our in‑app install prompt, so the WebAPK they get is the modern one.

No app code, no routing, no story logic is touched.

## Changes

### 1. `vite.config.ts` — manifest cleanup
Inside the existing `VitePWA({ manifest: { ... } })` block only:
- Add `"display_override": ["standalone", "minimal-ui"]` (helps Chrome pick the correct install path).
- Add `"launch_handler": { "client_mode": "navigate-existing" }` (silences a newer WebAPK lint warning).
- Remove the duplicate icon entries with `purpose: "maskable"` that point at the **same non‑padded** PNG as `purpose: "any"`. Declaring a non‑padded icon as `maskable` is what often causes Chrome to refuse to mint a WebAPK and fall back to a legacy shortcut (which Play Protect then flags). Keep only the two `purpose: "any"` entries (192 + 512). If proper padded maskable icons are added later we can re‑introduce them, but per the request we will not generate new image assets now.
- Add `"prefer_related_applications": false` is already there — keep.
- Add `"related_applications": []` for completeness.

Nothing else in `vite.config.ts` changes (workbox config, runtimeCaching, etc. all stay).

### 2. `src/components/story/InstallAppPrompt.tsx` — recommend Chrome on Android
In the existing Android (🤖) card only, append one short line:
> מומלץ להתקין דרך **Chrome** כדי להימנע מאזהרת Google Play Protect.

No other text, layout, button, or behavior changes.

### 3. `src/components/pwa/PWAInstallPrompt.tsx` and `PWAInstallBanner.tsx`
No changes. They already rely on the native `beforeinstallprompt` event, which only fires in Chromium browsers — exactly the path we want users to take.

## Out of scope
- No new icon assets, no maskable‑icon regeneration.
- No changes to PWA service worker, caching, or registration.
- No changes to `index.html`, routing, or any unrelated component.
- No changes to anything outside the three files listed above.
