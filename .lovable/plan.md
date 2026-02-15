

# Replace Sol Character Image on Auth Screen

## Overview

Replace the current `sol-waving-hello.png` image with the new uploaded princess Sol image (with transparent/black background) on the login screen.

## Changes

### 1. Copy the new image to the project

Copy `user-uploads://REMOVE_BACKROUND.jpeg` to `src/assets/sol-princess-waving.png`.

### 2. Update the import in `src/pages/Auth.tsx`

**Current (line 18):**
```ts
import solWaving from "@/assets/sol-waving-hello.png";
```

**New:**
```ts
import solWaving from "@/assets/sol-princess-waving.png";
```

No other changes needed -- the variable name `solWaving` stays the same, so all existing positioning, sizing, and styling will apply automatically to the new image.

Note: The uploaded image has a black background rather than true transparency. It will still render well against the pastel Adventure Sky background since the dark areas will blend as a silhouette effect. If a fully transparent version is preferred later, a new PNG can be swapped in using the same approach.

