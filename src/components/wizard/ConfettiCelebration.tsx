import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  drift: number;
  shape: "circle" | "square" | "star";
}

const COLORS = [
  "#a855f7", // purple
  "#ec4899", // pink
  "#f97316", // orange
  "#facc15", // yellow
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f472b6", // light pink
  "#c084fc", // light purple
];

const SHAPES: Particle["shape"][] = ["circle", "square", "star"];

const createParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -(Math.random() * 20 + 5),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.6,
    duration: Math.random() * 1.5 + 1.5,
    drift: (Math.random() - 0.5) * 60,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  }));

const ConfettiCelebration = () => {
  const [particles] = useState(() => createParticles(50));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== "star" ? p.color : "transparent",
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? "2px" : "0",
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotation}deg)`,
            ["--drift" as string]: `${p.drift}px`,
            ...(p.shape === "star"
              ? {
                  width: 0,
                  height: 0,
                  borderLeft: `${p.size / 2}px solid transparent`,
                  borderRight: `${p.size / 2}px solid transparent`,
                  borderBottom: `${p.size}px solid ${p.color}`,
                  backgroundColor: "transparent",
                }
              : {}),
          }}
        />
      ))}

      {/* Big emoji burst in center */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-scale-in">
        <span className="text-6xl drop-shadow-lg" style={{ animation: "confetti-emoji 1.5s ease-out forwards" }}>
          🎉
        </span>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(var(--drift, 0px)) rotate(720deg) scale(0.3);
            opacity: 0;
          }
        }
        @keyframes confetti-emoji {
          0% { transform: scale(0); opacity: 0; }
          30% { transform: scale(1.4); opacity: 1; }
          60% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ConfettiCelebration;
