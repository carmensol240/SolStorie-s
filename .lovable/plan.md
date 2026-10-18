# Packages, credits that remember their package, coloring pages and the print file

## How the system knows which credit came from which package today
It doesn't. A credit is just a number on the account. Once it's added, nothing records whether it came from a digital story or a full story.

The print file and coloring pages are decided by looking at the purchase history, not by the story:
- One full-story purchase (or any purchase that isn't a single story) currently opens the print file and coloring pages for **every** story on the account, forever, and also skips the lock on every story. That's a hole: one purchase opens everything.
- Someone who bought a digital story can't color, even though the digital package is supposed to include coloring pages.
- Separately there's a print file permission per story, which the story screen doesn't actually read.

So yes, this needs to change.

## The new rule
- **Every credit remembers its package:** digital or full.
- **Using a credit** (creating a new story, or opening a taste from the library or the lock screen) attaches the story to that package:
  - Digital story: the story opens, along with all its coloring pages.
  - Full story: as above, plus the print file for that story.
- **When the parent has both kinds**, they choose: a short question before creating or opening, "use a full story credit (with print file) or a digital one?". With only one kind, there's no question.
- The account screen shows separately: "X digital stories, Y full stories".
- There are no paying customers yet, so existing credits are treated as digital and nothing is migrated.

## Additional decisions (from the packages document)
1. **One source** for prices, package contents and Grow links: digital story 39.90, full story 69.90 (with the new Grow link), print file 34.90. The home page, lock screens (including the taste lock screen), purchase screen, coloring screen and server all read from it. The check of the amount paid stays exactly as it is.
2. **Home page, "how much does it cost":** each card shows what it includes. The full story card shows "כל מה שבסיפור הדיגיטלי, ובנוסף: קובץ להדפסת הספר בבית".
3. **Lock screen:** shows the two packages from the central source.
4. **Coloring pages:** a purchased story (digital, full, or an opened taste) opens all of its own coloring pages for online coloring and printing. A coloring page is created only when the parent opens it. Separate coloring credits are no longer used: the coloring bundle (24.90), the single coloring page (9.90) and the story coloring credits I built for the taste in the previous step are replaced by this rule. Anyone who already bought keeps what they got.
5. **Print file offer:** for a digital-only story, the end of the story shows "רוצים להדפיס את הספר? קובץ להדפסה – 34.90 ₪". There's also a permanent button on the story screen and on the story's library card until the file is bought. Not a pop-up.
6. **The "one purchase opens everything" hole is closed:** access is per story only.

## Old items I propose to delete (pending your approval)
- The purchase window with 129.90 ₪
- The coloring purchase window (24.90)
- The print file offer pop-up (59.90 in its wording), replaced by the permanent button
- The "sample book" window on the purchase screen, if it shows old prices (I'll check its contents before deleting)
- The old "basic" package and "single digital story": merged into one digital story
- Coloring packages (24.90, 9.90): removed from the site, while the server still accepts payments for purchases already made
- Promotion prices that have ended (29.90 / 99.90 / 59.90)
- The old price lists in the comments of the server code

The 2-story gift card isn't in your document. It currently costs 69.90, the same as the full story, so the server can't tell them apart by amount. I'll need your decision on whether to remove it or give it a different price.

## Places in the code with prices (to be switched to the central source)
- The price list on the site and the Grow links
- The home page, the purchase screen, the lock screen, the purchase window with 129.90, the coloring window with 24.90
- The story screen (print file offer), the gift card
- The server: the package price list, the amount-to-package matching, granting credits
- The confirmation emails (if they show an amount)

## What needs to be set on the new Grow link (69.90)
- Product amount: 69.90.
- The link should go to the same webhook as the other links.
- The site adds three fields to the link itself when the parent clicks, so nothing needs to be typed into Grow: field 1 (user identity), field 2 = `popular` (the package), field 3 = the story (when buying from a lock screen). Field passing ("cField") needs to be allowed on the link, just like the existing links.
- If the fields are missing, the server identifies the package by amount (69.90) and the buyer by email.

## Checks
- Digital purchase: all coloring pages for the story are open, the print file is locked, and the offer appears.
- Full purchase: coloring pages and the print file are open, and the offer doesn't appear.
- A full credit / digital credit used on a new story or a taste: the same, for that story only.
- With both kinds: the choice is respected, and the right kind of credit is the one used.
- An unpurchased story: coloring pages and the print file are locked. A purchase for one story doesn't open another.
- A payment lower than the package price doesn't grant it, and every amount belongs to exactly one package.
- Every price in the code matches the central source.
- All the free taste checks keep passing (ownership, opening from the lock screen).

## Technical details
- New table `story_credit_lots` (user_id, kind digital|full, remaining, order_id unique). `profiles.story_credits` stays as the total for the existing display and consumers.
- Purchase functions add a lot by package. Spending happens through an RPC, `consume_story_credit(user, kind)`, that atomically decrements the lot and the total. generate-story and unlock-taste-story accept `creditKind` and, on use, grant `story_unlocks` (+ story-scoped `pdf_entitlements` for full).
- Story screen permissions: coloring = the story has an unlock/purchase; print file = a `pdf_entitlements` row for the story (or a global legacy one). The purchase-name check (`hasPurchasedPackage`) is removed.
- generate-coloring-page: allowed if the story is purchased, with no credit charge. The `story_coloring_allowances` from the previous step is marked deprecated.
- A central catalog file shared by the client and `_shared/package-prices.ts`, with a test comparing them.
