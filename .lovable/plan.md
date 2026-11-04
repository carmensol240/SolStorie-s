# Make the way back to "My stories" obvious

## What changes

1. **End of story** (the last page, below the talk questions and the "well done" line): two big full-width buttons, at least 52px tall:
   - "📚 לכל הסיפורים שלי" (main orange button) opens the stories library
   - "✨ ליצור סיפור חדש" (outlined button) opens the create page
   The small arrow in the corner of the end page stays as it is.

2. **Reader top bar**: the back button currently shows an arrow with only the word "חזרה". It will show an arrow and "הסיפורים שלי" side by side, on phone and on desktop. It still goes to the library.

3. **One-time hint**: the first time someone opens a story, a small bubble appears under the back button: "כאן חוזרים לכל הסיפורים שלכם", with an X button. It closes when they press X, tap the back button or turn a page. After that it never appears again for that user, because it's remembered in this browser per user. It won't show on public or shared story pages.

4. **Bottom menu**: rename "ספרייה" to "הסיפורים שלי". The current tab already sets aria-current. Its highlight will also apply when inside a story or on library sub-pages, and I'll add a small dot under the active tab so it's clearer.

## Not touched
Payments, credits, story creation, story text, the print file.

## Checking
Screenshots at 390px (phone) and 1366×768 (desktop) of: the top bar with the hint bubble, the top bar after the hint is closed, the end page with the two buttons, and the bottom menu with "הסיפורים שלי" active. I'll send them before you publish.

## Technical details
- `BookHeader.tsx`: back button label becomes "הסיפורים שלי". It gets an optional `showBackHint` / `onDismissBackHint` that draws an anchored bubble with role="status" and an X with aria-label="סגירה".
- `StoryViewer.tsx`: the hint state uses the localStorage key `user_{userId}_story_back_hint_seen`. Add the two end-page buttons, which navigate to `/library` and `/create`.
- `MobileNavigation.tsx`: rename the tab label. Active match becomes `pathname.startsWith(path)`, and `/story/*` maps to `/library`. Add the active dot.
- `PageTitle.tsx`: the library title becomes "הסיפורים שלי".
