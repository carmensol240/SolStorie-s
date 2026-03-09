import { ReactNode } from 'react';

interface CorkBoardProps {
  title?: string;
  children: ReactNode;
}

const CorkBoard = ({ title, children }: CorkBoardProps) => {
  // Generate fixed star positions
  const stars = Array.from({ length: 30 }).map((_, i) => ({
    left: `${(i * 37 + 13) % 100}%`,
    top: `${(i * 53 + 7) % 100}%`,
    size: i % 3 === 0 ? 2 : 1,
    delay: `${(i * 0.4) % 3}s`,
  }));

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

      {/* Decorative dots along top edge */}
      <div className="absolute top-2 left-0 right-0 flex justify-center gap-3 opacity-40 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-purple-300" />
        ))}
      </div>

      {title && (
        <h2
          className="text-center font-bold text-sm mb-5 flex items-center justify-center gap-1.5"
          style={{ color: '#e8d5ff' }}
        >
          <span className="text-yellow-400">★</span>
          {title}
          <span className="text-yellow-400">★</span>
        </h2>
      )}

      <div className="grid grid-cols-2" style={{ gap: '28px' }}>
        {children}
      </div>

      {/* Bottom hint */}
      <p className="text-center text-[10px] mt-5 opacity-40" style={{ color: '#c8b4ff' }}>
        ✨ עברו עם העכבר על תמונה ✨
      </p>
    </div>
  );
};

export default CorkBoard;
