import React from "react";
import { cn } from "@/lib/utils";
import "./theater.css";

interface TheaterFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const TheaterFrame: React.FC<TheaterFrameProps> = ({ children, className }) => {
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
        {/* Left curtain */}
        <div className="theater-curtain theater-curtain-right" />

        {/* Stage content */}
        <div className="theater-content">
          {children}
        </div>

        {/* Right curtain */}
        <div className="theater-curtain theater-curtain-left" />
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
