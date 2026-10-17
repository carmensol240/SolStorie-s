# Fix: stop backup-made pictures that don't match the book

## What happened (findings, nothing changed)

Story "נועה בדיקה" (z32hec, 17/10 12:11). In the viewer, screen 4 of 12 is story page 3.

- Main picture service was asked first. It answered without a picture, with the reason **"prohibited content"** (a safety block, not a crash or timeout). Exact request is the one shown in the AI log `01a149c6-96db-79b5-b771-a05f54ea0df4` (12:12:18): page 1 picture attached as reference, then the visual anchor ("girl aged 5-7, brown hair in two pigtails, blue dress"), Pixar style block, scene text, camera "bird's eye view looking down", lighting.
- The code then went **straight to the backup** on the first attempt (no second try of the main service).
- The backup (Fal Flux Schnell) gets **text only** — no page 1 picture, no photo. It uses a different, shorter style block and its own outfit logic, and the long text is cut off by that service's prompt limit. Its exact prompt was not saved (only the first 200 characters are logged), so it can't be shown word for word.
- The look check against page 1 said "match", so it wasn't redone.

Backup use in the last 6 months: 11 pages in 7 stories (Flux). Another 20 pages in 5 stories got no picture at all. 261 pages used the main service.

## Important limit

When the main service blocks a picture for safety, sending the same request again won't work and the AI rules say not to repeat it automatically. So retrying 2–3 times only helps for normal failures (timeout, busy, server error).

## Proposed fix (illustration generation only)

1. **Retry the main service** up to 3 times with growing waits, but only for normal failures. A safety block skips the retries.
2. **Replace the text-only backup** with a backup that can see pictures (the default image model in the Lovable AI service). It gets the same Pixar style text, the same fixed character description, the page 1 picture, and the child's photo when there is one.
3. **Stricter check of backup pictures**: compare with page 1 for face, hair, clothes and art style. If it fails, the bad picture is **not saved**.
4. **No mismatched picture saved**: the page is left without a picture and marked "needs picture"; the story still opens. The existing "Try again" button (a parent choice, not automatic) makes it again. Safety-blocked pages are never repeated automatically.
5. **Save the full prompt** for every attempt (main and backup) with the service used and the reason, so a page can be traced exactly next time.

## Technical details

- `generate-illustrations/index.ts`: retry loop with a classified result (`ok | transient | refused`) taken from HTTP status and `native_finish_reason`; backoff of 2s/5s/10s for transient errors only.
- New backup function using `openai/gpt-image-2.5-sunburst` edit with page-1 + face reference images and the same prompt as the main service (style block + `buildCharacterLock`). Flux kept only as last resort for stories with no photo and no page 1 reference, or removed — your choice.
- Backup results go through `checkIdentityMatch` with an added style/outfit check; failure → `illustration_url` stays empty, `illustration_logs.model_used = 'held_mismatch'`.
- Add the full prompt text to `illustration_logs` details (column already allows extra info, or logged in function logs, no schema change).
- `retry-illustration` gets the same retry/backup logic.
- Small tests for the failure classifier and the "don't save mismatch" decision.
