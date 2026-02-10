

## Unified Updates for StoryTime

### 1. Sky Screen (Home) - Remove Redundant Button

**File: `src/components/home/LoggedInHome.tsx`**

The "Sky Screen" currently shows two action buttons for new users:
- The `WelcomeGiftBanner` with a "צור סיפור חדש" button
- The main "יוצאים להרפתקה" CTA button

**Change:** When the `WelcomeGiftBanner` is visible (new users with 1 credit, 0 stories), hide the bottom "יוצאים להרפתקה" button to avoid redundancy. This means:
- Pass a flag or use the same `credits === 1 && storyCount === 0` condition
- Conditionally hide the bottom CTA when the welcome banner is shown
- For returning users (who don't see the banner), the "יוצאים להרפתקה" button remains as the sole CTA

### 2. Child's World (Profile) - Larger Profile Frames

**File: `src/pages/Profile.tsx`**

Enlarge the child profile photo circles from 80x80px to 112x112px (w-28 h-28) for a more dominant, premium feel:
- Update the circular frame dimensions from `w-20 h-20` to `w-28 h-28`
- Increase the fallback initial letter size from `text-2xl` to `text-4xl`
- Keep the gradient border, SignedImage with object-cover, and child name label beneath
- NLP tips box ("הטיפ של כרמית") stays unchanged
- Core input fields (hobbies, challenges, friends) stay unchanged

### 3. PWA and Settings - Already Implemented

The PWA configuration (manifest, service worker) and the Settings screen shortcut card ("קיצור דרך למסך הבית") are already in place from the previous implementation. No changes needed.

### 4. Branding and UI Consistency

- "כרמית כהן" is already consistently used in the About sections and tips -- will verify no regressions
- No read-aloud or accessibility icons are visible on main screens (they are tucked inside the Settings accessibility dialog) -- no changes needed
- All images already use `object-cover` -- will be maintained

---

### Technical Details

**Files to modify:**

1. **`src/components/home/LoggedInHome.tsx`** -- Conditionally hide the bottom CTA when `WelcomeGiftBanner` is visible (credits === 1 and storyCount === 0)

2. **`src/pages/Profile.tsx`** -- Increase child photo circle size from `w-20 h-20` to `w-28 h-28`, adjust font size for initials fallback

No new files or dependencies required.
