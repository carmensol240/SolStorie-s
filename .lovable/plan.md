## Goal

1. Change the WhatsApp share message format on the story viewer to include the child's name and a direct link to the shared story.
2. When a recipient opens the shared link while logged out, send them to the auth page first and automatically return them to the story after they sign up or log in.

## Changes

### 1. `src/pages/StoryViewer.tsx` — `handleShareWhatsApp`

Replace the current text with the new format and include a real public link built from the story slug:

```ts
const slug = story.slug || story.id;
const link = `https://soulstory.co.il/s/${slug}`;
const text = `${story.child_name} קיבל/ה סיפור מותאם אישית ב-SolStories 🌟 הכנסו לראות את הקסם 🎉 ${link}`;
```

Keep the existing `window.open(...wa.me...)` call and analytics tracking unchanged.

### 2. `src/pages/PublicStoryViewer.tsx` — gate public link behind auth

At the top of the component (after `useAuth`), add an effect that redirects unauthenticated visitors to the auth page with a `returnTo` pointing back to the same `/s/<slug>` URL:

```ts
useEffect(() => {
  if (!user && storySlug) {
    const returnTo = `/s/${storySlug}`;
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
  }
}, [user, storySlug, navigate]);
```

Guard the existing fetch / render flow so it doesn't run while we're redirecting (e.g. skip `fetchStory` when `!user`).

The existing Auth page already honors the `returnTo` query param for both email signup/login and Google OAuth, so after the user authenticates they will be sent back to `/s/<slug>` automatically and the story will load.

## Out of scope

No other share surfaces (GiftCard, ShareAndEarn, DemoStory) and no other behavior change.
