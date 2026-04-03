import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Pencil, Eraser, Download, Printer, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnlineColoringCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundImage: string; // data URL or full URL of coloring page
  childName?: string;
  storyTitle?: string;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#FF6348',
];

const BRUSH_SIZES = [
  { label: 'דק', size: 4 },
  { label: 'בינוני', size: 10 },
  { label: 'עבה', size: 20 },
];

export const OnlineColoringCanvas: React.FC<OnlineColoringCanvasProps> = ({
  isOpen,
  onClose,
  backgroundImage,
  childName,
  storyTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].size);
  const [isEraser, setIsEraser] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Load background image and size canvases
  useEffect(() => {
    if (!isOpen) return;
    setBgLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = backgroundImage;
    img.onload = () => {
      bgImageRef.current = img;
      resizeCanvases(img);
      setBgLoaded(true);
    };
  }, [isOpen, backgroundImage]);

  const resizeCanvases = useCallback((img: HTMLImageElement) => {
    const container = containerRef.current;
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = canvasRef.current;
    if (!container || !bgCanvas || !drawCanvas) return;

    const rect = container.getBoundingClientRect();
    const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const w = Math.floor(img.naturalWidth * scale);
    const h = Math.floor(img.naturalHeight * scale);

    bgCanvas.width = w;
    bgCanvas.height = h;
    drawCanvas.width = w;
    drawCanvas.height = h;

    const ctx = bgCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    if (!isOpen || !bgImageRef.current) return;
    const handler = () => {
      if (bgImageRef.current) resizeCanvases(bgImageRef.current);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isOpen, resizeCanvases]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current || !lastPos.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const currentPos = getPos(e);

    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = isEraser ? 1 : 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;

    lastPos.current = currentPos;
  }, [isDrawing, color, brushSize, isEraser, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const getMergedCanvas = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = canvasRef.current;
    if (!bgCanvas || !drawCanvas) return null;

    const merged = document.createElement('canvas');
    merged.width = bgCanvas.width;
    merged.height = bgCanvas.height;
    const ctx = merged.getContext('2d')!;
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(drawCanvas, 0, 0);
    return merged;
  }, []);

  const handleSave = useCallback(() => {
    const merged = getMergedCanvas();
    if (!merged) return;
    merged.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `צביעה-${storyTitle || 'סיפור'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [getMergedCanvas, storyTitle]);

  const handlePrint = useCallback(() => {
    const merged = getMergedCanvas();
    if (!merged) return;
    const dataUrl = merged.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>דף צביעה</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}
      img{max-width:100%;max-height:100vh;object-fit:contain}
      @media print{body{margin:0}img{max-width:100%;max-height:100%}}</style>
      </head><body><img src="${dataUrl}" onload="window.print();window.close()" /></body></html>
    `);
    win.document.close();
  }, [getMergedCanvas]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex flex-col">
      {/* Top toolbar */}
      <div className="flex justify-between items-center p-2 bg-white/95 backdrop-blur-sm border-b-2 border-primary/20" dir="rtl">
        <Button onClick={onClose} variant="ghost" size="sm" className="rounded-2xl gap-1 hover:bg-destructive/10 hover:text-destructive min-h-[44px] px-3">
          <ArrowRight className="w-5 h-5" />
          חזרה
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="ghost" size="sm" className="rounded-2xl gap-1 min-h-[44px] px-3 text-emerald-600 hover:bg-emerald-50">
            <Download className="w-5 h-5" />
            שמור
          </Button>
          <Button onClick={handlePrint} variant="ghost" size="sm" className="rounded-2xl gap-1 min-h-[44px] px-3 text-blue-600 hover:bg-blue-50">
            <Printer className="w-5 h-5" />
            הדפס
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 relative flex items-center justify-center bg-gray-100 overflow-hidden">
        {!bgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
        <div className="relative" style={{ lineHeight: 0 }}>
          <canvas ref={bgCanvasRef} className="block" />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="bg-white/95 backdrop-blur-sm border-t-2 border-primary/20 p-3 space-y-2">
        {/* Tools row */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Brush sizes */}
          {BRUSH_SIZES.map((bs) => (
            <button
              key={bs.size}
              onClick={() => { setBrushSize(bs.size); setIsEraser(false); }}
              className={`min-w-[40px] min-h-[40px] rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
                brushSize === bs.size && !isEraser
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-muted bg-white hover:border-primary/50'
              }`}
            >
              <div className="rounded-full bg-foreground" style={{ width: bs.size + 4, height: bs.size + 4 }} />
            </button>
          ))}

          <div className="w-px h-8 bg-muted mx-1" />

          <button
            onClick={() => setIsEraser(false)}
            className={`min-w-[40px] min-h-[40px] rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
              !isEraser ? 'border-primary bg-primary/10 shadow-md' : 'border-muted bg-white hover:border-primary/50'
            }`}
          >
            <Pencil className="w-5 h-5" style={{ color }} />
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={`min-w-[40px] min-h-[40px] rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
              isEraser ? 'border-primary bg-primary/10 shadow-md' : 'border-muted bg-white hover:border-primary/50'
            }`}
          >
            <Eraser className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Colors row */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setIsEraser(false); }}
              className={`w-8 h-8 rounded-full border-3 transition-all active:scale-95 ${
                color === c && !isEraser
                  ? 'border-foreground scale-110 shadow-lg'
                  : 'border-white shadow-md hover:scale-105'
              }`}
              style={{ backgroundColor: c, borderWidth: color === c && !isEraser ? 3 : 2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
