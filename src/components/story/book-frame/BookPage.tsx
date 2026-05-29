import React, { useRef } from "react";
import { cn } from "@/lib/utils";

import { SignedImage } from "@/components/ui/signed-image";
import { useAutoFitText } from "@/hooks/use-auto-fit-text";

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
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  // Auto-fit: shrink font size until text fits the page without scrolling.
  useAutoFitText(textContainerRef, textRef, [text, fontSize, type]);
  if (type === 'illustration') {
    return (
      <div className={cn(
        "relative flex-1 flex flex-col",
        className
      )}>
        {isGeneratingIllustration ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FFFBF5] via-[#F5E6D3] to-[#FAF3E8]">
            <div className="relative z-10 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-400/30 via-purple-500/30 to-purple-600/30 flex items-center justify-center animate-pulse">
                <span className="text-3xl">🎨</span>
              </div>
              <p className="text-sm text-[#8B7355] font-medium" dir="rtl">האיור נוצר...</p>
            </div>
          </div>
        ) : illustrationUrl ? (
          <SignedImage
            src={illustrationUrl}
            storyId={storyId}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        
        {pageNumber !== undefined && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <span className="text-sm text-white/70 font-serif italic drop-shadow">
              {pageNumber}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Text page
  const sanitizedText = (text || "").replace(/\[\s*(?:עמוד|page|עמ׳|עמ\.?)\s*\d+\s*\]/gi, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return (
    <div
      ref={textContainerRef}
      className={cn(
        "relative flex-1 flex flex-col justify-center p-6 md:p-8 lg:p-10 overflow-hidden",
        className
      )}
      style={{ background: 'linear-gradient(135deg, #2d1a6e, #1a0f3a)' }}
    >
      {/* Page fold effect */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/5 to-transparent" />
      
      {/* Main text content */}
      <div className="flex-1 flex flex-col items-start justify-start">
        <p
          ref={textRef}
          className={cn(
            "leading-loose text-purple-100 text-right font-medium transition-all w-full",
            fontSize
          )} 
          dir="rtl"
        >
          {sanitizedText}
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
