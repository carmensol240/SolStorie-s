

## Plan: Generate and Show Story Without Signup

### Challenge
The current architecture has three auth-dependent layers:
1. **Edge function** — requires JWT token, validates user, deducts credits
2. **Database RLS** — `stories` and `story_pages` tables block unauthenticated reads
3. **StoryViewer** — queries stories via authenticated Supabase client

All three must be addressed for guest story generation.

### Strategy
Use the existing `PublicStoryViewer` + `get_public_story` RPC (SECURITY DEFINER, bypasses RLS) to display guest stories. This avoids modifying the main StoryViewer.

---

### Changes

#### 1. `supabase/functions/generate-story/index.ts`
- Add a `guestMode` flag check: if `guestMode === true`, skip auth validation and credit deduction
- The function already conditionally sets `user_id` (line 1766: `if (userId) { storyInsertData.user_id = userId; }`)
- For guest mode: set `userId = null`, skip credit check, proceed with story generation as normal
- Add basic rate limiting for guest requests (check IP or add a simple throttle)

#### 2. `src/components/wizard/GeneratingStep.tsx`
- "אולי אחר כך" button: instead of navigating home, set `signupDismissed = true` and trigger `generateStory()`
- Modify `generateStory()`: if no user, pass `guestMode: true` in the request body
- Remove the `if (!user)` guard that prevents generation — allow it when `signupDismissed` is true
- After generation completes for guests, navigate to `/public-story/${slug}` instead of `/story/${slug}` (via a modified `onComplete` or direct navigation)
- Store the generated `storyId` in `sessionStorage` as `guest_story_id` for potential retroactive save

#### 3. `src/pages/CreateStory.tsx`
- Modify `handleStoryGenerated`: check if user is authenticated
  - If yes: navigate to `/story/${slug}` (existing behavior)
  - If no: navigate to `/public-story/${slug}` and set `sessionStorage.setItem('guest_story_id', storyId)`

#### 4. `src/pages/PublicStoryViewer.tsx`
- Add a signup banner at the bottom when `sessionStorage.getItem('guest_story_id')` exists
- Banner text: "💾 הסיפור לא נשמר — הירשמי כדי לשמור אותו!"
- Signup button navigates to `/auth?returnTo=/library&claimStory=STORY_ID`
- After signup (handled in Auth page or via a useEffect): call a "claim story" function to update the story's `user_id`

#### 5. New edge function: `supabase/functions/claim-guest-story/index.ts`
- Accepts `storyId` from authenticated user
- Validates the story has no `user_id` (unclaimed)
- Updates `stories.user_id` to the authenticated user's ID
- Deducts 1 credit from the user's profile (so the free generation is "paid for" retroactively, or skip if first story)

### Files modified
1. `supabase/functions/generate-story/index.ts` — guest mode bypass
2. `src/components/wizard/GeneratingStep.tsx` — dismiss triggers generation
3. `src/pages/CreateStory.tsx` — route guests to public viewer
4. `src/pages/PublicStoryViewer.tsx` — signup banner for guest stories
5. `supabase/functions/claim-guest-story/index.ts` — new function to claim story after signup

### Security considerations
- Guest stories are generated without user_id — they're "orphaned" in the DB
- Rate limiting on guest generation prevents abuse (max 1 guest story per IP per hour)
- Claim function validates story is unclaimed before assigning
- Guest stories without claim can be cleaned up periodically

