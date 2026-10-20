import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Undo2, Redo2, Download, Printer, ArrowRight, PaintBucket, Eraser, Pencil, Trash2, ScreenShare, Smartphone, Minimize2, Palette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { A4_PRINT_HINT, coloringCorsUrl, downloadColoringPdfA4, printColoringA4 } from '@/lib/coloring-a4';
import { normalizeColoringPixels } from '../../../supabase/functions/_shared/coloring-pixels';
import { toast } from 'sonner';

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
  '#FF6B6B', '#EE5A24', '#FF9F43', '#FECA57',
  '#A3CB38', '#1DD1A1', '#48DBFB', '#0ABDE3',
  '#5F27CD', '#FF6FF2', '#C0C0C0', '#2C3E50',
  '#E63946', '#2196F3',
];


const EXTRA_COLORS = [
  '#87CEEB', '#000080', '#9370DB', '#8A2BE2',
  '#FFB6C1',
];

const SKIN_EARTH_COLORS = [
  '#000000', '#FFDBAC', '#F1C27D', '#E0AC69',
  '#C68642', '#8D5524', '#5C3317', '#A0522D',
  '#DAA520', '#808000', '#228B22', '#6B8F71',
];

type Tool = 'fill' | 'brush' | 'eraser';
const ALL_COLORS = [...COLORS, ...SKIN_EARTH_COLORS, ...EXTRA_COLORS];
const MAX_ZOOM = 5;

const BRUSH_SIZES = [4, 8, 16]; // on-screen px; scaled to the internal resolution when drawing
const BRUSH_LABELS: Record<number, string> = { 4: 'מכחול דק', 8: 'מכחול בינוני', 16: 'מכחול עבה' };

/** Fixed internal drawing resolution: long side of the page in canvas pixels. */
export const CANVAS_LONG_SIDE = 2000;
const HISTORY_MAX = 10; // full-res snapshots are large; keep phones safe

const COLOR_NAMES: Record<string, string> = {
  '#FF6B6B': 'אדום בהיר', '#EE5A24': 'כתום אדמדם', '#FF9F43': 'כתום', '#FECA57': 'צהוב',
  '#A3CB38': 'ירוק ליים', '#1DD1A1': 'ירוק מנטה', '#48DBFB': 'תכלת', '#0ABDE3': 'טורקיז',
  '#5F27CD': 'סגול כהה', '#FF6FF2': 'ורוד', '#C0C0C0': 'אפור', '#2C3E50': 'כחול כהה',
  '#E63946': 'אדום', '#2196F3': 'כחול',
  '#87CEEB': 'כחול שמיים', '#000080': 'כחול נייבי', '#9370DB': 'סגול בהיר', '#8A2BE2': 'סגול', '#FFB6C1': 'ורוד בהיר',
  '#000000': 'שחור', '#FFDBAC': 'גוון עור בהיר', '#F1C27D': 'גוון עור בהיר-בינוני', '#E0AC69': 'גוון עור בינוני',
  '#C68642': 'גוון עור שזוף', '#8D5524': 'גוון עור כהה', '#5C3317': 'חום כהה', '#A0522D': 'חום',
  '#DAA520': 'זהב', '#808000': 'ירוק זית', '#228B22': 'ירוק יער', '#6B8F71': 'ירוק מרווה',
};
export const colorName = (hex: string) => COLOR_NAMES[hex.toUpperCase()] || 'צבע';

const FILL_CURSOR = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2'><path d='M2 22l1-1h3l9-9'/><path d='M3 21v-3l9-9'/><path d='M14.5 5.5l4-4 4 4-4 4z'/><path d='M12 8l4-4'/><path d='M19 15v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3.28a1 1 0 01.684-.948L19 15z' fill='%234488ff'/></svg>") 2 22, crosshair`;

const ERASER_CURSOR = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='12' cy='12' r='10' fill='white' stroke='%23999' stroke-width='2'/></svg>") 12 12, crosshair`;


