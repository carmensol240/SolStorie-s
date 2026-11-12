# Likeness test: Flash model + short instruction

Nothing changes until you approve. The experiment runs first; the app changes only after a second approval.

## 1. Available "Flash" models and price (from our live model list)

Today every story picture uses **gemini-3-pro-image** (Pro). Prices per picture made, compared with Pro:

| Model | What it is | Picture price vs Pro |
|---|---|---|
| gemini-3-pro-image (current) | "Nano Banana Pro" | 100% |
| **gemini-3.1-flash-image** | "Nano Banana 2", today's Flash in the Gemini app | **about 50%** |
| gemini-2.5-flash-image | original "Nano Banana" | about 25% |
| gemini-3.1-flash-lite-image | lightest | about 25% |

The Gemini app's Flash today is most likely gemini-3.1-flash-image. The experiment also tests gemini-2.5-flash-image (original Nano Banana) with the short instruction.

## 2. The short instruction

```text
[avatar image] [Leo / gang reference picture, only if named on the page]
This is the child's avatar. Create a children's book illustration of EXACTLY
this same child — same face, same hair, same eyes, same face shape — in the
same 3D style as the avatar.
Scene: <page scene, meaning only>. He/She is wearing <story outfit>.
<Leo is the boy in the second picture, exactly as shown.>   (only if needed)
<Wide 3:2 landscape | Square 1:1> image, warm light, waist-up, no text, no flags.
```

Everything else (long gang descriptions, camera rules, distinguishing features, flag rules, hair/eye tones) leaves the instruction. Gang members get their reference picture plus one line. The rules move to the checks after the drawing.

## 3. Experiment (test account only, nothing saved to any story)

- Uriel pages 1 and 3 (avatar read only), Noam 2 pages.
- 5 methods per page: (1) current, (2) Pro + short, (3) Flash 3.1 + current, (4) Flash 3.1 + short, (5) Flash 2.5 + short.
- 20 pictures, one try each, no redraws, so we compare the raw likeness. The checks still run and report their result in the table.
- Side-by-side table with the avatar, saved to Files.
- Then delete the test tool and all 20 pictures; only the comparison table stays. Answer: which method looks closest to the avatar, judged from the pictures, plus the cost.

## 4. Checks after the drawing — they all stay

The 3D/style check, face-vs-avatar check, shape (size measured), text and flag checks, and gang check stay exactly as they are and still decide whether a picture is saved. Only the drawing instruction gets shorter. If the short instruction leads to more failures (e.g. wrong outfit or extra friends), the table will show it and the check triggers a redraw that names the problem.

## 5. Locked rules

- Rules 1, 2, 3, 6, 7: no change.
- Rule 4 (3D style, avatar style): no change.
- Rule 5 says "strong face paragraph at the top of the shared instruction" and the eye-level, waist-up framing. The short instruction keeps the avatar line first and one framing line, so the meaning holds. If we adopt it, I suggest you update the wording to: "a short instruction that starts with the avatar line; other rules are enforced by the checks." I will not change it myself.

## What would change after the test (separate approval)

- `_shared/illustration-prompt.ts`: new short instruction builder (old one kept for older stories).
- `generate-illustrations/index.ts`, `retry-illustration/index.ts`: model switch for new stories (cutoff date), backup model unchanged.
- `_shared/style-config.ts`: gang reference pictures (Leo already has one; Sol, Mia, Zoe, Ben need one picture each, from our own storage).
- New tests for the short instruction; locked tests not weakened. AGENTS.md updated.
- Only new stories (new cutoff date); existing stories and their redraws stay the same.

## Cost (estimates)

| Method | AI per 12-page story (drawings + checks + typical redraws) |
|---|---|
| Current (Pro + long) | ~$1.0–2.0 |
| Pro + short | ~$0.9–1.8 (shorter text only) |
| Flash + current | ~$0.5–1.0 |
| Flash + short | ~$0.45–0.9 |

- Experiment: 20 pictures + checks, about $0.50–1.00.
- Building the experiment tool: about 2–3 credits. Building the final change: about 3–5 credits.

## Technical details

- Temporary edge function `likeness-flash-experiment` (admin-only, test account), writes to `experiments/` and is deleted at the end with its files.
- Flash call: same chat-completions request, `model: google/gemini-3.1-flash-image`, `modalities: ["image","text"]`, avatar sent as inline bytes.
- Shape: 16:9/3:2 asked in the text; measured size check unchanged.
