# Credit reset + story/child link and admin redraw face

Nothing runs until approved.

## Part A: Reset free credits

**Who will actually be reset (checked today):** 72 users: 142 story credits and 20 coloring credits. No one in this group has a full-story credit balance left (that total is 0). The 2 admin accounts (carmit1901@gmail.com, carmit1901+test@gmail.com) are left out. mmnreut12@gmail.com is in the group. The REUT-FULL-1 coupon is not touched, so it still gives her a full story when she uses it.

Steps (one database change):
1. Save a backup in a new admin-only table, `credit_reset_backup_20261104`: user, email, story credits, coloring credits, full-story credits left, and the time.
2. Set story credits, coloring credits and full-story credits left to 0, for that group only.
3. The change marks itself as a server action for this one step. The rule that blocks direct credit changes stays on.
4. Afterwards: count again (expect 0 non-admin users with credits) and confirm the admins and the coupon are unchanged.

Books already opened stay open. Access to them is stored separately and is not touched.

Confusing text: the gift card in the library ("You have N credits… the credit is yours for life") only appears when credits are above 0, so after the reset no one will see it. Nothing changes there.

Test-purchase button:
- The server already refuses test purchases from any address not on its own allowed list, and limits how many each person can make. But that list includes souldesign06, which is not an admin.
- Change: the server allows a test purchase only for an admin (checked on the server). Both the server list and the list in the upgrade page keep only admin addresses, so souldesign06 is removed from both.

## Part B: Noam's story (6ef748d3)

**What I found:**
- The child profile "הילד/ה שלי" is from February. It was not created on the day of this story. With a new profile, the details are saved only when the parent clicks "save". If they continue without clicking, no profile is created, so the story has no linked child and the avatar is not kept. Today's fix sends the child only when a saved profile exists, so here nothing was sent.
- The face for pages 1–7 and 11 came from the story's saved face picture (temp-refs/…). An admin redraw looks for the face only by child name under the account making the request. For an admin, that is the admin's own account, so it found nothing and drew without a face.
- The blue outfit came from the form when the story was created. It was not saved on the story (story_outfit is empty), so the redraw had nothing to copy. Why it was not saved is not fully confirmed. The likely reason: only the automatic fallback outfit is saved, never clothes the parent chose.

**Fix:**
1. Create page: when the parent continues with a filled-in new profile that was not saved, save it automatically (name, picture, avatar). The story is then linked to that child.
2. Redraw (owner or admin): find the face in this order: the story's linked child's avatar → the story's saved face picture. The search uses the story owner, not the admin. If neither exists, stop without drawing and report it. Never draw without a face.
3. Outfit: every first-time drawing saves the final outfit on the story, including clothes the parent chose. A redraw always uses the story's saved outfit.
4. For Noam's story: save the outfit taken from page 1's description ("blue superhero costume with matching blue pants and a soft blue cape"). Then redraw page 9 as an admin, with the face check and no charge. Report the check result and confirm the face was used.

## Technical details
- Credit reset in a migration, with `set_config('request.jwt.claims','{"role":"service_role"}',true)` set inside it, so `prevent_profile_privilege_escalation` lets it through without being turned off. The backup table follows the secure-table template: service_role only, admin SELECT policy.
- verify-purchase testMode: replace the email list check with `has_role(userId,'admin')`, plus verifying that the caller's own token matches userId. Keep the quota.
- generate-illustrations: when there is a storyId, load the story's user_id/child_id/child_photo_path. Look up children by child_id (owner) and fall back to child_photo_path. Single-page with no face → 422 + log. Save story_outfit whenever the resolved outfit is set on a full run. Single-page uses the saved story_outfit first. Same order in retry-illustration.
- ChildInfoStep: auto-save a new profile on Next when the name is filled and it was not saved.
- Update AGENTS.md rules. Run the existing tests.
