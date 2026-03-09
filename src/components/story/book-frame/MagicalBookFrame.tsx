import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "./magical-book.css";

interface MagicalBookFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Skip the opening animation */
  skipAnimation?: boolean;
}

/** Synthesize a pop-up book unfolding sound */
function playPopUpSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Paper unfolding whoosh
    const bufferSize = ctx.sampleRate * 0.6;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.6);

    // Magical chime accent
    [659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + 0.15 + i * 0.08);
      g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.2 + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8 + i * 0.08);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.15 + i * 0.08);
      osc.stop(ctx.currentTime + 0.9 + i * 0.08);
    });

    setTimeout(() => ctx.close(), 1500);
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
        playPopUpSound();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [skipAnimation]);

  return (
    <div className={cn("popup-book-wrapper", className)}>
      {/* Background page layers for depth */}
      <div className="popup-book-layer popup-book-layer--back" />
      <div className="popup-book-layer popup-book-layer--mid" />

      {/* Main book page */}
      <div className={cn("popup-book-page", isOpen && "popup-book-page--open")}>
        {/* Page fold crease (center spine) */}
        <div className="popup-book-crease" />

        {/* Pop-up content area */}
        <div className={cn(
          "popup-book-content",
          isOpen ? "popup-book-content--visible" : "popup-book-content--hidden"
        )}>
          {children}
        </div>

        {/* Paper edge shadow at bottom */}
        <div className="popup-book-edge" />

        {/* Page curl corners */}
        <div className="popup-book-curl popup-book-curl--bl" />
        <div className="popup-book-curl popup-book-curl--br" />
      </div>
    </div>
  );
};

export default MagicalBookFrame;
