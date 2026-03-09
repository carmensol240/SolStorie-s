import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import "./magical-book.css";

interface MagicalBookFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Skip the opening animation */
  skipAnimation?: boolean;
}

/** Floating sparkle particles around the book */
const SparkleParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number; y: number; size: number; speed: number;
      angle: number; opacity: number; hue: number; phase: number;
    }

    const particles: Particle[] = Array.from({ length: 18 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      size: Math.random() * 3 + 1.5,
      speed: Math.random() * 0.3 + 0.1,
      angle: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.6 + 0.2,
      hue: Math.random() * 60 + 30, // gold range
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = (t: number) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed - 0.15; // float upward
        p.opacity = 0.3 + 0.4 * Math.sin(t * 0.002 + p.phase);

        // wrap around
        if (p.y < -10) p.y = h + 10;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        // Draw star-shaped sparkle
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = `hsl(${p.hue}, 80%, 70%)`;
        ctx.shadowColor = `hsl(${p.hue}, 90%, 80%)`;
        ctx.shadowBlur = 8;
        ctx.translate(p.x, p.y);
        ctx.rotate(t * 0.001 + p.phase);
        
        // 4-point star
        const s = p.size;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          ctx.lineTo(Math.cos(a) * s * 2, Math.sin(a) * s * 2);
          ctx.lineTo(Math.cos(a + Math.PI / 4) * s * 0.6, Math.sin(a + Math.PI / 4) * s * 0.6);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="magical-book-sparkles" />;
};

/** Synthesize a magical chime sound */
function playOpenSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 chord

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 1.2);
    });

    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Audio not supported
  }
}

export const MagicalBookFrame: React.FC<MagicalBookFrameProps> = ({
  children,
  className,
  skipAnimation = false,
}) => {
  const [isOpen, setIsOpen] = useState(skipAnimation);
  const soundPlayed = useRef(skipAnimation);

  useEffect(() => {
    if (skipAnimation) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      if (!soundPlayed.current) {
        soundPlayed.current = true;
        playOpenSound();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [skipAnimation]);

  return (
    <div className={cn("magical-book-wrapper", className)}>
      {/* Sparkle particles */}
      <SparkleParticles />

      {/* Soft ambient glow behind book */}
      <div className="magical-book-glow" />

      {/* Book body */}
      <div className={cn("magical-book-body", isOpen && "magical-book-body--open")}>
        {/* Book spine */}
        <div className="magical-book-spine" />

        {/* Top ornament */}
        <div className="magical-book-ornament magical-book-ornament--top">
          <span className="magical-book-ornament-icon">✦</span>
        </div>

        {/* Bottom ornament */}
        <div className="magical-book-ornament magical-book-ornament--bottom">
          <span className="magical-book-ornament-icon">✦</span>
        </div>

        {/* Page content */}
        <div className={cn(
          "magical-book-content",
          isOpen ? "magical-book-content--visible" : "magical-book-content--hidden"
        )}>
          {children}
        </div>

        {/* Corner decorations */}
        <div className="magical-book-corner magical-book-corner--tl" />
        <div className="magical-book-corner magical-book-corner--tr" />
        <div className="magical-book-corner magical-book-corner--bl" />
        <div className="magical-book-corner magical-book-corner--br" />
      </div>
    </div>
  );
};

export default MagicalBookFrame;
