

## Analysis: Story Generation Completes but Navigation Fails

### Problem
The generating screen reaches ~86% (just past the 85% cap in text phase), meaning the story was generated successfully. The `onComplete` callback fires, but instead of navigating to the story viewer, the user is returned to the home screen. The story does exist in the library.

### Root Cause
In `CreateStory.tsx`, the `handleStoryGenerated` callback has **no try/catch wrapper**. If `useCredit()` or the slug lookup query throws an unexpected error, the `navigate()` call is never reached. The unhandled promise rejection silently fails, and the user sees the app fall back to the home screen (possibly via React re-render or ErrorBoundary).

Additionally, `handleStoryGenerated` depends on `useCredit` which depends on `credits` state — creating a stale closure risk when the callback is captured inside GeneratingStep's `setTimeout`.

### Plan

**1. Wrap `handleStoryGenerated` in try/catch with guaranteed navigation**

In `src/pages/CreateStory.tsx`, modify `handleStoryGenerated` so that:
- The entire body is wrapped in try/catch
- `useCredit()` failure does NOT block navigation
- If slug lookup fails, navigate with the raw storyId as fallback
- On any error, still navigate to `/story/${storyId}` as a safety net

```typescript
const handleStoryGenerated = useCallback(async (storyId: string) => {
    // Best-effort credit deduction — never block navigation
    try { await useCredit(); } catch (e) { console.warn("Credit deduction failed:", e); }
    
    // Try to get slug for clean URL, fallback to UUID
    let slug = storyId;
    try {
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.from("stories").select("id, slug").eq("id", storyId).maybeSingle();
        if (data) { slug = data.slug || storyId; break; }
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) { console.warn("Slug lookup failed:", e); }
    
    sessionStorage.setItem("just_created_story", "true");
    navigate(`/story/${slug}`);
}, [useCredit, navigate]);
```

**2. Add `useRef` to stabilize the callback for GeneratingStep**

Use a ref to hold the latest `handleStoryGenerated` so the setTimeout in GeneratingStep always calls the current version, avoiding stale closure issues:

```typescript
const handleStoryGeneratedRef = useRef(handleStoryGenerated);
useEffect(() => { handleStoryGeneratedRef.current = handleStoryGenerated; }, [handleStoryGenerated]);

const stableOnComplete = useCallback((id: string) => handleStoryGeneratedRef.current(id), []);
```

Then pass `stableOnComplete` instead of `handleStoryGenerated` to GeneratingStep.

### Summary
Two changes in `CreateStory.tsx`: (a) error-proof the callback so navigation always happens, (b) stabilize the callback reference to prevent stale closures.

