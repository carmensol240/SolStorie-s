import React from "react";
import { 
  ArrowRight, 
  FileDown, 
  Menu,
  Type,
  Sparkles,
  Volume2,
  VolumeX,
  Download,
  Check,
  Loader2,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
  // Offline download
  onSaveOffline?: () => void;
  isSavedOffline?: boolean;
  isDownloadingOffline?: boolean;
  // Regenerate cover
  onRegenerateCover?: () => void;
  isRegeneratingCover?: boolean;
}

export const BookHeader: React.FC<BookHeaderProps> = ({
  onBack,
  onShare,
  onDownload,
  onToggleFontSize,
  onEdit,
  onReport,
  onAddNikud,
  onToggleNikud,
  showNikud = true,
  fontSizeLabel,
  isExporting = false,
  isAddingNikud = false,
  showPageActions = false,
  isMusicPlaying = false,
  onToggleMusic,
  onSaveOffline,
  isSavedOffline = false,
  isDownloadingOffline = false,
  onRegenerateCover,
  isRegeneratingCover = false,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm border-b border-purple-500/30 px-3 py-2 shadow-sm" style={{ background: 'rgba(26,15,58,0.95)' }}>
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Back Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-purple-200 hover:bg-purple-500/20 min-h-[44px] p-2 gap-1"
              aria-label="חזרה לספרייה"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-medium">חזרה</span>
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
                className="text-purple-200 hover:bg-purple-500/20 min-h-[44px] min-w-[44px] p-2"
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
                className="text-purple-200 hover:bg-purple-500/20 min-h-[44px] min-w-[44px] p-2 disabled:opacity-50"
                aria-label="הורדה או הדפסה"
              >
                <FileDown className={cn("w-5 h-5", isExporting && "animate-pulse")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">הורד או הדפס PDF</TooltipContent>
          </Tooltip>

          {/* Save for Offline Reading */}
          {onSaveOffline && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSaveOffline}
                  disabled={isDownloadingOffline || isSavedOffline}
                  className={cn(
                    "min-h-[44px] min-w-[44px] p-2",
                    isSavedOffline 
                      ? "text-green-400 hover:bg-green-500/20" 
                      : "text-purple-200 hover:bg-purple-500/20",
                    isDownloadingOffline && "animate-pulse"
                  )}
                  aria-label={isSavedOffline ? "הסיפור שמור לקריאה אופליין" : "שמור לקריאה ללא אינטרנט"}
                >
                  {isDownloadingOffline ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isSavedOffline ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isSavedOffline ? "✅ שמור לקריאה אופליין" : "שמור לקריאה ללא אינטרנט"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* What Happens Next? */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-200 hover:bg-purple-500/20 min-h-[44px] min-w-[44px] p-2"
                    aria-label="מה קורה בהמשך?"
                  >
                    <Sparkles className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">מה קורה בהמשך?</TooltipContent>
            </Tooltip>
            <PopoverContent align="start" className="w-72 text-right" dir="rtl">
              <div className="space-y-2">
                <p className="font-bold text-sm text-purple-200">
                  📖 אהבתם? בבחירה הבאה באותו נושא, מחכה לכם המשך להרפתקה!
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ב-SolStories, הקסם לא נגמר. המערכת שלנו זוכרת את המסע שלכם, ובפעם הבאה שתבחרו באותו נושא, הגיבור שלכם ימשיך להרפתקה חדשה באותו עולם!
                </p>
              </div>
            </PopoverContent>
          </Popover>

          {/* Background Music Toggle */}
          {onToggleMusic && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleMusic}
                   className="text-purple-200 hover:bg-purple-500/20 min-h-[44px] min-w-[44px] p-2"
                  aria-label={isMusicPlaying ? "כבה מוזיקת רקע" : "הפעל מוזיקת רקע"}
                >
                  {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{isMusicPlaying ? "כבה מוזיקת רקע" : "הפעל מוזיקת רקע"}</TooltipContent>
            </Tooltip>
          )}

          {/* Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-200 hover:bg-purple-500/20 min-h-[44px] min-w-[44px] p-2"
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
              {onRegenerateCover && (
                <DropdownMenuItem 
                  onClick={onRegenerateCover} 
                  disabled={isRegeneratingCover}
                  className="gap-2 cursor-pointer"
                >
                  <span>🎨</span>
                  <span>{isRegeneratingCover ? 'מייצר כריכה...' : 'ייצר כריכה מחדש'}</span>
                </DropdownMenuItem>
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
