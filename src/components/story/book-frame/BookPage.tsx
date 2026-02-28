import React from "react";
import { cn } from "@/lib/utils";

import { SignedImage } from "@/components/ui/signed-image";

interface BookPageProps {
  type: 'illustration' | 'text';
  illustrationUrl?: string | null;
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
  text,
  pageNumber,
  totalPages,
  fontSize = 'text-xl md:text-2xl',
  isLoading = false,
  className,
  storyId,
}) => {
  if (type === 'illustration') {
    return (
      <div className={cn(
        "relative flex-1 flex flex-col justify-center items-center p-4 md:p-6",
        // Paper texture overlay
        "bg-gradient-to-br from-[#FFFBF5] to-[#F5E6D3]",
        className
      )}>
        {/* Page fold effect */}
        <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-black/5 to-transparent" />
        
        {illustrationUrl && (
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
        )}
        
        {/* Page number */}
        {pageNumber !== undefined && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <span className="text-sm text-[#8B7355] font-serif italic">
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
      // Paper texture
      "bg-gradient-to-bl from-[#FFFBF5] to-[#FAF3E8]",
      className
    )}>
      {/* Page fold effect */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-black/5 to-transparent" />
      
      {/* Main text content */}
      <div className="flex-1 flex flex-col items-start justify-start">
        <p 
          className={cn(
            "leading-loose text-[#3D2914] text-right font-medium transition-all w-full",
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
          <span className="text-sm text-[#8B7355] font-serif italic">
            {pageNumber} / {totalPages}
          </span>
        </div>
      )}
    </div>
  );
};

export default BookPage;
