# AI balance: findings and proposal

## 1. Where the balance comes from today
| Service | What it does | Who pays |
|---|---|---|
| Story writing, Hebrew proofreading, nikud, text improvement | Gemini Flash | Lovable AI (workspace credits) |
| Main illustrations, cover, avatar, redraws, coloring pages | Gemini Pro Image | Lovable AI |
| Backup illustrations | GPT Image | Lovable AI |
| Last-resort backup illustrations + print upscaling | Flux (fal.ai) | Your own fal.ai key |
| Read-aloud | ElevenLabs / Azure | Your own keys (accessibility only) |

So it's mixed, but almost everything that matters (writing + illustrations) comes from Lovable credits. Important: it's the same credit pool used for building the site with me, so build work also uses up the balance customers rely on.

## 2. What 77 credits buys (estimate from the last week's logs)
- One illustration: ~0.5–0.6 credits. Writing + checks: ~0.3 per story.
- **Full story (~6 illustrations + avatar + checks): ~4–5 credits.**
- **Taste (2 illustrations): ~1.5–2 credits.**
- Current balance (68.7 right now): about **14 full stories** or **35 tastes**.

## 3. Automatic top-up
Already on: when the balance drops below 50, 100 credits are added. Monthly cap 400; **200 already used this month**, so two more top-ups remain, then it stops until Dec 1. Change it in Settings -> Plans & credits (workspace owner). Recommendation: raise the monthly cap (e.g. 800–1000) so it never stops mid-month.

## 4. Your own keys (Google Gemini + OpenAI)
- Needed: a Google AI Studio account with billing + a key, and optionally OpenAI; I store them as secrets and change the address/key in ~12 functions.
- Cost: on a monthly plan Lovable charges exactly the provider price, so per-story cost stays about the same (~4–5 credits' worth).
- Pros: completely separate from build credits; payment by credit card without a monthly cap.
- Cons: two more bills to manage, loss of usage logs/alerts here, provider rate limits fall on you, no automatic fallback between providers.
- Recommendation: first raise the top-up cap; switch only if you want a full separation.

## 5. Low-balance alert
Yes: in Settings -> Usage limits & alerts, add a "low balance" alert (e.g. below 100 credits) -> email. Nothing in the code needed. The red banner already built remains for when it truly runs out.

## 6. "Your story is queued" when the balance runs out
What it requires:
1. In generate-story: on a 402/credit error **before** charging -> save the request (child, topic, photo path) as a queued story with status `queued`, no credit charged, and return "queued" to the screen.
2. If it fails after charging (mid-illustration): keep the credit, mark the story `queued` from the step it stopped at.
3. Parent screen: "Your story is queued and will be sent to you soon", the story shows in the library as "in preparation".
4. A scheduled job every 10 minutes: if the balance is paused, try one story only; if it succeeds, release the queue one at a time and charge then.
5. When ready: email to the parent with a link (Resend, already exists).
6. Admin dashboard: number of stories in the queue.
Risk: the story data and child photo must be kept until generation; the credit is charged only on success, preserving the "never charge twice" rule.

## Order of actions proposed
1. (You, now) raise the monthly top-up cap + add a low-balance alert.
2. (Me, after approval) build the queue in section 6.
