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
  Palette,
  MessageCircle,
  Lock,
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
  onShareWhatsApp?: () => void;
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
  canRegenerateCover?: boolean;
  page1RegenUsed?: boolean;
  // Coloring shortcut
  onColoring?: () => void;
  // PDF entitlement
  pdfLocked?: boolean;
  coloringLocked?: boolean;
}

export const BookHeader: React.FC<BookHeaderProps> = ({
  onBack,
  onShare,
  onDownload,
  onShareWhatsApp,
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
  canRegenerateCover = false,
  page1RegenUsed = false,
  onColoring,
  pdfLocked = false,
  coloringLocked = false,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b border-white/30 px-3 py-2 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.75)' }}>
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Back Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-600 hover:bg-sky-100/60 min-h-[44px] p-2 gap-1"
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
                className="text-slate-600 hover:bg-sky-100/60 min-h-[44px] min-w-[44px] p-2"
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
                className="text-slate-600 hover:bg-sky-100/60 min-h-[44px] min-w-[44px] p-2 disabled:opacity-50"
                aria-label="הורדה או הדפסה"
              >
                <span className="relative inline-flex">
                  <FileDown className={cn("w-5 h-5", isExporting && "animate-pulse")} />
                  {pdfLocked && (
                    <Lock
                      className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-white rounded-full p-[1px] text-slate-700 shadow-sm"
                      aria-hidden="true"
                    />
                  )}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {pdfLocked ? "שדרגו לחבילת ההדפסה" : "הורד או הדפס PDF"}
            </TooltipContent>
          </Tooltip>

          {/* Share to WhatsApp */}
          {onShareWhatsApp && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShareWhatsApp}
                  disabled={isExporting}
                  className="hidden md:inline-flex text-green-600 hover:bg-green-100/60 min-h-[44px] min-w-[44px] p-2 disabled:opacity-50"
                  aria-label="שיתוף בוואטסאפ"
                >
                  <MessageCircle className={cn("w-5 h-5", isExporting && "animate-pulse")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">שלח את ה-PDF בוואטסאפ</TooltipContent>
            </Tooltip>
          )}

          {/* Coloring Pages Shortcut */}
          {onColoring && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onColoring}
                  className="hidden md:inline-flex text-slate-600 hover:bg-sky-100/60 min-h-[44px] min-w-[44px] p-2"
                  aria-label="דפי צביעה"
                >
                  <span className="relative inline-flex">
                    <Palette className="w-5 h-5" />
                    {coloringLocked && (
                      <Lock
                        className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-white rounded-full p-[1px] text-slate-700 shadow-sm"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {coloringLocked ? "שדרגו לחבילת דפי הצביעה" : "דפי צביעה"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Save for Offline Reading */}
          {onSaveOffline && (
            <div className="hidden md:block">
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
                      ? "text-green-600 hover:bg-green-100/40" 
                      : "text-slate-600 hover:bg-sky-100/60",
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
            </div>
          )}

          {/* What Happens Next? */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden md:inline-flex text-slate-600 hover:bg-sky-100/60 min-h-[44px] min-w-[44px] p-2"
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
                <p className="font-bold text-sm text-slate-700">
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
                   className="hidden md:inline-flex text-slate-600 hover:bg-sky-100/60 min-h-[44px] min-w-[44px] p-2"
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
                    className="text-slate-600 hover:bg-sky-100/60 min-h-[44px] min-w-[44px] p-2"
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
              {onToggleNikud && (
                <DropdownMenuItem onClick={onToggleNikud} className="gap-2 cursor-pointer">
                  <span>{showNikud ? 'א' : 'אָ'}</span>
                  <span>{showNikud ? 'הסר ניקוד' : 'הוסף ניקוד'}</span>
                </DropdownMenuItem>
              )}
              {/* Mobile-only fallbacks for actions hidden in the header on small screens */}
              {onColoring && (
                <DropdownMenuItem onClick={onColoring} className="gap-2 cursor-pointer md:hidden">
                  <span className="relative inline-flex">
                    <Palette className="w-4 h-4" />
                    {coloringLocked && (
                      <Lock
                        className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full p-[1px] text-slate-700 shadow-sm"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span>{coloringLocked ? "דפי צביעה (נעול)" : "דפי צביעה"}</span>
                </DropdownMenuItem>
              )}
              {onShareWhatsApp && (
                <DropdownMenuItem onClick={onShareWhatsApp} disabled={isExporting} className="gap-2 cursor-pointer md:hidden">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span>שלח בוואטסאפ</span>
                </DropdownMenuItem>
              )}
              {onToggleMusic && (
                <DropdownMenuItem onClick={onToggleMusic} className="gap-2 cursor-pointer md:hidden">
                  {isMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{isMusicPlaying ? 'כבה מוזיקת רקע' : 'הפעל מוזיקת רקע'}</span>
                </DropdownMenuItem>
              )}
              {onSaveOffline && (
                <DropdownMenuItem
                  onClick={onSaveOffline}
                  disabled={isDownloadingOffline || isSavedOffline}
                  className="gap-2 cursor-pointer md:hidden"
                >
                  {isDownloadingOffline ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSavedOffline ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isSavedOffline ? 'שמור לקריאה אופליין' : 'שמור לקריאה ללא אינטרנט'}</span>
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
