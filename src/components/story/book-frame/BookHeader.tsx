import React from "react";
import { 
  ArrowRight, 
  Share2, 
  FileDown, 
  Menu,
  Type,
  Book,
  Volume2,
  VolumeX,
  Loader2,
  RefreshCw
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
  onReadAloud?: () => void;
  onStopReading?: () => void;
  fontSizeLabel: string;
  isExporting?: boolean;
  isAddingNikud?: boolean;
  showPageActions?: boolean;
  showReadAloud?: boolean;
  isReading?: boolean;
  isLoadingAudio?: boolean;
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
  onReadAloud,
  onStopReading,
  fontSizeLabel,
  isExporting = false,
  isAddingNikud = false,
  showPageActions = false,
  showReadAloud = false,
  isReading = false,
  isLoadingAudio = false,
  hasAudioError = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-3 py-2 shadow-lg">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Back Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-[#F5E6D3] hover:bg-white/10 min-h-[44px] min-w-[44px] p-2"
              aria-label="חזרה לספרייה"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">חזרה לספרייה</TooltipContent>
        </Tooltip>

        {/* Center Actions - Essentials Only */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Read Aloud Toggle - Always visible when enabled, independent of page actions */}
          {showReadAloud && onReadAloud && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isReading ? onStopReading : onReadAloud}
                  disabled={isLoadingAudio}
                  className={cn(
                    "text-[#F5E6D3] hover:bg-white/10 min-h-[44px] min-w-[44px] p-2",
                    isReading && "bg-white/20"
                  )}
                  aria-label={isReading ? "עצור הקראה" : "הקראת הטקסט"}
                >
                  {isLoadingAudio ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isReading ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isLoadingAudio ? 'טוען...' : isReading ? 'עצור הקראה' : 'הקראת הטקסט'}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Font Size Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFontSize}
                className="text-[#F5E6D3] hover:bg-white/10 min-h-[44px] min-w-[44px] p-2"
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
                className="text-[#F5E6D3] hover:bg-white/10 min-h-[44px] min-w-[44px] p-2 disabled:opacity-50"
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
                className="text-[#F5E6D3] hover:bg-white/10 min-h-[44px] min-w-[44px] p-2"
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
                    className="text-[#F5E6D3] hover:bg-white/10 min-h-[44px] min-w-[44px] p-2"
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
