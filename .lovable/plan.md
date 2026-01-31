
# Story Time App Restoration & Enhancement Plan

## Summary
Restore the application to the January 29th stable version, then apply 4 specific improvements to enhance the user experience.

---

## Step 1: Restore to January 29th Version
**Action Required by You:**
Use Lovable's History feature to restore the project to January 29th. This ensures an exact replica of the stable version without any manual code reconstruction.

---

## Step 2: Apply Specific Fixes

### Fix 1: Remove Read-Aloud Button
- Locate and remove any read-aloud/audio playback button from the story viewer
- Ensure the Volume/audio controls only remain in settings (AccessibilityMenu and parental settings)

### Fix 2: Add Global Footer with Payment Note
- Create a new global Footer component
- Display the Hebrew text: **"ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל"** (You can also pay with credit card without a PayPal account)
- Position consistently at the bottom of all pages
- Style to match the existing design language

### Fix 3: Age-Based Story Length Configuration
- Modify the story generation to adjust based on age ranges:
  - **Ages 0-2 (Babies/Toddlers):** Short stories with fewer pages (4 pages) and simpler, shorter text
  - **Ages 7-8 (Older children):** Complex stories with more pages (8 pages) and detailed, richer text
- Pass age-based parameters to the `generate-story` edge function
- Ensure the AI prompt adjusts vocabulary and narrative complexity accordingly

### Fix 4: Full-Screen Layout Verification
- Audit all main pages (Landing, /create, /library) for proper full-screen display
- Fix any scroll issues or cut-off content
- Ensure mobile navigation doesn't overlap content
- Add appropriate bottom padding (100px) for navigation clearance

---

## Expected Outcome
- All pages restored to their January 29th appearance and functionality
- Clean story viewer without read-aloud button
- Payment flexibility message visible site-wide
- Story content appropriately tailored to the child's age
- Seamless full-screen experience across all devices
