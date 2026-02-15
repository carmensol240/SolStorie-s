

# Domain Migration to solstories.co.il

## Overview
Migrate SEO, metadata, and social sharing references to the new official domain `solstories.co.il`. Most internal links already use relative paths or `window.location.origin`, so the migration is focused on static metadata and OG tags.

---

## Changes

### 1. SEO & OpenGraph Metadata (`index.html`)

Update lines 27-34 to reference the new domain:

- Add `<meta property="og:url" content="https://solstories.co.il" />`
- Update `og:image` and `twitter:image` from `https://lovable.dev/opengraph-image-p98pqg.png` to `https://solstories.co.il/favicon.png` (or a dedicated OG image if uploaded later)
- Add `<link rel="canonical" href="https://solstories.co.il" />` for SEO

### 2. No Changes Required (Already Dynamic)

These areas use `window.location.origin` at runtime, so they automatically adapt to whichever domain serves the app:

| Area | File | Why no change |
|------|------|---------------|
| Referral/Share links | `src/hooks/use-referral.ts` | Uses `window.location.origin` (line 65) |
| WhatsApp sharing | `src/hooks/use-referral.ts` | Built from dynamic share link (line 70) |
| PWA manifest | `vite.config.ts` | Uses relative paths (`/`, `/pwa-icon-192.png`) |
| PDF footer | `src/hooks/use-pdf-export.ts` | Shows `SolStorie's(TM)` branding, no domain |
| Privacy Policy | `src/pages/PrivacyPolicy.tsx` | References brand name, no domain URLs |
| Terms of Service | `src/pages/TermsOfService.tsx` | References brand name, no domain URLs |
| Payment (PayPal) | `src/config/pricing.ts` | Client ID is domain-independent; PayPal handles redirect via `window.location` |

### 3. Domain Connection (Manual Step)

After code changes, connect the custom domain in Lovable:

1. Go to **Project Settings** then **Domains**
2. Click **Connect Domain** and enter `solstories.co.il`
3. Add a second entry for `www.solstories.co.il`
4. At your domain registrar, add:
   - **A Record** for `@` pointing to `185.158.133.1`
   - **A Record** for `www` pointing to `185.158.133.1`
   - **TXT Record** as provided by Lovable for verification
5. Set one as Primary (the other will redirect)
6. SSL is provisioned automatically

### 4. PayPal Domain Verification (Manual Step)

In the PayPal developer dashboard, add `solstories.co.il` as an allowed domain/return URL to ensure payment callbacks work on the new domain.

---

## Summary

| File | Change |
|------|--------|
| `index.html` | Add canonical URL, og:url, update og:image/twitter:image to new domain |

## Technical Notes
- Only 1 file needs code changes -- the rest is infrastructure/DNS setup
- All share links, referral URLs, and PWA scope are already relative/dynamic
- Branding elements (rainbow logo, trademark, PDF footer) contain no domain references
- PayPal client-side SDK uses return URLs from `window.location`, but the PayPal dashboard may need the new domain whitelisted

