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
      {/* Outer Book Frame - Elegant with fade transitions */}
      <div className={cn(
        "relative rounded-xl overflow-hidden",
        // Elegant shadow with purple theme
        "shadow-[0_20px_60px_rgba(0,0,0,0.15),0_0_0_4px_theme(colors.purple.300),0_0_0_8px_theme(colors.purple.500),inset_0_0_60px_rgba(147,51,234,0.05)]",
        // Gentle fade transition instead of flip
        "transition-opacity duration-300 ease-in-out",
        isFlipping && "opacity-0"
      )}>
        {/* Decorative Frame Border - Purple-pink gradient effect */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Top ornament */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gradient-to-b from-purple-400 to-pink-400" 
               style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' }} />
          
          {/* Corner ornaments */}
          <div className="absolute top-2 right-2 w-12 h-12 border-t-3 border-r-3 border-purple-400 rounded-tr-2xl opacity-80" />
          <div className="absolute top-2 left-2 w-12 h-12 border-t-3 border-l-3 border-purple-400 rounded-tl-2xl opacity-80" />
          <div className="absolute bottom-2 right-2 w-12 h-12 border-b-3 border-r-3 border-pink-400 rounded-br-2xl opacity-80" />
          <div className="absolute bottom-2 left-2 w-12 h-12 border-b-3 border-l-3 border-pink-400 rounded-bl-2xl opacity-80" />
        </div>

        {/* Paper Texture Background */}
        <div 
          className="relative bg-[#FEF9F0]"
          style={{
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"),
              linear-gradient(to bottom, rgba(254,249,240,0.95), rgba(245,230,211,0.95))
            `,
            backgroundBlendMode: 'soft-light, normal',
          }}
        >
          {/* Book Spine Shadow (center) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-transparent via-purple-900/10 to-transparent z-10 pointer-events-none hidden md:block" />
          
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
