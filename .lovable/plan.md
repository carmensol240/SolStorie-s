
# WhatsApp Sharing & OG Metadata Fixes

## Current State Analysis

### What is already working
- Ben/Sol sibling relationship is correctly implemented in `generate-story/index.ts` (lines 994, 998-1000)
- Character consistency (reference images) is implemented in all 3 image generation functions
- The `og-story-meta` Edge Function exists and correctly serves OG tags to crawlers/bots
- The `_redirects` file correctly routes `/story/*` through the Edge Function

### The actual bugs

**Bug 1 — WhatsApp in-app browser doesn't trigger `navigator.share`**
`handleShare` in `StoryViewer.tsx` (line 473) calls `navigator.share()`. Inside WhatsApp's in-app browser on iOS and Android, `navigator.share` is either unavailable or limited. The fallback only copies to clipboard — it does NOT open WhatsApp. The user sees nothing when clicking Share inside a WhatsApp conversation.

**Bug 2 — `og:title` and `og:description` are static generic strings**
In `og-story-meta/index.ts` (lines 69-70):
```typescript
const title = "סיפור חדש ומעצים מבית SolStorie's™";  // generic, no child name
const description = "הצטרפו לסול, בן והחברים...";        // generic
```
The WhatsApp preview should show the child's name and story topic — e.g. **"הסיפור של שירה – חברות"** — to make it personal and meaningful. Currently it just says the same generic text for every story.

**Bug 3 — `cover_url` may be a storage path, not a full public URL**
The `cover_url` column in `stories` may contain a relative path like `story-illustrations/abc.png` instead of a full `https://` URL. If it's a relative path, the OG image will be broken in WhatsApp.

**Bug 4 — `FlipbookViewer.tsx` uses `story.id` instead of `story.slug`**
Line 155 in `FlipbookViewer.tsx`:
```typescript
const publicUrl = `https://soulstory.co.il/story/${story.id}`;
```
This uses the UUID directly. The slug-based URL is preferred for cleaner sharing.

**Bug 5 — Duplicate sibling rule in `generate-story/index.ts`**
The sibling rule at line 998 is duplicated at line 1000. Minor cleanup needed.

---

## Files to Change

### 1. `src/pages/StoryViewer.tsx` — `handleShare` function (lines 464–491)

**Current logic:**
```
if (navigator.share) → share()
else → copy to clipboard
```

**New logic:**
```
if (navigator.share && !isInsideWhatsApp()) → native share sheet
else if (isMobile) → open wa.me deep-link (opens WhatsApp directly with pre-filled message)
else → copy to clipboard with toast
```

WhatsApp in-app browser detection:
```typescript
const ua = navigator.userAgent.toLowerCase();
const isWhatsAppBrowser = ua.includes('whatsapp');
const isMobileDevice = /android|iphone|ipad/.test(ua);
```

The WhatsApp deep-link fallback:
```typescript
const waText = encodeURIComponent(`${text}\n${publicUrl}`);
window.open(`https://wa.me/?text=${waText}`, '_blank');
```

This ensures that when a user receives a story link in WhatsApp and taps "Share" inside the story viewer, it opens WhatsApp again with the story link pre-filled — compatible with all mobile in-app browsers.

---

### 2. `supabase/functions/og-story-meta/index.ts` — Dynamic OG metadata

**Change 1 — Dynamic title using child name and topic:**
```typescript
// Before:
const title = "סיפור חדש ומעצים מבית SolStorie's™";

// After:
const title = `✨ הסיפור של ${story.child_name} – ${story.topic} | SolStorie's™`;
```

**Change 2 — Dynamic description:**
```typescript
// Before:
const description = "הצטרפו לסול, בן והחברים להרפתקה של צמיחה ואומץ בעולם הקסום שלנו.";

// After:
const description = `סיפור קסום שנוצר במיוחד עבור ${story.child_name}. לחצו לקריאת הסיפור המלא 📚`;
```

**Change 3 — Fix `cover_url` to always be a full public URL:**
The `cover_url` can be a relative path (e.g. `story-illustrations/uuid/cover.png`) or a full URL. We need to normalize it:
```typescript
function resolveImageUrl(rawUrl: string | null, defaultUrl: string, supabaseStorageBase: string): string {
  if (!rawUrl) return defaultUrl;
  if (rawUrl.startsWith('http')) return rawUrl;
  // Treat as storage path in story-illustrations bucket
  return `${supabaseStorageBase}/storage/v1/object/public/story-illustrations/${rawUrl}`;
}

const storageBase = supabaseUrl; // e.g. https://qvdwmkxviaqcgmjotsxe.supabase.co
const imageUrl = resolveImageUrl(story.cover_url, defaultOgImage, storageBase);
```

**Change 4 — Add `og:image:width` and `og:image:height` hints** so WhatsApp doesn't skip the image:
```html
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
```

**Change 5 — Set `Cache-Control` to `no-cache` for the first load** so WhatsApp fetches fresh OG tags on every new story share instead of serving a stale cached version:
```typescript
"Cache-Control": "no-cache, no-store, must-revalidate"
```

---

### 3. `src/pages/FlipbookViewer.tsx` — Use `slug` for share URL (line 155)

The story data already contains `slug`. Add slug to the fetched fields and use it:
```typescript
// Before:
const publicUrl = `https://soulstory.co.il/story/${story.id}`;

// After:
const publicUrl = `https://soulstory.co.il/story/${story.slug || story.id}`;
```

---

### 4. `supabase/functions/generate-story/index.ts` — Remove duplicate sibling rule (line 1000)

Line 998 and line 1000 contain identical sibling rule text. Remove the duplicate at line 1000.

---

## Summary of Changes

| File | Change |
|---|---|
| `src/pages/StoryViewer.tsx` | Detect WhatsApp browser, use `wa.me` deep-link fallback for in-app browser |
| `supabase/functions/og-story-meta/index.ts` | Dynamic title/description per story, fix cover_url normalization, add OG image dimensions, set no-cache |
| `src/pages/FlipbookViewer.tsx` | Use `story.slug` instead of `story.id` in share URL |
| `supabase/functions/generate-story/index.ts` | Remove duplicate sibling rule |

## What Stays the Same
- `_redirects` — the proxy routing is already correct
- Character reference image injection in all 3 image generation functions — already done
- Ben/Sol sibling language rules — already implemented, just removing the duplicate
- All RLS policies, database schema, auth flows — unchanged
