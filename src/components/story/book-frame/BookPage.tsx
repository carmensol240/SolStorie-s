import React from "react";
import { cn } from "@/lib/utils";

import { SignedImage } from "@/components/ui/signed-image";

interface BookPageProps {
  type: 'illustration' | 'text';
  illustrationUrl?: string | null;
  illustrationPrompt?: string | null;
  text?: string;
  pageNumber?: number;
  totalPages?: number;
  fontSize?: string;
  isLoading?: boolean;
  className?: string;
  storyId?: string;
}

export const BookPage: React.FC<BookPageProps> = ({
  type,
  illustrationUrl,
  illustrationPrompt,
  text,
  pageNumber,
  totalPages,
  fontSize = 'text-xl md:text-2xl',
  isLoading = false,
  className,
  storyId,
}) => {
  const isGeneratingIllustration = type === 'illustration' && !illustrationUrl && !!illustrationPrompt;
  if (type === 'illustration') {
    return (
      <div className={cn(
        "relative flex-1 flex flex-col justify-center items-center p-4 md:p-6",
        className
      )} style={{ background: 'linear-gradient(135deg, #1a0f3a, #2d1a6e)' }}>
        <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-white/5 to-transparent" />
        
        {isGeneratingIllustration ? (
          <div className="relative w-full overflow-hidden flex flex-col items-center justify-center" style={{ height: '50vh' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f3a] via-[#2d1a6e] to-[#1a0f3a] animate-pulse" />
            <div className="relative z-10 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-400/30 via-purple-500/30 to-purple-600/30 flex items-center justify-center animate-pulse">
                <span className="text-3xl">🎨</span>
              </div>
              <p className="text-sm text-purple-200 font-medium" dir="rtl">האיור נוצר...</p>
            </div>
          </div>
        ) : illustrationUrl ? (
          <div className="relative w-full">
            <div className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: '50vh' }}>
              <SignedImage
                src={illustrationUrl}
                storyId={storyId}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ) : null}
        
        {pageNumber !== undefined && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <span className="text-sm text-purple-300/70 font-serif italic">
              {pageNumber}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Text page
  return (
    <div className={cn(
      "relative flex-1 flex flex-col justify-center p-6 md:p-8 lg:p-10",
      className
    )} style={{ background: 'linear-gradient(135deg, #2d1a6e, #1a0f3a)' }}>
      {/* Page fold effect */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/5 to-transparent" />
      
      {/* Main text content */}
      <div className="flex-1 flex flex-col items-start justify-start">
        <p 
          className={cn(
            "leading-loose text-purple-100 text-right font-medium transition-all w-full",
            fontSize
          )} 
          dir="rtl"
        >
          {text}
        </p>
      </div>
      
      {/* Page number */}
      {pageNumber !== undefined && totalPages && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <span className="text-sm text-purple-300/70 font-serif italic">
            {pageNumber} / {totalPages}
          </span>
        </div>
      )}
    </div>
  );
};

export default BookPage;
