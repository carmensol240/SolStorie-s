

# Simplify Navigation and Hide Premium Features

## Overview
Streamline the app to show only two main tabs (Home + Library) in the bottom navigation, hide the Profile/Dashboard screen from general access, and remove Coming Soon / Gift Card / NLP references from the active UI.

## Changes

### 1. Bottom Navigation Bar -- 2 tabs only
**File: `src/components/MobileNavigation.tsx`**
- Remove "פרופיל" (Profile) and "הגדרות" (Settings) from the `navItems` array
- Keep only: Home (`/adventure`) and Library (`/library`)
- Adjust layout spacing for 2 items (wider touch targets)

### 2. Move Settings access to Adventure screen header
**File: `src/pages/Adventure.tsx`**
- Replace the profile avatar button (top-right) with a Settings gear icon that navigates to `/settings`
- This ensures users can still access settings without a nav tab

### 3. Hide Profile route from general access
**File: `src/App.tsx`**
- Keep the `/profile` route in the code (commented or behind a flag) so it can be re-enabled for NLP/Premium users later
- Remove the `/gift` route from active navigation (keep the GiftCard page file intact)
- Keep `/toolkit` route (already behind Coming Soon state)

### 4. Clean up NLP / Coming Soon / Gift references from active UI
**Files to update:**
- **`src/pages/Adventure.tsx`**: Remove profile button that links to the dashboard
- **`src/pages/Profile.tsx`**: Keep the file as-is (hidden from nav, preserved for future NLP package)
- **`src/components/home/ShareBanner.tsx`**: No changes needed (share/referral is separate from gift cards)
- **`src/pages/Settings.tsx`**: Remove any links to gift cards or toolkit if present in the settings menu

### 5. Remove profile button from Adventure header
**File: `src/pages/Adventure.tsx`**
- Replace the profile/avatar circle button with a settings gear icon
- Users access settings via this gear icon instead of through bottom nav

## What stays in the code (hidden, for future re-enable)
- `Profile.tsx` page component -- full "My Journey" + "Parent Notebook" screen
- `Toolkit.tsx` page component -- NLP toolkit
- `GiftCard.tsx` page component
- Routes for `/profile`, `/toolkit`, `/gift` remain in `App.tsx` but `/profile` will only be reachable via direct URL (no UI link)

## Technical Details

### MobileNavigation.tsx
```typescript
const navItems = [
  { path: "/adventure", icon: Home, label: "בית" },
  { path: "/library", icon: Library, label: "ספרייה" },
];
```

### Adventure.tsx header
Replace the profile avatar button with a settings gear:
```tsx
<button
  onClick={() => navigate("/settings")}
  className="..."
  aria-label="הגדרות"
>
  <Settings className="w-4 h-4 text-white" />
</button>
```

### App.tsx
- Keep all routes but add a comment marking `/profile`, `/toolkit`, and `/gift` as premium/hidden routes
- No route removal needed since we want to preserve the logic
