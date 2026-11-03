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
