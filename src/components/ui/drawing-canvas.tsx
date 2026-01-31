import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Trash2, Pencil, Eraser, Stamp } from 'lucide-react';
import { Button } from './button';

interface DrawingCanvasProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  '#FF6B6B', // Coral
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Mint
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Seafoam
  '#F7DC6F', // Gold
];

const BRUSH_SIZES = [
  { label: 'דק', size: 4 },
  { label: 'בינוני', size: 8 },
  { label: 'עבה', size: 16 },
];

const STICKERS = [
  { emoji: '⭐', label: 'כוכב' },
  { emoji: '❤️', label: 'לב' },
  { emoji: '🌈', label: 'קשת' },
  { emoji: '🦋', label: 'פרפר' },
  { emoji: '🌸', label: 'פרח' },
  { emoji: '🐱', label: 'חתול' },
  { emoji: '🐶', label: 'כלב' },
  { emoji: '🦄', label: 'חד קרן' },
  { emoji: '🌟', label: 'ניצוץ' },
  { emoji: '🎈', label: 'בלון' },
  { emoji: '🍀', label: 'תלתן' },
  { emoji: '🐝', label: 'דבורה' },
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].size);
  const [isEraser, setIsEraser] = useState(false);
  const [isStamping, setIsStamping] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(STICKERS[0].emoji);
  const [stickerSize, setStickerSize] = useState(40);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isOpen]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const placeSticker = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.font = `${stickerSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedSticker, pos.x, pos.y);
  }, [getPos, selectedSticker, stickerSize]);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isStamping) {
      placeSticker(e);
      return;
    }
    setIsDrawing(true);
    lastPos.current = getPos(e);
  }, [getPos, isStamping, placeSticker]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isStamping || !isDrawing || !canvasRef.current || !lastPos.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const currentPos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = isEraser ? brushSize * 2 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = currentPos;
  }, [isDrawing, isStamping, color, brushSize, isEraser, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex flex-col">
      {/* Top toolbar */}
      <div className="flex justify-between items-center p-3 bg-white/95 backdrop-blur-sm border-b-2 border-primary/20">
        <Button
          onClick={onClose}
          variant="ghost"
          size="lg"
          className="rounded-2xl text-lg font-bold gap-2 hover:bg-destructive/10 hover:text-destructive min-h-[48px] px-4"
        >
          <X className="w-6 h-6" />
          סגור
        </Button>
        <Button
          onClick={clearCanvas}
          variant="ghost"
          size="lg"
          className="rounded-2xl text-lg font-bold gap-2 hover:bg-amber-100 text-amber-600 min-h-[48px] px-4"
        >
          <Trash2 className="w-6 h-6" />
          נקה הכל
        </Button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative bg-white/80">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full touch-none ${isStamping ? 'cursor-pointer' : 'cursor-crosshair'}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="bg-white/95 backdrop-blur-sm border-t-2 border-primary/20 p-3 space-y-3">
        {/* Tools row */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Brush sizes - only show when not stamping */}
          {!isStamping && (
            <div className="flex gap-2">
              {BRUSH_SIZES.map((bs) => (
                <button
                  key={bs.size}
                  onClick={() => setBrushSize(bs.size)}
                  className={`min-w-[44px] min-h-[44px] rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
                    brushSize === bs.size && !isEraser
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-muted bg-white hover:border-primary/50'
                  }`}
                >
                  <div
                    className="rounded-full bg-foreground"
                    style={{ width: bs.size + 4, height: bs.size + 4 }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Sticker size - only show when stamping */}
          {isStamping && (
            <div className="flex gap-2">
              {[30, 40, 56].map((size) => (
                <button
                  key={size}
                  onClick={() => setStickerSize(size)}
                  className={`min-w-[44px] min-h-[44px] rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
                    stickerSize === size
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-muted bg-white hover:border-primary/50'
                  }`}
                >
                  <span style={{ fontSize: size * 0.5 }}>{selectedSticker}</span>
                </button>
              ))}
            </div>
          )}

          <div className="w-px h-10 bg-muted mx-1" />

          {/* Tool toggles */}
          <button
            onClick={() => { setIsEraser(false); setIsStamping(false); }}
            className={`min-w-[44px] min-h-[44px] rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
              !isEraser && !isStamping
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-muted bg-white hover:border-primary/50'
            }`}
          >
            <Pencil className="w-5 h-5" style={{ color: color }} />
          </button>
          <button
            onClick={() => { setIsEraser(true); setIsStamping(false); }}
            className={`min-w-[44px] min-h-[44px] rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
              isEraser && !isStamping
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-muted bg-white hover:border-primary/50'
            }`}
          >
            <Eraser className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => { setIsStamping(true); setIsEraser(false); }}
            className={`min-w-[44px] min-h-[44px] rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
              isStamping
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-muted bg-white hover:border-primary/50'
            }`}
          >
            <Stamp className="w-5 h-5 text-amber-500" />
          </button>
        </div>

        {/* Colors row - show when drawing */}
        {!isStamping && (
          <div className="flex items-center justify-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className={`w-9 h-9 rounded-full border-4 transition-all active:scale-95 ${
                  color === c && !isEraser
                    ? 'border-foreground scale-110 shadow-lg'
                    : 'border-white shadow-md hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Stickers row - show when stamping */}
        {isStamping && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {STICKERS.map((sticker) => (
              <button
                key={sticker.emoji}
                onClick={() => setSelectedSticker(sticker.emoji)}
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-2xl transition-all active:scale-95 ${
                  selectedSticker === sticker.emoji
                    ? 'border-primary bg-primary/10 shadow-md scale-110'
                    : 'border-muted bg-white hover:border-primary/50 hover:scale-105'
                }`}
              >
                {sticker.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
