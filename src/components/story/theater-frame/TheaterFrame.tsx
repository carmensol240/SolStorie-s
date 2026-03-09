import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "./theater.css";

interface TheaterFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Skip the opening animation */
  skipAnimation?: boolean;
}

/** Synthesize a fabric swoosh sound via Web Audio API */
function playCurtainSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 1.4;

    // Filtered noise = fabric swoosh
    const bufferSize = ctx.sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Bandpass filter for fabric-like texture
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
    filter.Q.value = 0.8;

    // Envelope: swell up then fade
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + duration);

    // Cleanup
    noise.onended = () => ctx.close();
  } catch {
    // Audio not supported — silently skip
  }
}

export const TheaterFrame: React.FC<TheaterFrameProps> = ({ children, className, skipAnimation = false }) => {
  const [curtainsOpen, setCurtainsOpen] = useState(skipAnimation);
  const soundPlayed = useRef(skipAnimation);

  useEffect(() => {
    if (skipAnimation) return;
    const timer = setTimeout(() => {
      setCurtainsOpen(true);
      if (!soundPlayed.current) {
        soundPlayed.current = true;
        playCurtainSound();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [skipAnimation]);

  return (
    <div className={cn("theater-stage-wrapper", className)}>
      {/* Top ornate header — gold arch */}
      <div className="theater-top-arch">
        <div className="theater-top-arch-inner">
          <span className="theater-top-title">✦ הַצָּגָה ✦</span>
        </div>
      </div>

      {/* Main stage area */}
      <div className="theater-body">
        <div className={cn("theater-curtain theater-curtain-right", curtainsOpen && "theater-curtain--open")} />

        <div className={cn("theater-content", curtainsOpen ? "theater-content--visible" : "theater-content--hidden")}>
          {children}
        </div>

        <div className={cn("theater-curtain theater-curtain-left", curtainsOpen && "theater-curtain--open")} />
      </div>

      {/* Wooden floor */}
      <div className="theater-floor">
        <div className="theater-floor-plank" />
        <div className="theater-floor-plank" />
        <div className="theater-floor-plank" />
      </div>
    </div>
  );
};

export default TheaterFrame;
