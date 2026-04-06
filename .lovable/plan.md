

## Plan: Fix Two Bugs in `generate-story` Edge Function

### Problem 1: JSON parse failures from backtick wrapping
The `cleanAiContent` function handles backticks only at the exact start/end of the string using `startsWith`/`endsWith`. If the AI returns `` ```json\n{...}\n``` `` with a newline after `json`, the `slice(7)` misses the newline. A regex-based approach is more robust.

### Problem 2: `const` redeclaration of `waitMs`
In `callGatewayWithRetry`, line 591 declares `let waitMs` in the `try` block and line 604 declares `const waitMs` in the `catch` block. While these are technically separate block scopes, some Deno runtime versions can error on this. Changing line 604 to `let` makes it consistent and safe.

---

### Changes — single file: `supabase/functions/generate-story/index.ts`

**1. Improve backtick cleaning in `cleanAiContent` (lines 1557-1560)**

Replace the manual `startsWith`/`endsWith` logic:
```ts
let c = raw.trim();
if (c.startsWith("```json")) c = c.slice(7);
else if (c.startsWith("```")) c = c.slice(3);
if (c.endsWith("```")) c = c.slice(0, -3);
c = c.trim();
```

With a regex that handles all variations:
```ts
let c = raw.trim();
c = c.replace(/```json\n?|\n?```/g, '').trim();
```

**2. Change `const waitMs` to `let waitMs` in catch block (line 604)**

Change:
```ts
const waitMs = Math.min(30_000, ...
```
To:
```ts
let waitMs = Math.min(30_000, ...
```

### What stays the same
- All other logic in `generate-story`
- All other edge functions
- All frontend code

