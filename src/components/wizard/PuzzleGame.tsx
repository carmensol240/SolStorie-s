import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PuzzleCompleteCelebration from "./PuzzleCompleteCelebration";

import castSol from "@/assets/cast-sol-adventure.jpg";
import castBen from "@/assets/cast-ben-art.jpg";
import castMia from "@/assets/cast-mia-nature.jpg";
import castLeo from "@/assets/cast-leo-science.jpg";
import castZoe from "@/assets/cast-zoe-sports.jpg";

const PUZZLE_IMAGES = [castSol, castBen, castMia, castLeo, castZoe];

function getGridSize(ageRange: string): number {
  if (ageRange === "0-2" || ageRange === "2-4") return 2;
  if (ageRange === "5-7") return 3;
  return 4;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PuzzleGameProps {
  ageRange: string;
}

const PuzzleGame = ({ ageRange }: PuzzleGameProps) => {
  const gridSize = getGridSize(ageRange);
  const totalPieces = gridSize * gridSize;
  const imageSrc = useMemo(() => PUZZLE_IMAGES[Math.floor(Math.random() * PUZZLE_IMAGES.length)], []);

  // pieces[i] = which original piece index is at position i. null = empty slot on board
  const [board, setBoard] = useState<(number | null)[]>(() => Array(totalPieces).fill(null));
  const [tray, setTray] = useState<number[]>(() => shuffle(Array.from({ length: totalPieces }, (_, i) => i)));
  const [completed, setCompleted] = useState(false);
  const [dragPiece, setDragPiece] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<"tray" | "board" | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  const pieceSize = 100 / gridSize;

  // Check completion
  useEffect(() => {
    if (board.every((val, idx) => val === idx)) {
      setCompleted(true);
    }
  }, [board]);

  const handleReset = useCallback(() => {
    setBoard(Array(totalPieces).fill(null));
    setTray(shuffle(Array.from({ length: totalPieces }, (_, i) => i)));
    setCompleted(false);
  }, [totalPieces]);

  // Get background style for a piece
  const getPieceStyle = (pieceIndex: number, sizeRem: number) => {
    const col = pieceIndex % gridSize;
    const row = Math.floor(pieceIndex / gridSize);
    return {
      backgroundImage: `url(${imageSrc})`,
      backgroundSize: `${gridSize * sizeRem}rem ${gridSize * sizeRem}rem`,
      backgroundPosition: `-${col * sizeRem}rem -${row * sizeRem}rem`,
      width: `${sizeRem}rem`,
      height: `${sizeRem}rem`,
    };
  };

  // Calculate piece size in rem based on grid
  const pieceSizeRem = gridSize === 2 ? 5.5 : gridSize === 3 ? 4 : 3.2;

  // --- Touch / Pointer drag ---
  const createGhost = (pieceIndex: number, x: number, y: number) => {
    const ghost = document.createElement("div");
    const style = getPieceStyle(pieceIndex, pieceSizeRem);
    Object.assign(ghost.style, {
      position: "fixed",
      left: `${x - (pieceSizeRem * 8)}px`,
      top: `${y - (pieceSizeRem * 8)}px`,
      width: style.width,
      height: style.height,
      backgroundImage: style.backgroundImage,
      backgroundSize: style.backgroundSize,
      backgroundPosition: style.backgroundPosition,
      borderRadius: "0.5rem",
      opacity: "0.85",
      pointerEvents: "none",
      zIndex: "9999",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      transform: "scale(1.1)",
    });
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;
  };

  const moveGhost = (x: number, y: number) => {
    if (dragGhostRef.current) {
      dragGhostRef.current.style.left = `${x - (pieceSizeRem * 8)}px`;
      dragGhostRef.current.style.top = `${y - (pieceSizeRem * 8)}px`;
    }
  };

  const removeGhost = () => {
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
  };

  const getBoardSlotAtPoint = (x: number, y: number): number | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const col = Math.floor(((x - rect.left) / rect.width) * gridSize);
    const row = Math.floor(((y - rect.top) / rect.height) * gridSize);
    if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) return null;
    return row * gridSize + col;
  };

  // Touch handlers for tray pieces
  const handleTrayTouchStart = (pieceIndex: number, e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setDragPiece(pieceIndex);
    setDragSource("tray");
    createGhost(pieceIndex, touch.clientX, touch.clientY);
  };

  // Touch handlers for board pieces (to allow repositioning)
  const handleBoardTouchStart = (slotIndex: number, pieceIndex: number, e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setDragPiece(pieceIndex);
    setDragSource("board");
    setDragSourceIndex(slotIndex);
    createGhost(pieceIndex, touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (dragPiece === null) return;
      e.preventDefault();
      moveGhost(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (dragPiece === null) return;
      const touch = e.changedTouches[0];
      const slot = getBoardSlotAtPoint(touch.clientX, touch.clientY);
      removeGhost();

      if (slot !== null && board[slot] === null) {
        // Place piece on board
        setBoard(prev => {
          const next = [...prev];
          next[slot] = dragPiece;
          return next;
        });
        if (dragSource === "tray") {
          setTray(prev => prev.filter(p => p !== dragPiece));
        } else if (dragSource === "board" && dragSourceIndex !== null) {
          setBoard(prev => {
            const next = [...prev];
            next[dragSourceIndex!] = null;
            next[slot] = dragPiece;
            return next;
          });
        }
      } else if (slot !== null && board[slot] !== null && dragSource === "board" && dragSourceIndex !== null) {
        // Swap two board pieces
        setBoard(prev => {
          const next = [...prev];
          next[dragSourceIndex!] = prev[slot];
          next[slot] = dragPiece;
          return next;
        });
      } else if (slot === null && dragSource === "board" && dragSourceIndex !== null) {
        // Return to tray
        setBoard(prev => {
          const next = [...prev];
          next[dragSourceIndex!] = null;
          return next;
        });
        setTray(prev => [...prev, dragPiece]);
      }

      setDragPiece(null);
      setDragSource(null);
      setDragSourceIndex(null);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragPiece, dragSource, dragSourceIndex, board, gridSize]);

  // --- Mouse drag (for desktop) ---
  const handleMouseDown = (pieceIndex: number, source: "tray" | "board", sourceIndex: number | null, e: React.MouseEvent) => {
    e.preventDefault();
    setDragPiece(pieceIndex);
    setDragSource(source);
    setDragSourceIndex(sourceIndex);
    createGhost(pieceIndex, e.clientX, e.clientY);

    const handleMouseMove = (ev: MouseEvent) => moveGhost(ev.clientX, ev.clientY);
    const handleMouseUp = (ev: MouseEvent) => {
      const slot = getBoardSlotAtPoint(ev.clientX, ev.clientY);
      removeGhost();

      if (slot !== null && board[slot] === null) {
        setBoard(prev => {
          const next = [...prev];
          next[slot] = pieceIndex;
          return next;
        });
        if (source === "tray") {
          setTray(prev => prev.filter(p => p !== pieceIndex));
        } else if (source === "board" && sourceIndex !== null) {
          setBoard(prev => {
            const next = [...prev];
            next[sourceIndex] = null;
            next[slot] = pieceIndex;
            return next;
          });
        }
      } else if (slot !== null && board[slot] !== null && source === "board" && sourceIndex !== null) {
        setBoard(prev => {
          const next = [...prev];
          next[sourceIndex] = prev[slot];
          next[slot] = pieceIndex;
          return next;
        });
      } else if (slot === null && source === "board" && sourceIndex !== null) {
        setBoard(prev => {
          const next = [...prev];
          next[sourceIndex] = null;
          return next;
        });
        setTray(prev => [...prev, pieceIndex]);
      }

      setDragPiece(null);
      setDragSource(null);
      setDragSourceIndex(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // --- Click-to-place (simple mode for young kids) ---
  const [selectedTrayPiece, setSelectedTrayPiece] = useState<number | null>(null);

  const handleSlotClick = (slotIndex: number) => {
    if (board[slotIndex] !== null || selectedTrayPiece === null) return;
    setBoard(prev => {
      const next = [...prev];
      next[slotIndex] = selectedTrayPiece;
      return next;
    });
    setTray(prev => prev.filter(p => p !== selectedTrayPiece));
    setSelectedTrayPiece(null);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center gap-4">
        <PuzzleCompleteCelebration />
        <div
          className="rounded-2xl overflow-hidden shadow-xl border-4 border-yellow-300"
          style={{ width: `${gridSize * pieceSizeRem}rem`, height: `${gridSize * pieceSizeRem}rem` }}
        >
          <img src={imageSrc} alt="פאזל מושלם" className="w-full h-full object-cover" />
        </div>
        <Button onClick={handleReset} variant="outline" className="gap-2 mt-2">
          <Shuffle className="w-4 h-4" />
          שחקו שוב 🧩
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Board */}
      <div
        ref={boardRef}
        className="grid rounded-xl overflow-hidden border-2 border-purple-300/50 bg-purple-50/30 shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${pieceSizeRem}rem)`,
          gridTemplateRows: `repeat(${gridSize}, ${pieceSizeRem}rem)`,
          gap: "2px",
        }}
      >
        {board.map((piece, idx) => (
          <div
            key={idx}
            className={`relative border border-dashed border-purple-200 rounded-sm transition-all duration-200 ${
              piece === null ? "bg-purple-100/40 cursor-pointer hover:bg-purple-200/50" : "cursor-grab active:cursor-grabbing"
            } ${piece === idx ? "ring-2 ring-green-400/60" : ""}`}
            style={{
              width: `${pieceSizeRem}rem`,
              height: `${pieceSizeRem}rem`,
              ...(piece !== null ? getPieceStyle(piece, pieceSizeRem) : {}),
            }}
            onClick={() => piece === null && handleSlotClick(idx)}
            onTouchStart={piece !== null ? (e) => handleBoardTouchStart(idx, piece, e) : undefined}
            onMouseDown={piece !== null ? (e) => handleMouseDown(piece, "board", idx, e) : undefined}
          >
            {piece === null && (
              <span className="absolute inset-0 flex items-center justify-center text-purple-300 text-lg font-bold">
                {idx + 1}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tray */}
      {tray.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 max-w-sm">
          {tray.map((piece) => (
            <div
              key={piece}
              className={`rounded-lg shadow-md cursor-grab active:cursor-grabbing border-2 transition-all duration-150 select-none ${
                selectedTrayPiece === piece 
                  ? "border-purple-500 ring-2 ring-purple-400 scale-105" 
                  : "border-white/80 hover:border-purple-300"
              }`}
              style={{
                ...getPieceStyle(piece, pieceSizeRem * 0.85),
                touchAction: "none",
              }}
              onClick={() => setSelectedTrayPiece(prev => prev === piece ? null : piece)}
              onTouchStart={(e) => handleTrayTouchStart(piece, e)}
              onMouseDown={(e) => handleMouseDown(piece, "tray", null, e)}
            />
          ))}
        </div>
      )}

      <Button onClick={handleReset} variant="ghost" size="sm" className="gap-1 text-purple-600">
        <Shuffle className="w-3 h-3" />
        ערבבו מחדש
      </Button>
    </div>
  );
};

export default PuzzleGame;
