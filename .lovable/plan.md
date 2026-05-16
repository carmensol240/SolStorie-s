Three focused UI edits to `src/components/wizard/ChildInfoStep.tsx`:

1. **Remove the subtitle** — Delete the `<p>` element containing "בחרו פרופיל קיים או צרו חדש" (line ~470).

2. **Move action buttons into the profiles row** — Relocate the "פרופיל חדש +" button and the trash icon from their current position inside the title section to the **left side** of the saved-children flex row, so they sit inline with the profile chips instead of above them.

3. **Tighten spacing above profiles** — Reduce the vertical gap/margin between the title area and the profiles row to make the section more compact.