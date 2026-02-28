

## Fix: PuLID Not Being Called Due to Base64 Avatar URL Handling

### Root Cause
The `avatar_url` in the `children` table is stored as a **base64 data URI** (`data:image/png;base64,...`), not a storage path or HTTP URL. The signed URL resolution code (line 654-667 in `generate-illustrations/index.ts`) only handles two cases:
1. URLs starting with `http` → use as-is
2. Everything else → try `createSignedUrl` (which fails on data URIs)

Since `data:image/png;base64,...` doesn't start with `http`, it falls into case 2, the signed URL call fails, `childPhotoSignedUrl` stays `null`, and PuLID is never invoked.

### Fix (3 files)

#### 1. `generate-illustrations/index.ts` (lines 652-667)
Add a third condition: if `effectivePhoto` starts with `data:`, pass it directly (PuLID accepts base64 data URIs).

```typescript
if (effectivePhoto.startsWith("http")) {
  childPhotoSignedUrl = effectivePhoto;
} else if (effectivePhoto.startsWith("data:")) {
  childPhotoSignedUrl = effectivePhoto;  // PuLID accepts base64 data URIs
} else {
  // Storage path — get signed URL
  ...
}
```

#### 2. `retry-illustration/index.ts` (lines ~92-105)
Same fix: when resolving child photo, handle the case where `avatar_url` or `photo_url` is already a data URI. Currently it only tries `createSignedUrl` on storage paths.

#### 3. `generate-cover/index.ts`
Same fix for the child photo resolution logic.

### Additional Improvement
Increase `id_weight` from `0.7` to `0.8` in all three files for stronger facial likeness preservation.

