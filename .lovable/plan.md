

## Plan: Add Background Music Toggle to Story Reader

### Changes

#### 1. Copy audio file to `public/`
Copy `Starfall_Over_Everbright.mp3` to `public/audio/bg-music.mp3` (public folder since it's loaded via `Audio()`, not imported as ES module).

#### 2. Create `src/hooks/use-bg-music.ts`
Simple hook managing an `Audio` instance:
- Starts **muted/off** by default
- `isPlaying` state + `toggle()` function
- Loops the track (`audio.loop = true`)
- Cleans up on unmount (pause + remove)

#### 3. Update `src/components/story/book-frame/BookHeader.tsx`
- Add props: `isMusicPlaying?: boolean`, `onToggleMusic?: () => void`
- Add a small 🔊/🔇 toggle button at the right end of the center actions row
- Uses `Volume2` / `VolumeX` icons from lucide-react

#### 4. Update `src/pages/StoryViewer.tsx`
- Import and use `useBgMusic()` hook
- Pass `isMusicPlaying` and `onToggleMusic` to `BookHeader`

### Files changed
- `public/audio/bg-music.mp3` (copy)
- `src/hooks/use-bg-music.ts` (new)
- `src/components/story/book-frame/BookHeader.tsx` (edit)
- `src/pages/StoryViewer.tsx` (edit)

