import React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavigationArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  isFlipping?: boolean;
}

export const NavigationArrows: React.FC<NavigationArrowsProps> = ({
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  isFlipping = false,
}) => {
  return (
    <>
      {/* Previous Arrow (Right side for RTL) - Subtle, semi-transparent */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrev}
            disabled={!canGoPrev || isFlipping}
            className={cn(
              "absolute right-2 md:-right-16 lg:-right-20 top-1/2 -translate-y-1/2 z-30",
              "w-8 h-8 md:w-14 md:h-14 rounded-full",
              "bg-purple-900/50 hover:bg-purple-800/70 text-purple-200 hover:text-white",
              "backdrop-blur-md transition-all duration-300",
              "disabled:opacity-20 disabled:cursor-not-allowed",
              "border border-purple-500/30 shadow-md hover:shadow-lg hover:shadow-purple-500/20"
            )}
            aria-label="עמוד קודם"
          >
            <ChevronRight className="w-4 h-4 md:w-7 md:h-7" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          הקודם
        </TooltipContent>
      </Tooltip>

      {/* Next Arrow (Left side for RTL) - Subtle, semi-transparent */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={!canGoNext || isFlipping}
            className={cn(
              "absolute left-2 md:-left-16 lg:-left-20 top-1/2 -translate-y-1/2 z-30",
              "w-8 h-8 md:w-14 md:h-14 rounded-full",
              "bg-white/50 hover:bg-white/80 text-purple-600 hover:text-purple-700",
              "backdrop-blur-md transition-all duration-300",
              "disabled:opacity-20 disabled:cursor-not-allowed",
              "border border-purple-200 shadow-md hover:shadow-lg"
            )}
            aria-label="עמוד הבא"
          >
            <ChevronLeft className="w-4 h-4 md:w-7 md:h-7" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          הבא
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export default NavigationArrows;
