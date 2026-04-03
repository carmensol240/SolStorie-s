import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Undo2, Redo2, Download, Printer, ArrowRight, Pencil, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnlineColoringCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundImage: string;
  childName?: string;
  storyTitle?: string;
}

const COLORS = [
  '#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB',
  '#0ABDE3', '#5F27CD', '#FF6FF2', '#EE5A24',
  '#A3CB38', '#1DD1A1', '#C4A35A', '#2C3E50',
  '#FFFFFF', '#000000',
];

const BRUSH_SIZES = [
  { label: 'S', size: 6 },
  { label: 'M', size: 14 },
  { label: 'L', size: 24 },
];

function buildBrushCursor(color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
    <path d='M8 28 L12 14 L18 8 L24 4 L28 4 L28 8 L24 14 L18 18 L14 12 Z' fill='${color}' stroke='%23333' stroke-width='1'/>
    <circle cx='10' cy='26' r='3' fill='${color}' stroke='%23333' stroke-width='1'/>
  </svg>`;
  return `url("data:image/svg+xml,${svg.replace(/#/g, '%23').replace(/\n/g, '')}") 4 28, crosshair`;
}

const ERASER_CURSOR = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='12' cy='12' r='10' fill='white' stroke='%23999' stroke-width='2'/></svg>") 12 12, crosshair`;

function boldenOutlines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const threshold = 180;
  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
    if (avg < threshold) {
      d[i] = d[i + 1] = d[i + 2] = Math.max(0, avg * 0.5);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

export const OnlineColoringCanvas: React.FC<OnlineColoringCanvasProps> = ({
  isOpen, onClose, backgroundImage, childName, storyTitle,
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

  // Undo/Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(snap);
      if (next.length > 30) next.shift();
      return next;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !history[newIdx]) return;
    ctx.putImageData(history[newIdx], 0, 0);
    setHistoryIndex(newIdx);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !history[newIdx]) return;
    ctx.putImageData(history[newIdx], 0, 0);
    setHistoryIndex(newIdx);
  }, [history, historyIndex]);

  useEffect(() => {
    if (!isOpen) return;
    setBgLoaded(false);
    setHistory([]);
    setHistoryIndex(-1);
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
    // Force 9:16 portrait ratio, fitting inside the container
    const targetRatio = 9 / 16;
    let h = Math.floor(rect.height);
    let w = Math.floor(h * targetRatio);
    if (w > rect.width) {
      w = Math.floor(rect.width);
      h = Math.floor(w / targetRatio);
    }
    bgCanvas.width = w; bgCanvas.height = h;
    drawCanvas.width = w; drawCanvas.height = h;
    const ctx = bgCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      boldenOutlines(ctx, w, h);
    }
    // Initial empty snapshot
    const dCtx = drawCanvas.getContext('2d');
    if (dCtx) {
      const snap = dCtx.getImageData(0, 0, w, h);
      setHistory([snap]);
      setHistoryIndex(0);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !bgImageRef.current) return;
    const handler = () => { if (bgImageRef.current) resizeCanvases(bgImageRef.current); };
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
    if (isDrawing) {
      setIsDrawing(false);
      lastPos.current = null;
      saveSnapshot();
    }
  }, [isDrawing, saveSnapshot]);

  const getMergedCanvas = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = canvasRef.current;
    if (!bgCanvas || !drawCanvas) return null;
    const merged = document.createElement('canvas');
    merged.width = bgCanvas.width; merged.height = bgCanvas.height;
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
    win.document.write(`<html><head><title>דף צביעה</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}
      img{max-width:100%;max-height:100vh;object-fit:contain}
      @media print{body{margin:0}img{max-width:100%;max-height:100%}}</style>
      </head><body><img src="${dataUrl}" onload="window.print();window.close()" /></body></html>`);
    win.document.close();
  }, [getMergedCanvas]);

  const cursorStyle = useMemo(() => {
    if (isEraser) return ERASER_CURSOR;
    return buildBrushCursor(color);
  }, [isEraser, color]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col">
      {/* Top bar */}
      <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-500" dir="rtl">
        <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl gap-1 min-h-[40px] px-3">
          <ArrowRight className="w-5 h-5" /> חזרה
        </Button>
        <div className="flex items-center gap-1">
          <Button onClick={undo} variant="ghost" size="icon" disabled={historyIndex <= 0}
            className="text-white hover:bg-white/20 rounded-xl w-10 h-10 disabled:opacity-30">
            <Redo2 className="w-5 h-5" />
          </Button>
          <Button onClick={redo} variant="ghost" size="icon" disabled={historyIndex >= history.length - 1}
            className="text-white hover:bg-white/20 rounded-xl w-10 h-10 disabled:opacity-30">
            <Undo2 className="w-5 h-5" />
          </Button>
          <div className="w-px h-6 bg-white/30 mx-1" />
          <Button onClick={handleSave} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl w-10 h-10">
            <Download className="w-5 h-5" />
          </Button>
          <Button onClick={handlePrint} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl w-10 h-10">
            <Printer className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative flex items-center justify-center overflow-hidden bg-white">
        {!bgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full" />
          </div>
        )}
        <div className="relative" style={{ lineHeight: 0 }}>
          <canvas ref={bgCanvasRef} className="block rounded-lg shadow-lg" />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 touch-none rounded-lg"
            style={{ cursor: cursorStyle }}
            onMouseDown={startDrawing} onMouseMove={draw}
            onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="bg-white border-t-2 border-purple-200 px-3 py-2 space-y-2">
        {/* Tools + Sizes */}
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setIsEraser(false)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              !isEraser ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-50 shadow-md' : 'bg-gray-100 hover:bg-gray-200'
            }`}>
            <Pencil className="w-5 h-5" style={{ color }} />
          </button>
          <button onClick={() => setIsEraser(true)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isEraser ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-50 shadow-md' : 'bg-gray-100 hover:bg-gray-200'
            }`}>
            <Eraser className="w-5 h-5 text-gray-500" />
          </button>
          <div className="w-px h-8 bg-gray-200 mx-1" />
          {BRUSH_SIZES.map((bs) => (
            <button key={bs.size} onClick={() => { setBrushSize(bs.size); setIsEraser(false); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                brushSize === bs.size && !isEraser
                  ? 'ring-2 ring-purple-500 ring-offset-1 bg-purple-50' : 'bg-gray-100 hover:bg-gray-200'
              }`}>
              <div className="rounded-full bg-gray-700" style={{ width: bs.size + 2, height: bs.size + 2 }} />
            </button>
          ))}
        </div>
        {/* Colors */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button key={c} onClick={() => { setColor(c); setIsEraser(false); }}
              className={`w-11 h-11 rounded-full border-[3px] transition-all active:scale-95 ${
                color === c && !isEraser
                  ? 'scale-110 shadow-lg border-gray-700'
                  : 'border-white shadow-md hover:scale-105'
              }`}
              style={{
                backgroundColor: c,
                boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #ddd' : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
