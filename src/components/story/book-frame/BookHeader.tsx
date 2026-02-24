import React from "react";
import { 
  ArrowRight, 
  Share, 
  FileDown, 
  Menu,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface BookHeaderProps {
  onBack: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDigitalBook?: () => void;
  onToggleFontSize: () => void;
  onEdit?: () => void;
  onRate?: () => void;
  onReport?: () => void;
  onAddNikud?: () => void;
  onDraw?: () => void;
  onToggleNikud?: () => void;
  showNikud?: boolean;
  fontSizeLabel: string;
  isExporting?: boolean;
  isAddingNikud?: boolean;
  showPageActions?: boolean;
  hasAudioError?: boolean;
}

export const BookHeader: React.FC<BookHeaderProps> = ({
  onBack,
  onShare,
  onDownload,
  // onDigitalBook removed - feature disabled
  onToggleFontSize,
  onEdit,
  // onRate removed - feature disabled
  onReport,
  onAddNikud,
  // onDraw removed - not in essential list
  onToggleNikud,
  showNikud = true,
  fontSizeLabel,
  isExporting = false,
  isAddingNikud = false,
  showPageActions = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF3E8]/95 backdrop-blur-sm border-b border-[#D4C4B0] px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Back Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-[#5D3A1A] hover:bg-[#D4A574]/20 min-h-[44px] min-w-[44px] p-2"
              aria-label="חזרה לספרייה"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">חזרה לספרייה</TooltipContent>
        </Tooltip>

        {/* Center Actions - Essentials Only */}
        <div className="flex items-center gap-1 md:gap-2">

          {/* Font Size Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFontSize}
                className="text-[#5D3A1A] hover:bg-[#D4A574]/20 min-h-[44px] min-w-[44px] p-2"
                aria-label={`גודל טקסט: ${fontSizeLabel}`}
              >
                <Type className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">שנה גודל טקסט ({fontSizeLabel})</TooltipContent>
          </Tooltip>

          {/* Download PDF */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                disabled={isExporting}
                className="text-[#5D3A1A] hover:bg-[#D4A574]/20 min-h-[44px] min-w-[44px] p-2 disabled:opacity-50"
                aria-label="הורדה או הדפסה"
              >
                <FileDown className={cn("w-5 h-5", isExporting && "animate-pulse")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">הורד או הדפס PDF</TooltipContent>
          </Tooltip>

          {/* Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShare}
                className="text-[#5D3A1A] hover:bg-[#D4A574]/20 min-h-[44px] min-w-[44px] p-2"
                aria-label="שתף סיפור"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">שתף סיפור</TooltipContent>
          </Tooltip>

          {/* Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#5D3A1A] hover:bg-[#D4A574]/20 min-h-[44px] min-w-[44px] p-2"
                    aria-label="תפריט"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">תפריט אפשרויות</TooltipContent>
            </Tooltip>
            
            <DropdownMenuContent align="start" className="w-48">
              {showPageActions && (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
                      <span>✏️</span>
                      <span>עריכת טקסט</span>
                    </DropdownMenuItem>
                  )}
                  {onAddNikud && (
                    <DropdownMenuItem 
                      onClick={onAddNikud} 
                      disabled={isAddingNikud}
                      className="gap-2 cursor-pointer"
                    >
                      <span>✨</span>
                      <span>{isAddingNikud ? 'מוסיף ניקוד...' : 'הוסף ניקוד'}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              {onReport && (
                <DropdownMenuItem onClick={onReport} className="gap-2 cursor-pointer text-destructive">
                  <span>🚨</span>
                  <span>דווח על תקלה</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default BookHeader;
