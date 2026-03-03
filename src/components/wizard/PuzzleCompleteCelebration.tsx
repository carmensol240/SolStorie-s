import { useEffect, useState } from "react";

const EMOJIS = ["⭐", "🌟", "✨", "🎉", "🧩", "💜", "🦄"];

interface Particle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
}

const PuzzleCompleteCelebration = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const items: Particle[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 0.8,
    }));
    setParticles(items);
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-2 py-2">
      {/* Falling particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ height: "120px" }}>
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute text-xl animate-bounce"
            style={{
              left: `${p.x}%`,
              top: "-20px",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              animation: `puzzleFall ${p.duration}s ease-in ${p.delay}s forwards`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <p className="text-2xl font-bold text-purple-600 z-10">🌟 כל הכבוד! 🌟</p>
      <p className="text-base text-purple-500 z-10">סיימתם את הפאזל!</p>

      <style>{`
        @keyframes puzzleFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PuzzleCompleteCelebration;
