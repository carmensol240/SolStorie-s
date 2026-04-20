

## Update GA4 Measurement ID in `index.html`

The current `index.html` uses `G-TWA52645C8`. You provided `G-TWW52645C8` (different by one character: `TWW` vs `TWA`). I need one quick confirmation before changing it.

### Please pick one:

- **A — Replace**: New ID `G-TWW52645C8` is correct. I swap `G-TWA52645C8` → `G-TWW52645C8` in both the script `src` and the `gtag('config', ...)` call. Old ID stops receiving data.
- **B — Add both**: Keep `G-TWA52645C8` AND add a second `gtag('config', 'G-TWW52645C8', ...)` so both properties receive data in parallel.
- **C — Cancel**: Leave `index.html` unchanged with the existing `G-TWA52645C8`.

### Planned change (Option A)
**File**: `index.html` — only the existing GA block in `<head>`:
- `gtag/js?id=G-TWA52645C8` → `gtag/js?id=G-TWW52645C8`
- `gtag('config', 'G-TWA52645C8', { anonymize_ip: true });` → `gtag('config', 'G-TWW52645C8', { anonymize_ip: true });`

I'll keep `{ anonymize_ip: true }` for GDPR compliance (your snippet omits it; safer to keep). Tell me if you want it removed.

### What will NOT change
- CSP meta tag — already whitelists Google Analytics domains.
- No other files touched. No SPA route-change tracking added (can be a follow-up).

Reply **A**, **B**, or **C** and I'll proceed.

