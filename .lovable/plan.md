

## Comprehensive Fix Plan for SolStory

### 1. Fix Image Generation — Stack Overflow (CRITICAL)

**Problem**: Edge function logs confirm `Maximum call stack size exceeded` errors are **still happening** (latest: 2026-02-28T18:39). The chunked encoding fix exists in source code but the **deployed function is stale**. Additionally, the `String.fromCharCode(...imgBuffer.subarray(i, i + chunkSize))` with 8192 elements may still exceed Deno edge-runtime's call stack limit.

**Fix** (`supabase/functions/generate-illustrations/index.ts`):
- Replace `String.fromCharCode(...imgBuffer.subarray(...))` spread with a safe per-byte loop approach using `TextDecoder` or manual byte-by-byte concatenation with smaller chunks (512 bytes)
- Same fix in `supabase/functions/retry-illustration/index.ts`
- **Redeploy both edge functions** to ensure the fix is live

```typescript
// Replace spread-based chunking with safe approach
const imgBuffer = new Uint8Array(await imgResponse.arrayBuffer());
const chunks: string[] = [];
for (let i = 0; i < imgBuffer.length; i += 512) {
  const slice = imgBuffer.subarray(i, Math.min(i + 512, imgBuffer.length));
  let chunk = '';
  for (let j = 0; j < slice.length; j++) {
    chunk += String.fromCharCode(slice[j]);
  }
  chunks.push(chunk);
}
const binary = chunks.join('');
return `data:image/png;base64,${btoa(binary)}`;
```

### 2. React Hooks Error — Already Fixed

The StoryViewer code already has all hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) called at the top level before any early `return` statements (lines 88-787 are all hooks/logic; first early return is at line 789). No changes needed.

### 3. Story Layout Pattern — Already Implemented

The 2-text + 1-illustration virtual pages pattern is already in place (lines 756-787). Cover, Dedication, Closing pages are preserved. Illustration pages are full-screen with `object-contain`. No changes needed.

### 4. Password Reset Emails Not Arriving

**Problem**: The `send-password-reset` edge function sends via Resend from `noreply@storytime.org.il`. If this domain isn't verified in Resend, emails will fail silently.

**Fix options** (need user input):
- **Option A**: The sender domain `storytime.org.il` must be verified in Resend's dashboard. The function code itself is correct — it calls `resend.emails.send()` with proper HTML template.
- **Option B**: Use Lovable's built-in custom auth email system instead of the manual Resend integration, which would handle email delivery automatically.

**Diagnostic step**: Check edge function logs for `send-password-reset` to see if Resend returns an error.

### 5. RTL & Read-Aloud — Already Done

- All pages have `dir="rtl"` 
- Read-aloud button is removed (line 881 comment confirms this)
- No changes needed

---

### Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/generate-illustrations/index.ts` | Replace spread-based base64 encoding with safe byte-by-byte loop (512 chunk) |
| `supabase/functions/retry-illustration/index.ts` | Same safe base64 encoding fix |
| Both functions | Redeploy to ensure fix is live |

### Items Needing User Input

**Email deliverability**: I need to check the `send-password-reset` logs to diagnose the exact failure. Would you like me to:
- A) Debug the current Resend setup (check logs, verify domain)
- B) Switch to Lovable's built-in auth email system for automatic delivery

