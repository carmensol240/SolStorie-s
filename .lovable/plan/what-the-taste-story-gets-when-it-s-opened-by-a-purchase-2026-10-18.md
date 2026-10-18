# What the taste story gets when it's opened by a purchase

## What I found
- **Print file:** a full-story purchase from the taste's lock screen creates a print file permission for that story. But it does this before checking that the story belongs to the buyer and is still a taste. So a purchase that is refused (someone else's story, or a story already open) could still give the print file for that story.
- **Coloring pages:** coloring credits are a general balance today, not tied to any story. When a taste is opened, the credits for all its pictures (full story), or the 1 credit (digital story), go into the general balance. They can then be spent on any story.

## What will change
1. **Opening comes first.** The purchase opens the taste first, checking the story belongs to the buyer and is still a taste. Only after it opens does the story get its extras.
2. **Full story (69.90):**
   - The print file is tied to that specific story.
   - The coloring pages for every picture in the story are tied to that story: one coloring page per picture, all pages including the ones created after payment.
3. **Digital story (39.90):** 1 coloring page credit tied to that story.
4. **If opening is refused** (not the buyer's story, already open, or an error), the purchase works as a normal purchase. Credits go into the general balance, and the print file isn't tied to someone else's story.
5. **Spending:** when a coloring page is created for this story, the story's own credits are used first, then the general balance. Credits tied to the story can't be spent on another story.
6. **Display:** the story's coloring screen shows "X דפי צביעה כלולים בסיפור הזה".

## What stays the same
Prices, Grow, the other packages, purchases outside the lock screen, and credits customers already have.

## Checks to add
- Full story from the lock screen: print file for that story, and coloring credits equal to the number of pictures, tied to that story.
- Digital story from the lock screen: 1 coloring credit tied to that story, no print file.
- Someone else's story or one already open: no print file for it, credits go into the general balance.
- A coloring page for the story uses the story's credit; a coloring page for another story doesn't touch it.
- The same payment arriving twice doesn't give double credits.

## Technical details
- New table `story_coloring_allowances` (user_id, story_id, remaining, source, order_id, unique per order+story), with grants and owner/admin RLS, written by the service role only.
- `purchase-credits.ts`: for taste packages, call `unlockTasteAndComplete` before granting the PDF and coloring credits. If the result is `unlocked`, insert a story-scoped `pdf_entitlements` row (popular) and an allowance (picture count from `illustration_prompt`, or 1 for single_story). Otherwise fall back to the global grant.
- `generate-coloring-page`: atomically decrement the story allowance first, then the profile's `coloring_credits`.
- Tests in `src/__tests__/free-taste.test.ts` against a pure helper with a fake store.
