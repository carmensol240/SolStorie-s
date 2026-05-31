In `src/pages/StoryViewer.tsx` around line 526-528, the `canUseColoring` flag treats admins (and testers) as entitled, so admin accounts skip the coloring lock even when the story has no purchase/PDF entitlement.

**Change (one line):** drop `isAdminUser` from `canUseColoring` so admin status no longer unlocks the coloring icon. Keep `hasPdfEntitlement`, `isSubscriberUser`, and `isTester` intact — only the admin bypass is removed.

```ts
const canUseColoring = !!user && (
  hasPdfEntitlement || isSubscriberUser || isTester
) && !isForcedDemo;
```

No other change. `canDownloadPdf`, demo-user calculation, and all other admin-gated behavior remain untouched.