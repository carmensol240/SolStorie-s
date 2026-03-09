import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import "./theater.css";

interface TheaterFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Skip the opening animation */
  skipAnimation?: boolean;
}

export const TheaterFrame: React.FC<TheaterFrameProps> = ({ children, className, skipAnimation = false }) => {
  const [curtainsOpen, setCurtainsOpen] = useState(skipAnimation);

  useEffect(() => {
    if (skipAnimation) return;
    // Small delay so the closed curtains render first
    const timer = setTimeout(() => setCurtainsOpen(true), 400);
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
        {/* Right curtain (RTL: appears on right) */}
        <div className={cn("theater-curtain theater-curtain-right", curtainsOpen && "theater-curtain--open")} />

        {/* Stage content — fades in after curtains open */}
        <div className={cn("theater-content", curtainsOpen ? "theater-content--visible" : "theater-content--hidden")}>
          {children}
        </div>

        {/* Left curtain */}
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
