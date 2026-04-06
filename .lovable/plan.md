

## Plan: Remove Duplicate Icons from Library Tabs

### Problem
Each tab in the library shows both a Lucide line icon (`BookOpen`/`Palette`) and a colorful emoji (📚/🎨), creating a double-icon effect.

### Fix — single file: `src/pages/Library.tsx`

**Lines 735-736**: Remove `<BookOpen className="w-4 h-4" />`, keep `📚 סיפורים`

**Lines 742-743**: Remove `<Palette className="w-4 h-4" />`, keep `🎨 דפי צביעה`

### What stays the same
Everything else — no other changes.

