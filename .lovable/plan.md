

## Plan: Navigate to StoryViewer as Soon as Story is Complete

### Problem
Currently `checkIllustrations` waits for ALL illustration URLs to be populated before navigating. This delays the user unnecessarily — the StoryViewer can display pages as illustrations arrive.

### Change

**File: `src/components/wizard/GeneratingStep.tsx`** — modify `checkIllustrations` function (lines 262-278)

Add a check at the top of `checkIllustrations` that queries the story's `generation_status` field. If it equals `'ready'` (the value used in this project, not `'completed'`), immediately navigate — skip waiting for illustrations.

```typescript
const checkIllustrations = async () => {
  // Navigate immediately if story generation is complete
  const { data: storyData } = await supabase
    .from("stories")
    .select("generation_status")
    .eq("id", storyId)
    .single();

  if (storyData?.generation_status === 'ready') {
    console.log("[GeneratingStep] Story ready — navigating without waiting for illustrations");
    setProgress(100);
    setShowReadyPopup(true);
    setTimeout(() => { if (storyId) onComplete(storyId); }, 1500);
    return;
  }

  // Existing illustration check as fallback
  const { data: pages } = await supabase
    .from("story_pages")
    .select("id, illustration_url")
    .eq("story_id", storyId);
  
  if (pages && pages.length > 0 && pages.every(p => p.illustration_url)) {
    // ... existing logic unchanged
  }
};
```

Note: The stories table uses `generation_status` (not `status`), with default value `'ready'`. This is the correct column to check.

### What stays the same
Everything else — puzzle game, realtime subscription, safety timeout, confetti celebration, all other components.

