import { ReactNode, Children, useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface CorkBoardProps {
  title?: string;
  children: ReactNode;
}

const CorkBoard = ({ title, children }: CorkBoardProps) => {
  const childArray = Children.toArray(children);
  const totalPages = Math.max(1, Math.ceil(childArray.length / ITEMS_PER_PAGE));
  const [currentPage, setCurrentPage] = useState(0);

  const stars = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      left: `${(i * 37 + 13) % 100}%`,
      top: `${(i * 53 + 7) % 100}%`,
      size: i % 3 === 0 ? 2 : 1,
      delay: `${(i * 0.4) % 3}s`,
    })), []);

  const pageItems = childArray.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 15% 20%, rgba(120,80,200,0.35) 0%, transparent 45%),
          radial-gradient(ellipse at 85% 75%, rgba(80,40,160,0.3) 0%, transparent 45%),
          #1a0f3a`,
        border: '5px solid #2d1a6e',
        borderRadius: '16px',
        boxShadow: 'inset 0 0 60px rgba(80,40,160,0.4), 0 8px 40px rgba(0,0,0,0.7)',
        padding: '28px 16px 32px',
      }}
    >
      {/* Twinkling stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: 'white',
            animationDelay: star.delay,
          }}
        />
      ))}

      {/* Page indicator dots (top) */}
      {totalPages > 1 && (
        <div className="absolute top-2.5 left-0 right-0 flex justify-center gap-2 z-10">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              aria-label={`דף ${i + 1}`}
              className="transition-all duration-300"
              style={{
                width: i === currentPage ? '16px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === currentPage
                  ? 'linear-gradient(90deg, #f0c040, #e8d5ff)'
                  : 'rgba(200,180,255,0.3)',
                border: 'none',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {title && (
        <h2
          className="text-center font-bold text-sm mb-5 mt-2 flex items-center justify-center gap-1.5"
          style={{ color: '#e8d5ff' }}
        >
          <span className="text-yellow-400">★</span>
          {title}
          <span className="text-yellow-400">★</span>
        </h2>
      )}

      <div className="grid grid-cols-2" style={{ gap: '28px', minHeight: '200px' }}>
        {pageItems}
      </div>

      {/* Navigation arrows + page number */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-5">
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: 'rgba(200,180,255,0.15)', color: '#e8d5ff' }}
            aria-label="דף הבא"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold" style={{ color: '#c8b4ff' }}>
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage <= 0}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: 'rgba(200,180,255,0.15)', color: '#e8d5ff' }}
            aria-label="דף קודם"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CorkBoard;
