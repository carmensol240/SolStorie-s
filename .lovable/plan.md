

## Plan: Remove Splash Screen

### Changes

#### 1. `index.html`
Remove the entire `#splash` div (lines ~57-72) from the body.

#### 2. `src/main.tsx`
Remove the `requestAnimationFrame` block (lines 9-15) that fades out and removes the splash element.

### Files modified
1. `index.html`
2. `src/main.tsx`

