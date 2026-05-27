import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Undo2, Redo2, Download, Printer, ArrowRight, PaintBucket, Eraser, Pencil, Trash2, ScreenShare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnlineColoringCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundImage: string;
  childName?: string;
  storyTitle?: string;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

const COLORS = [
  '#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB',
  '#0ABDE3', '#1B2A4A', '#5F27CD', '#C4B5E0', '#FF6FF2', '#EE5A24',
  '#A3CB38', '#BFFF00', '#1DD1A1', '#C4A35A', '#2C3E50',
  '#FFFFFF',
];

const SKIN_EARTH_COLORS = [
  '#000000', '#C68642', '#8D5524', '#6B8F71', '#FFD700',
  '#C0C0C0', '#8B4513', '#D2691E', '#D4AF37', '#FFB6C1',
  // Additional skin tones
  '#F1C27D', '#FFDBAC', '#E0AC69', '#5C3317',
  // Additional earth / nature tones
  '#228B22', '#808000', '#DAA520', '#E2725B', '#A0522D',
];

type Tool = 'fill' | 'brush' | 'eraser';

const BRUSH_SIZES = [4, 8, 16];

const FILL_CURSOR = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2'><path d='M2 22l1-1h3l9-9'/><path d='M3 21v-3l9-9'/><path d='M14.5 5.5l4-4 4 4-4 4z'/><path d='M12 8l4-4'/><path d='M19 15v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3.28a1 1 0 01.684-.948L19 15z' fill='%234488ff'/></svg>") 2 22, crosshair`;

const ERASER_CURSOR = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='12' cy='12' r='10' fill='white' stroke='%23999' stroke-width='2'/></svg>") 12 12, crosshair`;

const ERASER_SIZE = 10;

/**
 * Binarize the background to pure black-and-white line art.
 * This guarantees no colored/grey pixels remain on the bg layer, so:
 *  - Pages never appear pre-colored from the AI output.
 *  - The eraser (which only clears the draw layer) can remove any color the user paints.
 */
function binarizeToLineArt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const OUTLINE_THRESHOLD = 170;
  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
    if (avg < OUTLINE_THRESHOLD) {
      d[i] = d[i + 1] = d[i + 2] = 0;
    } else {
      d[i] = d[i + 1] = d[i + 2] = 255;
    }
    d[i + 3] = 255;
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

/** Auto-trim white borders from an image, returns the cropped bounds */
function getContentBounds(img: HTMLImageElement, padding = 4): { sx: number; sy: number; sw: number; sh: number } {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const w = c.width;
  const h = c.height;
  const WHITE_THRESH = 245;

  let top = 0, bottom = h - 1, left = 0, right = w - 1;

  // scan top
  outer_top: for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i] < WHITE_THRESH || data[i + 1] < WHITE_THRESH || data[i + 2] < WHITE_THRESH) {
        top = y;
        break outer_top;
      }
    }
  }
  // scan bottom
  outer_bottom: for (let y = h - 1; y >= top; y--) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i] < WHITE_THRESH || data[i + 1] < WHITE_THRESH || data[i + 2] < WHITE_THRESH) {
        bottom = y;
        break outer_bottom;
      }
    }
  }
  // scan left
  outer_left: for (let x = 0; x < w; x++) {
    for (let y = top; y <= bottom; y++) {
      const i = (y * w + x) * 4;
      if (data[i] < WHITE_THRESH || data[i + 1] < WHITE_THRESH || data[i + 2] < WHITE_THRESH) {
        left = x;
        break outer_left;
      }
    }
  }
  // scan right
  outer_right: for (let x = w - 1; x >= left; x--) {
    for (let y = top; y <= bottom; y++) {
      const i = (y * w + x) * 4;
      if (data[i] < WHITE_THRESH || data[i + 1] < WHITE_THRESH || data[i + 2] < WHITE_THRESH) {
        right = x;
        break outer_right;
      }
    }
  }

  // add small padding
  top = Math.max(0, top - padding);
  left = Math.max(0, left - padding);
  bottom = Math.min(h - 1, bottom + padding);
  right = Math.min(w - 1, right + padding);

  return { sx: left, sy: top, sw: right - left + 1, sh: bottom - top + 1 };
}

