## Goal
In `src/components/paywall/ColoringPurchaseModal.tsx`:
1. PayPal link/text — already removed in the previous turn. Verify nothing remains and leave as-is.
2. Add a short descriptive line directly below the "לרכישה — ₪X ✨" purchase button:
   `🎨 לצביעה דיגיטלית באפליקציה ולהדפסה מהבית`

## Change
Insert between the `<Button>` (Grow checkout CTA) and the existing "אולי בפעם אחרת" button:

```tsx
<p className="text-[11px] text-white/70 text-center mt-2 font-semibold">
  🎨 לצביעה דיגיטלית באפליקציה ולהדפסה מהבית
</p>
```

Nothing else changes.
