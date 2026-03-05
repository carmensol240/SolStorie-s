

## Plan: Rainbow Gradient Splash Screen

### Context
The splash screen (`public/splash-screen.png`) is a **static PNG image** referenced by `index.html` as `apple-touch-startup-image` and in the PWA manifest as a screenshot. It cannot be dynamically styled with CSS — it must be replaced as an image file.

### Problem
Lovable cannot generate or edit raster image files (PNG/JPG). The splash screen is a pre-made static asset.

### What I Can Do
Create an **HTML-based splash/loading screen** that displays while the app initializes, using CSS to render the rainbow gradient background, centered character image, and logo text. This replaces the static PNG experience with a live-rendered splash.

### Changes

#### 1. `index.html` — Add inline splash screen
Add a `<div id="splash">` inside `<body>` before `<div id="root">` with:
- **Background**: soft diagonal gradient (top-left → bottom-right) using pastel versions of the logo colors: `linear-gradient(135deg, #ffcccc, #ffe0b2, #fff9c4, #c8e6c9, #bbdefb, #e1bee7)`
- **Center**: the character image (`sol-superhero-book.png` or `splash-screen.png`)
- **Top**: "SolStorie's™" text with the rainbow gradient style (matching `.logo-rainbow`)
- All styled inline so it renders immediately before CSS/JS loads

#### 2. `src/main.tsx` — Remove splash after React mounts
Add a small snippet after `createRoot().render()` to fade out and remove the `#splash` div once the app is ready.

#### 3. `index.html` — Keep the static PNG reference
The `apple-touch-startup-image` link stays for iOS PWA compatibility, but the visual experience will come from the HTML splash.

### Visual Result
```
┌─────────────────────────┐
│  ╲  pastel rainbow bg  ╱│
│    SolStorie's™ (rainbow)│
│                          │
│      [Sol character]     │
│       (centered)         │
│                          │
│  gradient: soft diagonal │
└─────────────────────────┘
```

### Files changed
- `index.html` — add splash div with inline styles
- `src/main.tsx` — remove splash on mount

