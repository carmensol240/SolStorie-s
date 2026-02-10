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
              "w-10 h-10 md:w-14 md:h-14 rounded-full",
              "bg-white/80 hover:bg-white text-purple-600 hover:text-purple-700",
              "backdrop-blur-md transition-all duration-300",
              "disabled:opacity-20 disabled:cursor-not-allowed",
              "border-2 border-purple-300 shadow-lg hover:shadow-xl",
              "hidden md:flex"
            )}
            aria-label="עמוד קודם"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
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
              "w-10 h-10 md:w-14 md:h-14 rounded-full",
              "bg-white/60 hover:bg-white/90 text-purple-600 hover:text-purple-700",
              "backdrop-blur-md transition-all duration-300",
              "disabled:opacity-20 disabled:cursor-not-allowed",
              "border-2 border-purple-300 shadow-lg hover:shadow-xl"
            )}
            aria-label="עמוד הבא"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
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