/**
 * Turn the background into pure black-and-white line art without solid black areas.
 * A clean page is only thresholded; a page with color or wide dark areas keeps its thin
 * lines and gets white fills with outlines (never black blobs a child cannot color).
 */
function binarizeToLineArt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  normalizeColoringPixels(imageData.data, w, h);
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
  const zoomWrapRef = useRef<HTMLDivElement>(null);
  const strokeActive = useRef(false);
  const viewRef = useRef({ s: 1, x: 0, y: 0 });
  const [zoomed, setZoomed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sideLayout, setSideLayout] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [tool, setTool] = useState<Tool>('fill');
  const [brushSize, setBrushSize] = useState(8);
  const [isLandscape, setIsLandscape] = useState(false);
  const orientationLockSupported = useRef(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgError, setBgError] = useState(false);
  const [bgRetry, setBgRetry] = useState(0);
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
      if (next.length > HISTORY_MAX) next.shift();
      return next;
    });
    setHistoryIndex(prev => Math.min(prev + 1, HISTORY_MAX - 1));
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

  const latest = useRef({ saveSnapshot, history, historyIndex });
  latest.current = { saveSnapshot, history, historyIndex };

  // Side toolbar when the screen is wider than tall (phone landscape, desktop).
  useEffect(() => {
    if (!isOpen) return;
    const update = () => setSideLayout(isLandscape || window.innerWidth > window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isOpen, isLandscape]);

  // Set up both canvases ONCE per image at a fixed internal resolution.
  // Never called on resize — resizing only changes the CSS display size (layoutCanvases).
  const setupCanvases = useCallback((img: HTMLImageElement) => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = canvasRef.current;
    if (!bgCanvas || !drawCanvas) return;
    if (!trimBoundsRef.current) trimBoundsRef.current = getContentBounds(img);
    const bounds = trimBoundsRef.current;
    const k = CANVAS_LONG_SIDE / Math.max(bounds.sw, bounds.sh);
    const w = Math.round(bounds.sw * k);
    const h = Math.round(bounds.sh * k);
    bgCanvas.width = w; bgCanvas.height = h;
    drawCanvas.width = w; drawCanvas.height = h;
    const ctx = bgCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, bounds.sx, bounds.sy, bounds.sw, bounds.sh, 0, 0, w, h);
      binarizeToLineArt(ctx, w, h);
    }
    const dCtx = drawCanvas.getContext('2d');
    if (dCtx) {
      dCtx.clearRect(0, 0, w, h);
      setHistory([dCtx.getImageData(0, 0, w, h)]);
      setHistoryIndex(0);
    }
  }, []);

  // Fit-contain the canvases inside the available area via CSS only. Never touches pixels.
  const layoutCanvases = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = canvasRef.current;
    const area = canvasAreaRef.current;
    if (!bgCanvas || !drawCanvas || !bgCanvas.width) return;
    const SAFETY = 4;
    const maxW = Math.max(120, (area?.clientWidth || window.innerWidth) - SAFETY);
    const maxH = Math.max(120, (area?.clientHeight || window.innerHeight - 240) - SAFETY);
    const k = Math.min(maxW / bgCanvas.width, maxH / bgCanvas.height);
    const cssW = `${Math.floor(bgCanvas.width * k)}px`;
    const cssH = `${Math.floor(bgCanvas.height * k)}px`;
    for (const c of [bgCanvas, drawCanvas]) { c.style.width = cssW; c.style.height = cssH; }
    // New fit size: go back to "fit to screen" so the page never ends up off-screen.
    viewRef.current = { s: 1, x: 0, y: 0 };
    if (zoomWrapRef.current) zoomWrapRef.current.style.transform = '';
    setZoomed(false);
  }, []);

  /** Internal canvas pixels per on-screen pixel (for brush thickness). */
  const pxScale = () => {
    const c = canvasRef.current;
    if (!c) return 1;
    const r = c.getBoundingClientRect();
    return r.width ? c.width / r.width : 1;
  };

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
    setTimeout(layoutCanvases, 150);
  }, [isLandscape, layoutCanvases]);

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
    setBgError(false);
    setHistory([]);
    setHistoryIndex(-1);
    trimBoundsRef.current = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = coloringCorsUrl(backgroundImage);
    img.onload = () => {
      bgImageRef.current = img;
      setupCanvases(img);
      layoutCanvases();
      setBgLoaded(true);
    };
    img.onerror = () => setBgError(true);
  }, [isOpen, backgroundImage, bgRetry]);

  useEffect(() => {
    if (!isOpen || !bgImageRef.current) return;
    window.addEventListener('resize', layoutCanvases);
    window.addEventListener('orientationchange', layoutCanvases);
    return () => {
      window.removeEventListener('resize', layoutCanvases);
      window.removeEventListener('orientationchange', layoutCanvases);
    };
  }, [isOpen, layoutCanvases]);

  // Re-measure when toolbar height or canvas area size changes
  // (e.g., color rows wrapping, brush sizes appearing, orientation change).
  useEffect(() => {
    if (!isOpen) return;
    const bottom = bottomBarRef.current;
    const top = topBarRef.current;
    const area = canvasAreaRef.current;
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => layoutCanvases());
    if (bottom) ro.observe(bottom);
    if (top) ro.observe(top);
    if (area) ro.observe(area);
    return () => ro.disconnect();
  }, [isOpen, layoutCanvases]);

  // ── Drawing helpers (positions are in internal canvas pixels) ──
  const posFromClient = useCallback((cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect(); // includes the zoom transform
    return { x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height) };
  }, []);

  const doFill = useCallback((pos: { x: number; y: number }) => {
    const drawCtx = canvasRef.current?.getContext('2d');
    const bgCtx = bgCanvasRef.current?.getContext('2d');
    if (!drawCtx || !bgCtx || !canvasRef.current) return;
    const cw = canvasRef.current.width, ch = canvasRef.current.height;
    if (pos.x < 0 || pos.y < 0 || pos.x >= cw || pos.y >= ch) return;
    floodFill(drawCtx, bgCtx, pos.x, pos.y, colorRef.current, cw, ch);
    latest.current.saveSnapshot();
  }, []);

  const doErase = useCallback((pos: { x: number; y: number }) => {
    const drawCtx = canvasRef.current?.getContext('2d');
    if (!drawCtx || !canvasRef.current) return;
    floodErase(drawCtx, pos.x, pos.y, canvasRef.current.width, canvasRef.current.height);
    latest.current.saveSnapshot();
  }, []);

  const beginStroke = useCallback((pos: { x: number; y: number }) => {
    strokeActive.current = true;
    lastPos.current = pos;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = colorRef.current;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (brushSizeRef.current * pxScale()) / 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const strokeTo = useCallback((pos: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !strokeActive.current || !lastPos.current) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = brushSizeRef.current * pxScale();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, []);

  const endStroke = useCallback((keep: boolean) => {
    if (!strokeActive.current) return;
    strokeActive.current = false;
    lastPos.current = null;
    if (keep) latest.current.saveSnapshot();
    else {
      // A second finger arrived: undo the accidental mark from the first finger.
      const { history: h, historyIndex: i } = latest.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && h[i]) ctx.putImageData(h[i], 0, 0);
    }
  }, []);

  // ── Zoom / pan (CSS transform only; internal pixels never change) ──
  const applyView = useCallback((v: { s: number; x: number; y: number }) => {
    if (v.s <= 1.001) v = { s: 1, x: 0, y: 0 };
    viewRef.current = v;
    const el = zoomWrapRef.current;
    if (el) el.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
    setZoomed(v.s > 1);
  }, []);
  const resetView = useCallback(() => applyView({ s: 1, x: 0, y: 0 }), [applyView]);

  /** Point relative to the untransformed top-left of the zoom wrapper. */
  const localPoint = (cx: number, cy: number) => {
    const area = canvasAreaRef.current, wrap = zoomWrapRef.current;
    if (!area || !wrap) return { x: 0, y: 0 };
    const r = area.getBoundingClientRect();
    return { x: cx - r.left - wrap.offsetLeft, y: cy - r.top - wrap.offsetTop };
  };

  // Mouse (desktop): act immediately.
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const pos = posFromClient(e.clientX, e.clientY);
    if (toolRef.current === 'eraser') doErase(pos);
    else if (toolRef.current === 'brush') beginStroke(pos);
    else doFill(pos);
  }, [posFromClient, doErase, beginStroke, doFill]);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (strokeActive.current) strokeTo(posFromClient(e.clientX, e.clientY));
  }, [posFromClient, strokeTo]);
  const onMouseUp = useCallback(() => endStroke(true), [endStroke]);

  // Touch: one finger colors, two fingers zoom and move. Fill/erase wait for the finger to lift
  // so the first finger of a pinch never colors anything.
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!isOpen || !area) return;
    let pending: { pos: { x: number; y: number }; cx: number; cy: number } | null = null;
    let pinch: { d: number; m: { x: number; y: number }; v: { s: number; x: number; y: number } } | null = null;
    let gesture = false;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const mid = (t: TouchList) => localPoint((t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2);

    const start = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length >= 2) {
        gesture = true;
        pending = null;
        endStroke(false);
        pinch = { d: dist(e.touches) || 1, m: mid(e.touches), v: { ...viewRef.current } };
        return;
      }
      if (gesture) return;
      const t = e.touches[0];
      const pos = posFromClient(t.clientX, t.clientY);
      if (toolRef.current === 'brush') beginStroke(pos);
      else pending = { pos, cx: t.clientX, cy: t.clientY };
    };
    const move = (e: TouchEvent) => {
      e.preventDefault();
      if (gesture && pinch && e.touches.length >= 2) {
        const s = Math.min(MAX_ZOOM, Math.max(1, pinch.v.s * (dist(e.touches) / pinch.d)));
        const k = s / pinch.v.s;
        const m = mid(e.touches);
        applyView({ s, x: m.x - (pinch.m.x - pinch.v.x) * k, y: m.y - (pinch.m.y - pinch.v.y) * k });
        return;
      }
      if (gesture) return;
      const t = e.touches[0];
      if (strokeActive.current) strokeTo(posFromClient(t.clientX, t.clientY));
      else if (pending && Math.hypot(t.clientX - pending.cx, t.clientY - pending.cy) > 12) pending = null;
    };
    const end = (e: TouchEvent) => {
      e.preventDefault();
      if (gesture) {
        if (e.touches.length >= 2) pinch = { d: dist(e.touches) || 1, m: mid(e.touches), v: { ...viewRef.current } };
        if (e.touches.length === 0) { gesture = false; pinch = null; }
        return;
      }
      if (strokeActive.current) endStroke(true);
      else if (pending) {
        const p = pending.pos;
        pending = null;
        if (toolRef.current === 'eraser') doErase(p); else doFill(p);
      }
    };
    // Desktop trackpad pinch / mouse wheel zoom, anchored at the cursor.
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const v = viewRef.current;
      const s = Math.min(MAX_ZOOM, Math.max(1, v.s * Math.exp(-dy * 0.0015)));
      const p = localPoint(e.clientX, e.clientY);
      const k = s / v.s;
      applyView({ s, x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k });
    };
    const opts = { passive: false } as AddEventListenerOptions;
    area.addEventListener('touchstart', start, opts);
    area.addEventListener('touchmove', move, opts);
    area.addEventListener('touchend', end, opts);
    area.addEventListener('touchcancel', end, opts);
    area.addEventListener('wheel', wheel, opts);
    return () => {
      area.removeEventListener('touchstart', start);
      area.removeEventListener('touchmove', move);
      area.removeEventListener('touchend', end);
      area.removeEventListener('touchcancel', end);
      area.removeEventListener('wheel', wheel);
    };
  }, [isOpen, posFromClient, beginStroke, strokeTo, endStroke, doFill, doErase, applyView]);

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

  // Save = A4 PDF of the colored page; print = the same A4 print as everywhere else.
  const handleSave = useCallback(async () => {
    const merged = getMergedCanvas();
    if (!merged) return;
    try {
      await downloadColoringPdfA4(merged.toDataURL('image/png'), childName || storyTitle, { preserveColors: true });
    } catch (e) {
      console.error('coloring PDF error', e);
      toast.error('שגיאה ביצירת PDF');
    }
  }, [getMergedCanvas, childName, storyTitle]);

  const handlePrint = useCallback(() => {
    const merged = getMergedCanvas();
    if (!merged) return;
    toast.info(A4_PRINT_HINT);
    printColoringA4(merged.toDataURL('image/png'), { preserveColors: true });
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

  const pickTool = (t: Tool) => { toolRef.current = t; setTool(t); };
  const cycleBrush = () => {
    const next = BRUSH_SIZES[(BRUSH_SIZES.indexOf(brushSizeRef.current) + 1) % BRUSH_SIZES.length];
    brushSizeRef.current = next; setBrushSize(next); pickTool('brush');
  };
  const toolBtn = (active: boolean) =>
    `w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all touch-manipulation ${
      active ? 'ring-2 ring-purple-500 ring-offset-1 bg-purple-50 shadow-md' : 'bg-gray-100 hover:bg-gray-200'
    }`;
  const swatch = (c: string) => (
    <button key={c} type="button" aria-label={colorName(c)} aria-pressed={color === c && tool !== 'eraser'}
      onPointerDown={(e) => { e.stopPropagation(); selectColor(c); }} onClick={(e) => { if (e.detail === 0) selectColor(c); }}
      className={`w-11 h-11 shrink-0 rounded-full border-2 transition-all active:scale-95 touch-manipulation ${
        color === c && tool !== 'eraser' ? 'scale-110 shadow-lg border-gray-700' : 'border-white shadow-md hover:scale-105'
      }`}
      style={{ backgroundColor: c }}
    />
  );
  const topBtn = 'text-white hover:bg-white/20 rounded-xl w-11 h-11 shrink-0 disabled:opacity-30';

  return (
    <div className="fixed inset-0 z-[110] bg-white overflow-hidden flex flex-col" style={{
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
      <div ref={topBarRef} className="relative z-20 shrink-0 flex justify-between items-center px-1 bg-gradient-to-r from-purple-600/80 to-pink-500/80 backdrop-blur-sm" dir="rtl">
        <Button onClick={handleClose} variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl gap-1 min-h-[44px] px-2 text-sm">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
        <div className="flex items-center">
          <Button onClick={undo} aria-label="ביטול פעולה" variant="ghost" size="icon" disabled={historyIndex <= 0} className={topBtn}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button onClick={redo} aria-label="ביצוע מחדש" variant="ghost" size="icon" disabled={historyIndex >= history.length - 1} className={topBtn}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button onClick={handleSave} aria-label="הורדת PDF של הציור" variant="ghost" size="icon" className={topBtn}>
            <Download className="w-4 h-4" />
          </Button>
          <Button onClick={handlePrint} aria-label="הדפסה" variant="ghost" size="icon" className={topBtn}>
            <Printer className="w-4 h-4" />
          </Button>
          <Button onClick={handleClear} aria-label="נקה צביעה" variant="ghost" size="icon" className={topBtn} title="נקה צביעה">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button onClick={toggleLandscape} aria-label={isLandscape ? 'מצב עומד' : 'מצב רוחב'} variant="ghost" size="icon" className={`${topBtn} md:hidden`} title={isLandscape ? 'מצב עומד' : 'מצב רוחב'}>
            {isLandscape ? <Smartphone className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
          </Button>
          {(canGoPrev || canGoNext) && (
            <div className="hidden md:flex items-center">
              {canGoPrev && onNavigatePrev && (
                <Button onClick={onNavigatePrev} variant="ghost" size="icon" className={topBtn} aria-label="דף קודם">
                  <span className="text-lg font-bold">❮</span>
                </Button>
              )}
              {canGoNext && onNavigateNext && (
                <Button onClick={onNavigateNext} variant="ghost" size="icon" className={topBtn} aria-label="דף הבא">
                  <span className="text-lg font-bold">❯</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 min-h-0 flex ${sideLayout ? 'flex-row' : 'flex-col'}`}>
        {/* Canvas area */}
        <div ref={canvasAreaRef} className="relative z-0 flex-1 min-h-0 min-w-0 overflow-hidden bg-white flex items-center justify-center touch-none">
          {!bgLoaded && !bgError && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="animate-spin w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full" />
            </div>
          )}
          {bgError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-white/95 px-6 text-center">
              <p className="text-sm text-gray-700">לא הצלחנו לטעון את הדף, נסו שוב</p>
              <Button size="sm" variant="outline" onClick={() => setBgRetry((n) => n + 1)}>נסו שוב</Button>
            </div>
          )}
          <div ref={zoomWrapRef} className="relative" style={{ lineHeight: 0, transformOrigin: '0 0' }}>
            <canvas ref={bgCanvasRef} className="block" />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 touch-none"
              style={{ cursor: cursorStyle }}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            />
          </div>
        </div>

        {/* Tools + colors: one compact row each below the page, or a side column in landscape/desktop */}
        <div ref={bottomBarRef} dir="rtl"
          className={sideLayout
            ? 'relative z-20 shrink-0 h-full w-[164px] lg:w-[220px] overflow-y-auto border-s border-purple-200 bg-white/95 p-2 flex flex-col gap-3'
            : 'relative z-20 shrink-0 bg-white/95 border-t border-purple-200 px-2 pt-1.5 flex flex-col gap-1.5'}
          style={sideLayout ? undefined : { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}>
          <div className={sideLayout ? 'grid grid-cols-3 lg:grid-cols-4 gap-1.5 justify-items-center' : 'flex items-center justify-center gap-1.5'}>
            <button type="button" aria-label="דלי צבע" aria-pressed={tool === 'fill'} onClick={() => pickTool('fill')} className={toolBtn(tool === 'fill')}>
              <PaintBucket className="w-5 h-5" style={{ color }} />
            </button>
            <button type="button" aria-label="מכחול" aria-pressed={tool === 'brush'} onClick={() => pickTool('brush')} className={toolBtn(tool === 'brush')}>
              <Pencil className="w-5 h-5" style={{ color: tool === 'brush' ? color : undefined }} />
            </button>
            <button type="button" aria-label="מחק" aria-pressed={tool === 'eraser'} onClick={() => pickTool('eraser')} className={toolBtn(tool === 'eraser')}>
              <Eraser className="w-5 h-5 text-gray-500" />
            </button>
            <button type="button" aria-label={`עובי מכחול: ${BRUSH_LABELS[brushSize]}`} onClick={cycleBrush} className={toolBtn(false)}>
              <span className="rounded-full bg-gray-700" style={{ width: brushSize + 4, height: brushSize + 4 }} />
            </button>
            <button type="button" aria-label="התאמה למסך" title="התאמה למסך" onClick={resetView} disabled={!zoomed} className={`${toolBtn(false)} disabled:opacity-40`}>
              <Minimize2 className="w-5 h-5" />
            </button>
            <button type="button" aria-label="עוד צבעים" title="עוד צבעים" onClick={() => setPaletteOpen(true)} className={toolBtn(false)}>
              <Palette className="w-5 h-5 text-purple-600" />
            </button>
          </div>
          <div role="group" aria-label="צבעים"
            className={sideLayout ? 'grid grid-cols-3 lg:grid-cols-4 gap-2 justify-items-center' : 'flex items-center gap-2 overflow-x-auto px-1 py-1 snap-x [scrollbar-width:none]'}>
            {ALL_COLORS.map(swatch)}
          </div>
        </div>
      </div>

      {paletteOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setPaletteOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="כל הצבעים" dir="rtl" className="bg-white rounded-2xl p-4 shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">כל הצבעים</h2>
              <button type="button" aria-label="סגירה" onClick={() => setPaletteOpen(false)} className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2 justify-items-center" onClick={() => setPaletteOpen(false)}>
              {ALL_COLORS.map(swatch)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
