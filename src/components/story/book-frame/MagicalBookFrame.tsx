import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "./magical-book.css";

interface MagicalBookFrameProps {
  children: React.ReactNode;
  className?: string;
  skipAnimation?: boolean;
}

/** Synthesize a magical whoosh + chime */
function playPortalSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Whoosh
    const len = ctx.sampleRate * 0.8;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.25;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 600; bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + 0.8);

    // Chime arpeggio
    [784, 988, 1175].forEach((f, i) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t = ctx.currentTime + 0.2 + i * 0.1;
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(0.05, t + 0.04);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      o.connect(og); og.connect(ctx.destination);
      o.start(t); o.stop(t + 0.9);
    });

    setTimeout(() => ctx.close(), 1500);
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
        playPortalSound();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [skipAnimation]);

  return (
    <div className={cn("portal-wrapper", className)}>
      {/* Animated glow ring behind the portal */}
      <div className="portal-glow-ring" />

      {/* Floating particles */}
      <div className="portal-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="portal-particle" style={{
            '--i': i,
            '--delay': `${i * 0.3}s`,
            '--size': `${3 + Math.random() * 4}px`,
            '--x': `${10 + Math.random() * 80}%`,
          } as React.CSSProperties} />
        ))}
      </div>

      {/* Portal arch frame */}
      <div className={cn("portal-arch", isOpen && "portal-arch--open")}>
        {/* Top arch ornament */}
        <div className="portal-arch-top">
          <span className="portal-arch-gem">✦</span>
        </div>

        {/* Side pillars */}
        <div className="portal-pillar portal-pillar--right" />
        <div className="portal-pillar portal-pillar--left" />

        {/* Inner portal content */}
        <div className={cn(
          "portal-content",
          isOpen ? "portal-content--visible" : "portal-content--hidden"
        )}>
          {children}
        </div>

        {/* Bottom step */}
        <div className="portal-step" />
      </div>
    </div>
  );
};

export default MagicalBookFrame;
