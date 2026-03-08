import { useState } from 'react';
import { Book, Trash2, MoreVertical, Pencil, Download, Check, Loader2, HardDriveDownload, Trash } from 'lucide-react';
import { Button } from './button';
import { SignedImage } from './signed-image';
import { formatBytes } from '@/hooks/use-full-offline-storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

const CoverFallback = () => (
  <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex items-center justify-center">
    <Book className="w-10 h-10 text-primary/40" />
  </div>
);

const CoverImage = ({ src, alt }: { src: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <CoverFallback />;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className="w-full h-full object-cover"
    />
  );
};

interface StoryBookCardProps {
  id: string;
  childName: string;
  topic: string;
  coverUrl: string | null;
  language?: string;
  onDelete: (id: string) => void | Promise<void>;
  onClick: (id: string) => void;
  onEdit?: (id: string) => void;
  storyId?: string;
  // Offline props
  isOfflineSaved?: boolean;
  isDownloading?: boolean;
  offlineSize?: number;
  onDownloadOffline?: (id: string) => void;
  onDeleteOffline?: (id: string) => void;
}

const StoryBookCard = ({
  id,
  childName,
  topic,
  coverUrl,
  language,
  onDelete,
  onClick,
  onEdit,
  storyId,
  isOfflineSaved = false,
  isDownloading = false,
  offlineSize = 0,
  onDownloadOffline,
  onDeleteOffline,
}: StoryBookCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => onClick(id);

  return (
    <>
      <div
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        tabIndex={0}
        role="article"
        aria-label={`סיפור של ${childName}: ${topic}`}
        className="relative group cursor-pointer rounded-r-xl rounded-l-sm overflow-hidden aspect-[2/3]
          shadow-[4px_6px_16px_-2px_hsl(var(--primary)/0.25),_-2px_0_8px_-2px_hsl(var(--primary)/0.15)]
          hover:shadow-[6px_10px_24px_-2px_hsl(var(--primary)/0.35),_-3px_0_12px_-2px_hsl(var(--primary)/0.2)]
          hover:scale-[1.03] transition-all duration-200 ease-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          active:scale-[0.98]"
      >
        {/* Spine effect */}
        <div className="absolute left-0 top-0 w-[6px] h-full bg-gradient-to-r from-black/35 via-black/15 to-transparent z-10 pointer-events-none" />

        {/* Cover image */}
        <div className="absolute inset-0 bg-muted">
          {coverUrl && coverUrl.startsWith('http') ? (
            <CoverImage src={coverUrl} alt={topic} />
          ) : coverUrl ? (
            <SignedImage
              src={coverUrl}
              storyId={storyId || id}
              alt={topic}
              className="w-full h-full object-cover"
              fallback={<CoverFallback />}
            />
          ) : (
            <CoverFallback />
          )}
        </div>

        {/* English language badge */}
        {language === 'en' && (
          <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-md" title="English story">
            <span className="text-sm leading-none">🇺🇸</span>
            <span className="text-[10px] text-white font-bold">EN</span>
          </div>
        )}

        {/* Offline saved badge */}
        {isOfflineSaved && (
          <div className={`absolute ${language === 'en' ? 'top-8' : 'top-1.5'} right-1.5 z-20 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-md`} title="שמור אופליין">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Download button */}
        {onDownloadOffline && !isOfflineSaved && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadOffline(id);
            }}
            disabled={isDownloading}
            className="absolute top-1.5 right-1.5 z-20 w-8 h-8 min-h-[36px] min-w-[36px] rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center
              hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="הורד לקריאה אופליין"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Bottom gradient overlay with title */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 pt-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
          <h3 className="text-white text-sm font-bold leading-tight line-clamp-2 drop-shadow-md">
            הסיפור של {childName}
          </h3>
          <p className="text-white/75 text-xs mt-0.5 line-clamp-1 drop-shadow-sm">{topic}</p>
          {isOfflineSaved && offlineSize > 0 && (
            <p className="text-white/50 text-[10px] mt-0.5">{formatBytes(offlineSize)}</p>
          )}
        </div>

        {/* Menu button */}
        <div className="absolute top-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 min-h-[36px] min-w-[36px] bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white rounded-full"
                onClick={(e) => e.stopPropagation()}
                aria-label="אפשרויות נוספות"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="min-w-[160px] z-[110]" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <DropdownMenuItem onSelect={() => onEdit(id)} className="gap-2 cursor-pointer">
                  <Pencil className="w-4 h-4 text-primary" />
                  <span>עריכת סיפור</span>
                </DropdownMenuItem>
              )}
              {onDownloadOffline && !isOfflineSaved && (
                <DropdownMenuItem onSelect={() => onDownloadOffline(id)} className="gap-2 cursor-pointer">
                  <HardDriveDownload className="w-4 h-4 text-green-600" />
                  <span>הורד לאופליין</span>
                </DropdownMenuItem>
              )}
              {isOfflineSaved && onDeleteOffline && (
                <DropdownMenuItem onSelect={() => onDeleteOffline(id)} className="gap-2 cursor-pointer">
                  <Trash className="w-4 h-4 text-orange-500" />
                  <span>מחק גרסה אופליין {offlineSize > 0 ? `(${formatBytes(offlineSize)})` : ''}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  setTimeout(() => setShowDeleteDialog(true), 100);
                }}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>מחיקת סיפור</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק את הסיפור?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הסיפור לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await onDelete(id);
                setShowDeleteDialog(false);
              }}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StoryBookCard;
