# Revert Original Child Photo Thumbnail to object-cover

## Change
In `src/components/wizard/ChildInfoStep.tsx`, the original child photo thumbnail (labeled 'תמונה מקורית', currently `w-32 h-32` at ~line 754) uses `object-contain` on its `<img>`, producing white margins.

Switch the `<img>` class from `object-contain` to `object-cover` so the photo fills the thumbnail completely.

## Out of Scope
- No changes to wrapper size (stays `w-32 h-32`).
- No changes to avatar, layout, label, or arrow.
- No other files touched.
