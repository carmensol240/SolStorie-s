

## Plan: Add "Clear" Button to Online Coloring Canvas

### Single file: `src/components/story/OnlineColoringCanvas.tsx`

### 1. Add `Trash2` to imports (line 2)
Add `Trash2` to the existing lucide-react import.

### 2. Add `handleClear` function (after `handlePrint`, ~line 476)
Clear only the drawing canvas (user strokes), not the background canvas (the coloring page outline):
```ts
const handleClear = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  saveSnapshot();
}, [saveSnapshot]);
```

### 3. Add button in top bar (line ~508, after the Print button)
Add a "נקה 🗑️" button with `Trash2` icon, styled consistently with the existing top bar buttons:
```tsx
<Button onClick={handleClear} variant="ghost" size="icon" 
  className="text-white hover:bg-white/20 rounded-xl w-9 h-9">
  <Trash2 className="w-4 h-4" />
</Button>
```

### What stays the same
- Background canvas (outline image) untouched
- No credit consumption
- All other tools, colors, undo/redo logic

