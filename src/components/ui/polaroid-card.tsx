import { useState, useMemo } from 'react';
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

const PIN_COLORS = ['#f0c040', '#9b59b6', '#3498db', '#e84393', '#00cec9', '#6c5ce7'];

const CoverFallback = () => (
  <div className="w-full h-full bg-gradient-to-br from-[#2d1a6e]/60 via-[#1a0f3a]/40 to-[#6c5ce7]/30 flex items-center justify-center">
    <Book className="w-10 h-10 text-white/30" />
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

interface PolaroidCardProps {
  id: string;
  childName: string;
  topic: string;
  coverUrl: string | null;
  language?: string;
  onDelete: (id: string) => void | Promise<void>;
  onClick: (id: string) => void;
  onEdit?: (id: string) => void;
  storyId?: string;
  index?: number;
  seriesCount?: number;
  isOfflineSaved?: boolean;
  isDownloading?: boolean;
  offlineSize?: number;
  onDownloadOffline?: (id: string) => void;
  onDeleteOffline?: (id: string) => void;
}

const PolaroidCard = ({
  id,
  childName,
  topic,
  coverUrl,
  language,
  onDelete,
  onClick,
  onEdit,
  storyId,
  index = 0,
  seriesCount,
  isOfflineSaved = false,
  isDownloading = false,
  offlineSize = 0,
  onDownloadOffline,
  onDeleteOffline,
}: PolaroidCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const pinColor = PIN_COLORS[index % PIN_COLORS.length];

  const rotation = useMemo(() => {
    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    const deg = ((seed % 5) - 2) * 1.2;
    return deg;
  }, [id]);

  const handleClick = () => onClick(id);

  return (
    <>
      <div
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        tabIndex={0}
        role="article"
        aria-label={`סיפור של ${childName}: ${topic}`}
        className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 flex flex-col items-center"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.3s ease, filter 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'rotate(0deg) translateY(-8px) scale(1.05)';
          e.currentTarget.style.filter = 'drop-shadow(0 0 16px rgba(108,92,231,0.5))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = `rotate(${rotation}deg)`;
          e.currentTarget.style.filter = 'none';
        }}
      >
        {/* Pin */}
        <div
          className="relative z-10 -mb-2"
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${pinColor}dd, ${pinColor})`,
            boxShadow: `0 1px 4px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.4)`,
          }}
        />

        {/* Polaroid frame */}
        <div
          className="relative"
          style={{
            width: '148px',
            padding: '7px 7px 38px 7px',
            background: 'linear-gradient(145deg, #2d1a6e, #1a0f3a)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(200,180,255,0.15)',
            borderRadius: '4px',
          }}
        >
          {/* Series badge */}
          {seriesCount && seriesCount > 1 && (
            <div
              className="absolute -top-2 -right-2 z-20 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-white text-[10px] font-bold shadow-md"
              style={{
                background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
              }}
            >
              📖 {seriesCount} חלקים
            </div>
          )}

          {/* Cover image */}
          <div className="relative overflow-hidden" style={{ width: '134px', height: '160px' }}>
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

            {/* English badge */}
            {language === 'en' && (
              <div className="absolute top-1 right-1 z-20 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-md">
                <span className="text-sm leading-none">🇺🇸</span>
                <span className="text-[10px] text-white font-bold">EN</span>
              </div>
            )}

            {/* Offline saved badge */}
            {isOfflineSaved && (
              <div className={`absolute ${language === 'en' ? 'top-7' : 'top-1'} right-1 z-20 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-md`}>
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}

            {/* Download button */}
            {onDownloadOffline && !isOfflineSaved && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownloadOffline(id); }}
                disabled={isDownloading}
                className="absolute top-1 right-1 z-20 w-7 h-7 min-h-[36px] min-w-[36px] rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="הורד לקריאה אופליין"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Menu button */}
            <div className="absolute top-1 left-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 min-h-[36px] min-w-[36px] bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white rounded-full"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="אפשרויות נוספות"
                  >
                    <MoreVertical className="w-3 h-3" />
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

          {/* Title area */}
          <div dir="rtl" className="mt-1 px-0.5 text-center" style={{ height: '24px' }}>
            <p
              className="text-xs font-bold leading-tight line-clamp-1"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '14px', color: '#2a1a5a' }}
            >
              {topic}
            </p>
            {isOfflineSaved && offlineSize > 0 && (
              <p className="text-[9px] text-gray-400 mt-0.5">{formatBytes(offlineSize)}</p>
            )}
          </div>
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

export default PolaroidCard;
