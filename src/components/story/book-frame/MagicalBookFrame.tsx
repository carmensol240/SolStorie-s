import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "./magical-book.css";

interface MagicalBookFrameProps {
  children: React.ReactNode;
  className?: string;
  skipAnimation?: boolean;
}

/** Soft wind-chime sound */
function playDreamSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Soft ascending chime
    [392, 523.25, 659.25, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.15;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 1.1);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch {}
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
        playDreamSound();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [skipAnimation]);

  return (
    <div className={cn("dream-wrapper", className)}>
      {/* Sky gradient background */}
      <div className="dream-sky" />

      {/* Floating clouds (decorative) */}
      <div className="dream-clouds">
        <div className="dream-cloud dream-cloud--1" />
        <div className="dream-cloud dream-cloud--2" />
        <div className="dream-cloud dream-cloud--3" />
        <div className="dream-cloud dream-cloud--4" />
      </div>

      {/* Twinkling stars */}
      <div className="dream-stars">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="dream-star" style={{
            '--x': `${8 + Math.random() * 84}%`,
            '--y': `${5 + Math.random() * 40}%`,
            '--delay': `${i * 0.4}s`,
            '--size': `${2 + Math.random() * 3}px`,
          } as React.CSSProperties} />
        ))}
      </div>

      {/* Main cloud card */}
      <div className={cn("dream-card", isOpen && "dream-card--open")}>
        {/* Soft glow behind card */}
        <div className="dream-card-glow" />
        
        {/* Content */}
        <div className={cn(
          "dream-content",
          isOpen ? "dream-content--visible" : "dream-content--hidden"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default MagicalBookFrame;