function floodFill(
  drawCtx: CanvasRenderingContext2D,
  bgCtx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  w: number,
  h: number,
  tolerance = 12
) {
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

  if (
    Math.abs(targetColor[0] - fillColor[0]) <= 2 &&
    Math.abs(targetColor[1] - fillColor[1]) <= 2 &&
    Math.abs(targetColor[2] - fillColor[2]) <= 2
  ) return;

  const avgTarget = (targetColor[0] + targetColor[1] + targetColor[2]) / 3;
  if (avgTarget < 80) return;

  const visited = new Uint8Array(w * h);
  const queue: number[] = [sx, sy];
  visited[sy * w + sx] = 1;

  while (queue.length > 0) {
    const cy = queue.pop()!;
    const cx = queue.pop()!;
    const idx = (cy * w + cx) * 4;

    dd[idx] = fillColor[0];
    dd[idx + 1] = fillColor[1];
    dd[idx + 2] = fillColor[2];
    dd[idx + 3] = fillColor[3];

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

function floodErase(
  drawCtx: CanvasRenderingContext2D,
  startX: number, startY: number,
  w: number, h: number,
  tolerance = 32
) {
  const drawData = drawCtx.getImageData(0, 0, w, h);
  const dd = drawData.data;
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

  const startIdx = (sy * w + sx) * 4;
  if (dd[startIdx + 3] === 0) return;

  const targetColor: [number, number, number, number] = [dd[startIdx], dd[startIdx+1], dd[startIdx+2], dd[startIdx+3]];
  const visited = new Uint8Array(w * h);
  const queue: number[] = [sx, sy];
  visited[sy * w + sx] = 1;

  while (queue.length > 0) {
    const cy = queue.pop()!;
    const cx = queue.pop()!;
    const idx = (cy * w + cx) * 4;
    dd[idx] = dd[idx+1] = dd[idx+2] = dd[idx+3] = 0;

    for (const [nx, ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const nPos = ny * w + nx;
      if (visited[nPos]) continue;
      visited[nPos] = 1;
      const nIdx = nPos * 4;
      if (dd[nIdx+3] === 0) continue;
      if (colorsMatch(dd, nIdx, targetColor, tolerance)) {
        queue.push(nx, ny);
      }
    }
  }
  drawCtx.putImageData(drawData, 0, 0);
}

export const OnlineColoringCanvas: React.FC<OnlineColoringCanvasProps> = ({
  isOpen, onClose, backgroundImage, childName, storyTitle,
  onNavigatePrev, onNavigateNext, canGoPrev, canGoNext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [tool, setTool] = useState<Tool>('fill');
  const [brushSize, setBrushSize] = useState(8);
  const [isLandscape, setIsLandscape] = useState(false);
  const orientationLockSupported = useRef(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const trimBoundsRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  // Refs for immediate access in callbacks (avoids stale closures)
  const colorRef = useRef(color);
  const toolRef = useRef(tool);
  const brushSizeRef = useRef(brushSize);

  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Keep refs in sync
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  const selectColor = useCallback((nextColor: string) => {
    colorRef.current = nextColor;
    setColor(nextColor);
    if (toolRef.current === 'eraser') {
      toolRef.current = 'brush';
      setTool('brush');
    }
  }, []);


  // Fullscreen API
  useEffect(() => {
    if (!isOpen) return;
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isOpen]);

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

  const resizeCanvases = useCallback((img: HTMLImageElement) => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = canvasRef.current;
    if (!bgCanvas || !drawCanvas) return;

    // Compute trim bounds once
    if (!trimBoundsRef.current) {
      trimBoundsRef.current = getContentBounds(img);
    }
    const bounds = trimBoundsRef.current;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 768;
    // Measure the canvas container directly — its size is already set by the
    // flex layout (flex-1 min-h-0) AFTER the top/bottom toolbars take their
    // natural height. This avoids guessing toolbar heights.
    const area = canvasAreaRef.current;
    const areaH = area?.clientHeight ?? 0;
    const areaW = area?.clientWidth ?? 0;
    const SAFETY = 4;
    const canvasMaxH = Math.max(120, (areaH || (vh - 240)) - SAFETY);
    const canvasMaxW = Math.max(120, (areaW || (isMobile ? vw : vw)) - SAFETY);

    // Fit-cover: the canvas takes the full available area, and we crop the
    // source image (centered) to match the area aspect ratio. The trimmed
    // line art is roughly square; cover only crops the white margin that
    // getContentBounds left as padding, so no line art is lost in practice.
    const w = Math.round(canvasMaxW);
    const h = Math.round(canvasMaxH);
    const areaRatio = w / h;
    const imgRatio = bounds.sw / bounds.sh;

    let srcX = bounds.sx;
    let srcY = bounds.sy;
    let srcW = bounds.sw;
    let srcH = bounds.sh;
    if (imgRatio > areaRatio) {
      // Source is wider than target → crop horizontally (left/right).
      const newSrcW = bounds.sh * areaRatio;
      srcX = bounds.sx + (bounds.sw - newSrcW) / 2;
      srcW = newSrcW;
    } else {
      // Source is taller/squarer than target → crop vertically (top/bottom).
      const newSrcH = bounds.sw / areaRatio;
      srcY = bounds.sy + (bounds.sh - newSrcH) / 2;
      srcH = newSrcH;
    }

    bgCanvas.width = w; bgCanvas.height = h;
    drawCanvas.width = w; drawCanvas.height = h;

    const ctx = bgCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, w, h);
      binarizeToLineArt(ctx, w, h);
    }
    const dCtx = drawCanvas.getContext('2d');
    if (dCtx) {
      // Ensure the draw layer starts completely empty on every load.
      dCtx.clearRect(0, 0, w, h);
      const snap = dCtx.getImageData(0, 0, w, h);
      setHistory([snap]);
      setHistoryIndex(0);
    }
  }, []);

  const toggleLandscape = useCallback(async () => {
    const goLandscape = !isLandscape;
    setIsLandscape(goLandscape);
    try {
      if (goLandscape) {
        await (screen.orientation as any).lock('landscape');
        orientationLockSupported.current = true;
      } else {
        (screen.orientation as any).unlock();
      }
    } catch {
      orientationLockSupported.current = false;
    }
    setTimeout(() => {
      if (bgImageRef.current) resizeCanvases(bgImageRef.current);
    }, 150);
  }, [isLandscape, resizeCanvases]);

  const handleClose = useCallback(() => {
    if (isLandscape) {
      try { (screen.orientation as any).unlock(); } catch {}
      setIsLandscape(false);
    }
    onClose();
  }, [isLandscape, onClose]);
  useEffect(() => {
    if (!isOpen) return;
    setBgLoaded(false);
    setHistory([]);
    setHistoryIndex(-1);
    trimBoundsRef.current = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = backgroundImage;
    img.onload = () => {
      bgImageRef.current = img;
      resizeCanvases(img);
      setBgLoaded(true);
    };
  }, [isOpen, backgroundImage]);

  useEffect(() => {
    if (!isOpen || !bgImageRef.current) return;
    const handler = () => { if (bgImageRef.current) resizeCanvases(bgImageRef.current); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isOpen, resizeCanvases]);

  // Re-measure when toolbar height or canvas area size changes
  // (e.g., color rows wrapping, brush sizes appearing, orientation change).
  useEffect(() => {
    if (!isOpen) return;
    const bottom = bottomBarRef.current;
    const top = topBarRef.current;
    const area = canvasAreaRef.current;
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (bgImageRef.current) resizeCanvases(bgImageRef.current);
    });
    if (bottom) ro.observe(bottom);
    if (top) ro.observe(top);
    if (area) ro.observe(area);
    return () => ro.disconnect();
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
    const currentTool = toolRef.current;
    const currentColor = colorRef.current;
    const currentBrushSize = brushSizeRef.current;

    if (currentTool === 'eraser') {
      const drawCtx = canvasRef.current?.getContext('2d');
      if (!drawCtx || !canvasRef.current) return;
      floodErase(drawCtx, pos.x, pos.y, canvasRef.current.width, canvasRef.current.height);
      saveSnapshot();
      return;
    }

    if (currentTool === 'brush') {
      setIsDrawing(true);
      lastPos.current = pos;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = currentColor;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, currentBrushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    // fill tool
    const drawCtx = canvasRef.current?.getContext('2d');
    const bgCtx = bgCanvasRef.current?.getContext('2d');
    if (!drawCtx || !bgCtx || !canvasRef.current) return;
    floodFill(drawCtx, bgCtx, pos.x, pos.y, currentColor, canvasRef.current.width, canvasRef.current.height);
    saveSnapshot();
  }, [getCanvasPos, saveSnapshot]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current || !lastPos.current) return;
    const currentTool = toolRef.current;
    if (currentTool !== 'brush') return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const currentPos = getCanvasPos(e);

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = brushSizeRef.current;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
    lastPos.current = currentPos;
  }, [isDrawing, getCanvasPos]);

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
      <style>
        body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}
        img{max-width:100%;max-height:100vh;object-fit:contain}
        @media print{
          @page { margin: 0; }
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
          body > *:not(img) { display: none !important; }
          img {
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            max-height: 100% !important;
            page-break-inside: avoid;
            display: block;
          }
        }
      </style>
      </head><body><img src="${dataUrl}" onload="window.print();window.close()" /></body></html>`);
    win.document.close();
  }, [getMergedCanvas]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
  }, [saveSnapshot]);

  const cursorStyle = useMemo(() => {
    if (tool === 'eraser') return ERASER_CURSOR;
    if (tool === 'brush') return `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize + 4}' height='${brushSize + 4}'><circle cx='${(brushSize + 4) / 2}' cy='${(brushSize + 4) / 2}' r='${brushSize / 2}' fill='${encodeURIComponent(color)}' stroke='%23333' stroke-width='1'/></svg>") ${(brushSize + 4) / 2} ${(brushSize + 4) / 2}, crosshair`;
    return FILL_CURSOR;
  }, [tool, color, brushSize]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden" style={{
      height: '100dvh',
      ...(isLandscape && !orientationLockSupported.current ? {
        transform: 'rotate(-90deg)',
        transformOrigin: 'center center',
        width: '100dvh',
        height: '100vw',
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        marginTop: 'calc(-50vw)',
        marginLeft: 'calc(-50dvh)',
      } : {})
    }}>
      {/* Top bar */}
      <div ref={topBarRef} className="flex-shrink-0 flex justify-between items-center px-2 py-1.5 bg-gradient-to-r from-purple-600/90 to-pink-500/90" dir="rtl">
        <Button onClick={handleClose} variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl gap-1 min-h-[36px] px-2 text-sm">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
        <div className="flex items-center gap-0.5">
          <Button onClick={undo} variant="ghost" size="icon" disabled={historyIndex <= 0}
            className="text-white hover:bg-white/20 rounded-xl w-9 h-9 disabled:opacity-30">
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button onClick={redo} variant="ghost" size="icon" disabled={historyIndex >= history.length - 1}
            className="text-white hover:bg-white/20 rounded-xl w-9 h-9 disabled:opacity-30">
            <Undo2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-white/30 mx-0.5" />
          <Button onClick={handleSave} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl w-9 h-9">
            <Download className="w-4 h-4" />
          </Button>
          <Button onClick={handlePrint} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl w-9 h-9">
            <Printer className="w-4 h-4" />
          </Button>
          <Button onClick={handleClear} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl w-9 h-9" title="נקה צביעה">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button onClick={toggleLandscape} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl w-9 h-9" title={isLandscape ? 'מצב עומד' : 'מצב רוחב'}>
            {isLandscape ? <Smartphone className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
          </Button>
          {(canGoPrev || canGoNext) && (
            <div className="hidden md:flex items-center">
              <div className="w-px h-5 bg-white/30 mx-0.5" />
              {canGoPrev && onNavigatePrev && (
                <Button onClick={onNavigatePrev} variant="ghost" size="icon"
                  className="text-white hover:bg-white/20 rounded-xl w-9 h-9"
                  aria-label="דף קודם">
                  <span className="text-lg font-bold">❮</span>
                </Button>
              )}
              {canGoNext && onNavigateNext && (
                <Button onClick={onNavigateNext} variant="ghost" size="icon"
                  className="text-white hover:bg-white/20 rounded-xl w-9 h-9"
                  aria-label="דף הבא">
                  <span className="text-lg font-bold">❯</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div ref={canvasAreaRef} className="flex-1 min-h-0 w-full overflow-hidden bg-white relative flex items-center justify-center">
        {!bgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="animate-spin w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full" />
          </div>
        )}
        <div className="relative" style={{ lineHeight: 0 }}>
          <canvas ref={bgCanvasRef} className="block" />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 touch-none"
            style={{ cursor: cursorStyle }}
            onMouseDown={handlePointerDown} onMouseMove={handlePointerMove}
            onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div ref={bottomBarRef} className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-t border-purple-200 px-2 py-1.5 space-y-1.5" style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 8px) + 8px)` }}>
        {/* Tools */}
        <div className="flex items-center justify-center gap-2">
          <button onPointerDown={(e) => { e.stopPropagation(); toolRef.current = 'fill'; setTool('fill'); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all touch-manipulation ${
              tool === 'fill' ? 'ring-2 ring-purple-500 ring-offset-1 bg-purple-50 shadow-md' : 'bg-gray-100 hover:bg-gray-200'
            }`}>
            <PaintBucket className="w-4 h-4" style={{ color }} />
          </button>
          <button onPointerDown={(e) => { e.stopPropagation(); toolRef.current = 'brush'; setTool('brush'); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all touch-manipulation ${
              tool === 'brush' ? 'ring-2 ring-purple-500 ring-offset-1 bg-purple-50 shadow-md' : 'bg-gray-100 hover:bg-gray-200'
            }`}>
            <Pencil className="w-4 h-4" style={{ color: tool === 'brush' ? color : undefined }} />
          </button>
          <button onPointerDown={(e) => { e.stopPropagation(); toolRef.current = 'eraser'; setTool('eraser'); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all touch-manipulation ${
              tool === 'eraser' ? 'ring-2 ring-purple-500 ring-offset-1 bg-purple-50 shadow-md' : 'bg-gray-100 hover:bg-gray-200'
            }`}>
            <Eraser className="w-4 h-4 text-gray-500" />
          </button>
          {tool === 'brush' && (
            <div className="flex items-center gap-1 mr-2">
              {BRUSH_SIZES.map((s) => (
                <button key={s} onPointerDown={(e) => { e.stopPropagation(); brushSizeRef.current = s; setBrushSize(s); }}
                  className={`rounded-full bg-gray-700 transition-all touch-manipulation ${brushSize === s ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
                  style={{ width: s + 8, height: s + 8 }}
                />
              ))}
            </div>
          )}
        </div>
        {/* Skin & earth tones */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {SKIN_EARTH_COLORS.map((c) => (
            <button key={c}
              onPointerDown={(e) => { e.stopPropagation(); selectColor(c); }}
              className={`w-9 h-9 md:w-11 md:h-11 rounded-full border-2 transition-all active:scale-95 touch-manipulation ${
                color === c && tool !== 'eraser'
                  ? 'scale-110 shadow-lg border-gray-700'
                  : 'border-white shadow-md hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {/* Colors */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {COLORS.map((c) => (
            <button key={c}
              onPointerDown={(e) => { e.stopPropagation(); selectColor(c); }}
              className={`w-9 h-9 md:w-11 md:h-11 rounded-full border-2 transition-all active:scale-95 touch-manipulation ${
                color === c && tool !== 'eraser'
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
