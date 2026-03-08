import { useEffect, useState, useRef } from "react";

/* ─── Types ─── */
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

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

/* ─── Palettes ─── */
const COLORS = [
  "#a855f7", "#ec4899", "#f97316", "#facc15",
  "#34d399", "#60a5fa", "#f472b6", "#c084fc",
];

const SPARKLE_COLORS = [
  "#fbbf24", "#facc15", "#fde68a", "#fffbeb",
  "#c084fc", "#f9a8d4", "#ffffff",
];

const SHAPES: Particle["shape"][] = ["circle", "square", "star"];

/* ─── Generators ─── */
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

const createSparkles = (count: number): Sparkle[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60, // cluster toward center
    y: 15 + Math.random() * 55,
    size: Math.random() * 6 + 3,
    delay: Math.random() * 1.2,
    duration: 0.6 + Math.random() * 0.8,
    color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
  }));

/* ─── Magic chime via Web Audio API ─── */
const playMagicChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, ctx.currentTime); // low volume
    masterGain.connect(ctx.destination);

    // Musical notes: C6, E6, G6, C7 — a bright ascending arpeggio
    const notes = [1047, 1319, 1568, 2093];
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      // Each note offset slightly for arpeggio feel
      const start = now + i * 0.15;
      const end = start + 0.4;

      noteGain.gain.setValueAtTime(0, start);
      noteGain.gain.linearRampToValueAtTime(0.6, start + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.01, end);

      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.start(start);
      osc.stop(end + 0.05);
    });

    // Shimmer overlay — a high soft tone
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = "triangle";
    shimmer.frequency.setValueAtTime(3520, now); // A7
    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer.start(now);
    shimmer.stop(now + 1.6);

    // Clean up context after sound finishes
    setTimeout(() => ctx.close(), 2500);
  } catch (e) {
    console.warn("[ConfettiCelebration] Could not play magic chime:", e);
  }
};

/* ─── Component ─── */
const ConfettiCelebration = () => {
  const [particles] = useState(() => createParticles(50));
  const [sparkles] = useState(() => createSparkles(25));
  const [visible, setVisible] = useState(true);
  const soundPlayed = useRef(false);

  useEffect(() => {
    // Play sound only if user has interacted with the page (autoplay policy)
    if (!soundPlayed.current) {
      soundPlayed.current = true;
      // navigator.userActivation is supported in modern browsers
      const hasInteracted = (navigator as any).userActivation?.hasBeenActive ?? true;
      if (hasInteracted) {
        playMagicChime();
      }
    }

    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Confetti particles */}
      {particles.map((p) => (
        <div
          key={`c-${p.id}`}
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

      {/* Sparkle / star burst particles */}
      {sparkles.map((s) => (
        <div
          key={`s-${s.id}`}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animation: `sparkle-pop ${s.duration}s ease-out ${s.delay}s both`,
          }}
        >
          {/* 4-point star shape using pseudo-element trick */}
          <svg viewBox="0 0 24 24" fill={s.color} className="w-full h-full drop-shadow-sm">
            <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" />
          </svg>
        </div>
      ))}

      {/* Big emoji burst in center */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
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
        @keyframes sparkle-pop {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          40% { transform: scale(1.3) rotate(90deg); opacity: 1; }
          70% { transform: scale(0.8) rotate(150deg); opacity: 0.8; }
          100% { transform: scale(0) rotate(200deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ConfettiCelebration;
