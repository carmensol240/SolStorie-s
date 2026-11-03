# Story reader picture: before vs now (comparison only, no changes)

## What the code history shows
The change landed on 19/10/2026 (around 10:50-20:00 that day).

**Before 19/10:**
- The picture and the text were on **separate screens**. You swiped from a picture screen to a text screen.
- The picture filled the **whole book area** (about 390 x 650 on a phone) and was cropped to fill it, plus slightly zoomed in (2%).
- The pictures are wide (about 1.8:1). On a tall phone screen this showed only the **middle third** of the picture. Roughly a third of the width was cut off on each side.
- Ages 0-2: the same full-screen cropped picture, with the text written on top of it over a dark shade.

**Now (since 19/10):**
- Picture and text are on the **same screen**: picture on top, text below.
- The picture is shown **whole**, never cropped, inside an area at least 40% of the screen height.
- Because the picture is wide, it fills the full width but only about 210 px of height. The rest of its area is the gray-beige background above and below. That's the "half the height with gray" you see.

## Pros and cons

| | Before (full screen, cropped) | Now (whole picture + text) |
|---|---|---|
| Size | Picture looks big and immersive | Picture looks small, gray bands above and below |
| Characters | **Often cut**: a child or friend at the side of the scene could be half or fully out of frame. Only the center was visible. | Every character is always fully visible |
| Reading | Text on a separate screen, twice the swiping | Text and picture together, one swipe per page |
| Ages 0-2 | Text over the picture with a dark shade (darker picture) | Picture clean, text separate |
| Consistency with print/coloring | Different from the printed book | Same framing as the printed book |

**Answer to the key question:** yes. In the old version characters were cut off on the sides on most pages, because only about 1/3 of each wide picture was visible on a phone.

## Screenshots
I couldn't make screenshots in planning mode, and running the old version would mean restoring old code, which you asked me not to do. If you approve, I'll build a side-by-side phone mockup (390 wide) outside the website, using one of Adel's new pictures:
- left: the old cropped full-screen look
- right: today's look

Nothing on the website will change.

## Possible middle ground (only if you want it later, not part of this)
- Make the picture area use the space better on phones, e.g. a slightly taller box with a light crop only at the top and bottom edges, or tap-to-enlarge to full screen. Characters must still never be cut.

---

# Adel's coloring pages: why only 2 (check only, nothing changed)

## What's in the database
- Story opened: yes, `credit_full` at 19:06 today (from the coupon).
- Print file access: yes (gift_coupon:ORTAL-FULL-7K3Q).
- Coloring pages created from the story: **1** (from page 1, at 20:57, after our redraw).
- Child portrait coloring page: **1** (ready, 20:56).
- Per-story coloring allowance rows: none. General coloring credits: 0. Neither is needed (see below).
- No errors logged for her today.

## How many she should have
- **8**, one per story picture. The server rule: if a story is opened (has an opened-story row) or the user is an admin, **every** picture in it can become a coloring page, free, with no credits.
- Her story passes this rule, so the server would make all 8.

## Why she sees only 2
- Coloring pages are **not made in advance**. Each one is made only when the parent picks a picture and taps "Continue", one at a time, about 20-40 seconds each.
- She made one (page 1). The library lists only pages that were actually made, so it shows 2: the portrait page and page 1.
- After the first one, tapping "Coloring" on the story jumps straight to the page already made. Choosing another picture is only a small gray link, "← בחרו איור אחר", so it's easy to think there are no more pages.

## Ruled out
- **Coupon vs Grow:** not the cause. The server only checks that the story is opened, and it is.
- **Today's coupon fix:** not the cause. Coloring pages never read the credit records it changed.
- **Today's redraw:** not the cause. The redraw didn't delete anything, and her one coloring page was made after it, from the new picture.
- Leftover code: the story screen reads a per-story coloring allowance, but only to show a "N pages included" line. It doesn't limit anything, and she has no such row, so the line doesn't appear.

## Same for regular Grow buyers?
Yes. Any full or digital buyer sees only the pages they create one by one, and lands on the last page they made. It's a display and flow issue, not a missing permission.

## Proposed fix (waiting for your approval)
1. In the coloring window, always open the **picture picker** showing all story pictures. Already-made pages get a "ready" mark and open instantly; the rest show "tap to create".
2. Make "choose another picture" a clear button instead of the small gray link.
3. Optional: in the library, under each opened story, show all of its pictures as coloring pages, with "tap to create" on the ones not made yet.
4. Not proposed: making all 8 automatically when a story is opened. That costs AI for every story, including pages parents may never use. I can add it if you prefer.

Nothing changes for prices, credits or access rules.
