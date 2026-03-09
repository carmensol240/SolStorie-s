import React from "react";
import { cn } from "@/lib/utils";

interface BookFrameProps {
  children: React.ReactNode;
  isFlipping?: boolean;
  flipDirection?: 'next' | 'prev';
  className?: string;
}

export const BookFrame: React.FC<BookFrameProps> = ({
  children,
  isFlipping = false,
  flipDirection = 'next',
  className,
}) => {
  return (
    <div className={cn(
      "relative w-full max-w-6xl mx-auto book-container",
      className
    )}>
      {/* Outer Book Frame - Night purple theme */}
      <div className={cn(
        "relative rounded-xl overflow-hidden",
        // Deep purple shadow with magical glow
        "shadow-[0_20px_60px_rgba(45,26,110,0.4),0_0_0_4px_hsl(var(--purple)),0_0_0_8px_rgba(108,92,231,0.6),inset_0_0_60px_rgba(108,92,231,0.15)]",
        // Gentle fade transition
        "transition-opacity duration-300 ease-in-out",
        isFlipping && "opacity-0"
      )}>
        {/* Decorative Frame Border - Night purple gradient */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Top ornament */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gradient-to-b from-purple-500 to-purple-700 opacity-60" 
               style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' }} />
          
          {/* Corner ornaments - glowing purple */}
          <div className="absolute top-2 right-2 w-12 h-12 border-t-3 border-r-3 border-purple-400/70 rounded-tr-2xl" />
          <div className="absolute top-2 left-2 w-12 h-12 border-t-3 border-l-3 border-purple-400/70 rounded-tl-2xl" />
          <div className="absolute bottom-2 right-2 w-12 h-12 border-b-3 border-r-3 border-purple-500/70 rounded-br-2xl" />
          <div className="absolute bottom-2 left-2 w-12 h-12 border-b-3 border-l-3 border-purple-500/70 rounded-bl-2xl" />
        </div>

        {/* Night Sky Background */}
        <div 
          className="relative"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(108,92,231,0.25) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(147,51,234,0.2) 0%, transparent 50%),
              linear-gradient(to bottom, #1a0f3a, #2d1a6e)
            `,
            backgroundBlendMode: 'soft-light, soft-light, normal',
          }}
        >
          {/* Book Spine Shadow (center) - lighter for night theme */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-transparent via-black/15 to-transparent z-10 pointer-events-none hidden md:block" />
          
          {/* Inner content */}
          <div className="relative z-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookFrame;
