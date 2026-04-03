import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Undo2, Redo2, Download, Printer, ArrowRight, PaintBucket, Eraser } from 'lucide-react';
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

const FILL_CURSOR = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2'><path d='M2 22l1-1h3l9-9'/><path d='M3 21v-3l9-9'/><path d='M14.5 5.5l4-4 4 4-4 4z'/><path d='M12 8l4-4'/><path d='M19 15v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3.28a1 1 0 01.684-.948L19 15z' fill='%234488ff'/></svg>") 2 22, crosshair`;

const ERASER_CURSOR = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='12' cy='12' r='10' fill='white' stroke='%23999' stroke-width='2'/></svg>") 12 12, crosshair`;

const ERASER_SIZE = 30;

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

function hexToRgba(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}

function colorsMatch(a: Uint8ClampedArray, idx: number, target: [number, number, number, number], tolerance: number): boolean {
  return (
    Math.abs(a[idx] - target[0]) <= tolerance &&
    Math.abs(a[idx + 1] - target[1]) <= tolerance &&
    Math.abs(a[idx + 2] - target[2]) <= tolerance &&
    Math.abs(a[idx + 3] - target[3]) <= tolerance
  );
}

function floodFill(
  drawCtx: CanvasRenderingContext2D,
  bgCtx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  w: number,
  h: number,
  tolerance = 32
) {
  // Merge bg + draw to detect boundaries
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = w;
  mergedCanvas.height = h;
  const mergedCtx = mergedCanvas.getContext('2d')!;
  mergedCtx.drawImage(bgCtx.canvas, 0, 0);
  mergedCtx.drawImage(drawCtx.canvas, 0, 0);

  const mergedData = mergedCtx.getImageData(0, 0, w, h);
  const md = mergedData.data;

  const drawData = drawCtx.getImageData(0, 0, w, h);
  const dd = drawData.data;

  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

  const startIdx = (sy * w + sx) * 4;
  const targetColor: [number, number, number, number] = [md[startIdx], md[startIdx + 1], md[startIdx + 2], md[startIdx + 3]];
  const fillColor = hexToRgba(fillColorHex);

  // Don't fill if target is already the fill color (on merged view)
  if (
    Math.abs(targetColor[0] - fillColor[0]) <= 2 &&
    Math.abs(targetColor[1] - fillColor[1]) <= 2 &&
    Math.abs(targetColor[2] - fillColor[2]) <= 2
  ) return;

  // Don't fill dark outline pixels
  const avgTarget = (targetColor[0] + targetColor[1] + targetColor[2]) / 3;
  if (avgTarget < 80) return;

  const visited = new Uint8Array(w * h);
  const queue: number[] = [sx, sy];
  visited[sy * w + sx] = 1;

  while (queue.length > 0) {
    const cy = queue.pop()!;
    const cx = queue.pop()!;
    const idx = (cy * w + cx) * 4;

    // Write to draw layer
    dd[idx] = fillColor[0];
    dd[idx + 1] = fillColor[1];
    dd[idx + 2] = fillColor[2];
    dd[idx + 3] = fillColor[3];

    // Check 4 neighbors
    const neighbors = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const nPos = ny * w + nx;
      if (visited[nPos]) continue;
      visited[nPos] = 1;
      const nIdx = nPos * 4;
      if (colorsMatch(md, nIdx, targetColor, tolerance)) {
        queue.push(nx, ny);
      }
    }
  }

  drawCtx.putImageData(drawData, 0, 0);
}

export const OnlineColoringCanvas: React.FC<OnlineColoringCanvasProps> = ({
  isOpen, onClose, backgroundImage, childName, storyTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [isEraser, setIsEraser] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

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
    const imgRatio = img.naturalWidth / img.naturalHeight;
    let w: number, h: number;
    if (rect.width / rect.height > imgRatio) {
      h = Math.floor(rect.height);
      w = Math.floor(h * imgRatio);
    } else {
      w = Math.floor(rect.width);
      h = Math.floor(w / imgRatio);
    }
    bgCanvas.width = w; bgCanvas.height = h;
    drawCanvas.width = w; drawCanvas.height = h;
    const ctx = bgCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      const coverScale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const drawW = img.naturalWidth * coverScale;
      const drawH = img.naturalHeight * coverScale;
      const offsetX = (w - drawW) / 2;
      const offsetY = (h - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      boldenOutlines(ctx, w, h);
    }
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

  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getCanvasPos(e);

    if (isEraser) {
      setIsDrawing(true);
      lastPos.current = pos;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ERASER_SIZE, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    // Flood fill
    const drawCtx = canvasRef.current?.getContext('2d');
    const bgCtx = bgCanvasRef.current?.getContext('2d');
    if (!drawCtx || !bgCtx || !canvasRef.current) return;
    floodFill(drawCtx, bgCtx, pos.x, pos.y, color, canvasRef.current.width, canvasRef.current.height);
    saveSnapshot();
  }, [getCanvasPos, isEraser, color, saveSnapshot]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !isEraser || !canvasRef.current || !lastPos.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const currentPos = getCanvasPos(e);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.lineWidth = ERASER_SIZE * 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPos.current = currentPos;
  }, [isDrawing, isEraser, getCanvasPos]);

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
    return isEraser ? ERASER_CURSOR : FILL_CURSOR;
  }, [isEraser]);

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
            onMouseDown={handlePointerDown} onMouseMove={handlePointerMove}
            onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="bg-white border-t-2 border-purple-200 px-3 py-2 space-y-2">
        {/* Tools */}
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setIsEraser(false)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              !isEraser ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-50 shadow-md' : 'bg-gray-100 hover:bg-gray-200'
            }`}>
            <PaintBucket className="w-5 h-5" style={{ color }} />
          </button>
          <button onClick={() => setIsEraser(true)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isEraser ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-50 shadow-md' : 'bg-gray-100 hover:bg-gray-200'
            }`}>
            <Eraser className="w-5 h-5 text-gray-500" />
          </button>
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
