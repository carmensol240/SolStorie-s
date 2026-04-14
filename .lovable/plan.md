

## Plan: Remove keepalive ping from GeneratingStep

### What and why
Remove the `keepaliveInterval` block (lines 494–507) that pings Supabase every 15 seconds and shows false "unstable connection" warnings. Also remove its `clearInterval(keepaliveInterval)` on line 519.

### Changes — single file: `src/components/wizard/GeneratingStep.tsx`

1. **Delete lines 494–507** — the entire `const keepaliveInterval = setInterval(...)` block
2. **Delete line 519** — `clearInterval(keepaliveInterval);`

Nothing else in the file is touched.

