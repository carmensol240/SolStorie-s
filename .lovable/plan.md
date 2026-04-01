

## Plan: Fix Page 1 Illustration Loading — Soft Placeholder

### Problem
Story page illustrations use raw `<img>` tags with no loading state. While the image loads, the dark parent background (`#0d0a1f` or dark purple) shows through, appearing as a black screen with no feedback. This is most noticeable on page 1 since it's the first image the user sees after the cover.

### Solution
Add a per-page image loading state that shows a warm, soft placeholder (matching the existing "generating illustration" style) until the image's `onLoad` fires. Then fade in the image.

### Changes — `src/pages/StoryViewer.tsx` only

#### 1. Add image loading state (near line 203)
```tsx
const [imageLoadedMap, setImageLoadedMap] = useState<Record<string, boolean>>({});
```

#### 2. Create a shared warm placeholder component (inline JSX)
For both `combined` and `illustration` page types, wrap the `<img>` with a loading placeholder that shows while the image hasn't loaded yet:

```tsx
{/* Warm loading placeholder — shown until image loads */}
{!imageLoadedMap[currentVirtual.illustrationUrl!] && (
  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#F5E6D3] to-[#FAF3E8] z-[1]">
    <div className="relative z-10 text-center space-y-3">
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 via-pink-300 to-orange-300 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-1 rounded-full bg-white/90 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
      </div>
      <p className="text-xs text-[#8B7355] font-serif">טוען איור...</p>
    </div>
  </div>
)}
```

#### 3. Update `onLoad` on both `<img>` tags (lines ~1608 and ~1693)
Add image-loaded tracking:
```tsx
onLoad={(e) => {
  handleImageLoad(e);
  setImageLoadedMap(prev => ({ ...prev, [currentVirtual.illustrationUrl!]: true }));
}}
```

#### 4. Add fade-in class to images
Add conditional opacity class so images fade in once loaded:
```tsx
className={cn(
  "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
  imageLoadedMap[currentVirtual.illustrationUrl!] ? "opacity-100" : "opacity-0"
)}
```

This applies to all three places where illustration `<img>` tags appear: combined pages (line ~1601), illustration-only pages (line ~1686). The cover page already has its own fallback via `solSuperheroWelcome`.

### Files modified
- `src/pages/StoryViewer.tsx` — add image loading state + warm placeholder + fade-in

