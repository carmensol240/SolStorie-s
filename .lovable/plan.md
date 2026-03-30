

## Plan: Harden Negative Prompts + Fix Illustration Backgrounds

### Changes

**1. `supabase/functions/_shared/style-config.ts` — Extend `ILLUSTRATION_NEGATIVE_PROMPT` (line 24)**

Append to the existing string:
```
, no screenshot, no phone screen, no device frame, no status bar, no notification bar, no mobile UI, no browser chrome, no app interface visible, no black bars, no black side margins, no letterbox, no pillarbox
```

**2. `src/pages/StoryViewer.tsx` — 4 locations**

Replace all black/dark backgrounds with `hsl(260,50%,12%)` and ensure portrait images always get `object-contain`:

| Location | Current | New |
|---|---|---|
| `handleImageLoad` callback (~line 212) | `rgba(0,0,0,0.9)` | `hsl(260,50%,12%)` |
| Cover image (~line 1248) | `bg-black/90` | inline style `hsl(260,50%,12%)` |
| Combined page img (~line 1554-1555) | `rgba(15,25,15,0.95)` for learning only | `hsl(260,50%,12%)` for learning; `handleImageLoad` handles portrait for others |
| Illustration-only img (~line 1630-1631) | same as above | same fix |

The `handleImageLoad` callback already switches portrait images to `object-contain` dynamically — just updating its background color is sufficient for non-learning topics. For learning topics, the hardcoded `object-contain` stays.

No other files or logic touched.

