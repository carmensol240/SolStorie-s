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
      {/* Previous Arrow (Right side for RTL) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrev}
            disabled={!canGoPrev || isFlipping}
            className={cn(
              "absolute right-0 md:-right-16 lg:-right-20 top-1/2 -translate-y-1/2 z-30",
              "w-12 h-20 md:w-14 md:h-24 rounded-l-full md:rounded-full",
              "bg-[#8B5A2B]/90 hover:bg-[#6B4423] text-white",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              "border-2 border-[#D4A574]"
            )}
            aria-label="עמוד קודם"
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          הקודם
        </TooltipContent>
      </Tooltip>

      {/* Next Arrow (Left side for RTL) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={!canGoNext || isFlipping}
            className={cn(
              "absolute left-0 md:-left-16 lg:-left-20 top-1/2 -translate-y-1/2 z-30",
              "w-12 h-20 md:w-14 md:h-24 rounded-r-full md:rounded-full",
              "bg-[#8B5A2B]/90 hover:bg-[#6B4423] text-white",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              "border-2 border-[#D4A574]"
            )}
            aria-label="עמוד הבא"
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
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
