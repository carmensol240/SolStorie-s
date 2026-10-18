# Parent control over their data (photos, child profiles, account)

## What I found

1. **"Delete account" doesn't really delete anything today.** The button in Settings leads to an exit screen, and "מחק לצמיתות" only signs the parent out and shows "החשבון נמחק". The account, children, photos and stories all stay. This is the most urgent issue.
2. **Child profile:** there is already a "delete profile" option that removes the photo, the avatar and the profile. Stories stay, without asking. Editing a profile can replace or remove the photo, but there is no clear "מחק את התמונה" button.
3. **Copies of the photo:** besides the profile photo, every free-taste story keeps its own copy of the child's photo, so the rest of the pages can be drawn after payment. Temporary copies made during story creation are deleted automatically after 24 hours.
4. **Illustrations and coloring pages** are saved as image files that anyone with the exact link can open (the links are long and hard to guess). They show the child's likeness and are not deleted today.
5. **Voice recordings** are saved only on the parent's own device, not on our servers. Account deletion will clear them on that device.

## Answer to question 4: is the original photo needed after the story is made?

- **After a story is fully made:** no. The finished story keeps its illustrations, and editing text doesn't need the photo.
- **It is still needed for:** finishing a free taste after payment, the one-time "try again" on page 1, and making a new story for the same child without uploading a photo again.
- **Suggestion (not building now):** automatically delete original photos 90 days after they were last used. Free-taste copies would be deleted once the taste is paid for, or after 90 days if it isn't.
- **What that means for parents:** after deletion, a new story for that child asks for a photo again. The page-1 retry on old stories would rely only on the existing first illustration. An unpaid taste older than 90 days could no longer be finished with the same look.

## Answer to question 5: outside services that receive children's details

| Service | What it receives |
|---|---|
| Lovable AI (Google Gemini) | Child photo, name, age, gender, appearance, personality and hobbies, to write the story and draw the illustrations |
| FAL (Flux image model) | Rarely, as a backup: the illustration description and reference images (the child's photo or the first page) |
| Azure Speech / ElevenLabs | Story text, including the child's name, for reading aloud (accessibility mode) |
| Lovable Cloud (storage and database) | Everything: photos, profiles, stories, illustrations |
| Resend (email) | Parent's email and name; emails may include the child's name |
| Grow (payments) | Parent's name, email and phone, and payment details. Grow keeps its own invoice. |
| Meta / Google Analytics | Only with cookie consent: pages visited and purchases. No child details. |

## What I'll build

1. **"מחק את התמונה"** on each child profile: deletes the original photo from storage, together with the avatar and the free-taste copies for that child, and clears it from the profile. Existing stories stay.
2. **"מחק את הפרופיל"** on each child profile: opens a confirmation screen inside the site where the parent chooses:
   - "להשאיר את הסיפורים": the profile and photos are deleted, and the stories stay in the library.
   - "למחוק גם את הסיפורים": the stories, illustrations, coloring pages and their files are deleted too.
3. **A real "מחק את החשבון"** in Settings:
   - A confirmation screen inside the site lists what will be deleted and says it can't be undone. It shows unused credits ("נותרו לך X קרדיטים שלא נוצלו – הם יימחקו"), and the parent has to type "מחק".
   - Everything is deleted on the server, files included: child profiles, photos, avatars, stories, illustrations, coloring pages, print-file and unlock records, notes, wishlist, feedback, settings, roles, the sign-in account, and recordings on the device.
   - A confirmation email is sent to the parent's address just before it is erased.
4. **What has to stay (bookkeeping):** the purchase records (date, amount, package, status). They are disconnected from the parent, kept under a random anonymous ID, with no name or email. They hold no name or email anyway. Unused credits are not refunded automatically. The invoice inside Grow stays with Grow; we can't delete it, and it is the legal copy for tax purposes. Israeli law requires keeping accounting records for 7 years. Payment-related admin alerts are cleaned of personal details.
5. **Free taste after re-signup:** when an account is deleted, its free-taste records are replaced by one record holding only a one-way code (hash) of the normalized email. There is no user, device or IP in it, and the code doesn't identify the person. If the same email signs up again, the taste check matches the code and no second taste is given. An automated check covers this.
6. **Nothing else changes.**

## Checks

- After deleting a photo, the file no longer exists in storage (checked by listing the folder).
- After deleting an account, there is no record or file left with the parent's ID, email, or the child's name or photo, except the anonymous purchase rows. I'll check this with a test account, every table and every storage folder.
- Deleting a child profile with both options: the stories stay or are removed as chosen.

## Technical details

- New edge function `delete-user-data` (JWT-validated, service role) with actions `delete_child_photo {child_id}`, `delete_child {child_id, delete_stories}` and `delete_account {confirm:'מחק'}`. Ownership is checked on every action.
- Storage cleanup covers `child-photos/{userId}/**` and `taste-refs/{userId}/**` (and `temp-refs`), plus illustrations and coloring images in `story-illustrations` belonging to the user's stories.
- Purchases: `user_id` is replaced by a random UUID. A comment documents the retention.
- The auth user is removed with `auth.admin.deleteUser`, and the profile cascades. The confirmation is sent via Resend from the existing sender before deletion.
- `AccountExit.tsx` gets the real confirm dialog. `ChildProfiles.tsx` gets the photo button and the delete-choice dialog.
