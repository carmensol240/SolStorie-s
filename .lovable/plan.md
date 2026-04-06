

## Plan: Update Countdown Target Date

### Single change in `src/pages/Upgrade.tsx`

Replace:
```ts
const TARGET_DATE = new Date('2026-04-21T21:00:00Z');
```
With:
```ts
const TARGET_DATE = new Date('2026-04-07T21:00:00Z');
```

This sets the countdown to April 8, 2026 at 00:00 Israel time (UTC+3). No other changes.

