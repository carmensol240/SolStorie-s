import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Trash2, MoreVertical, Pencil, Download, Check, Loader2, HardDriveDownload, Trash, Share2 } from 'lucide-react';
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

const formatCardDate = (value: string): string => {
  try {
    return new Date(value).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
};

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
      style={{ imageOrientation: 'none' }}
    />
  );
};

export interface SeriesPart {
  id: string;
  slug: string | null;
  topic: string;
  created_at: string;
  coverUrl?: string | null;
  isTaste?: boolean;
  isOfflineSaved?: boolean;
  isDownloading?: boolean;
  offlineSize?: number;
}

/** dd.mm.yyyy */
export const formatDotDate = (value: string): string => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
};

const NewBadge = ({ className = '' }: { className?: string }) => (
  <span className={`inline-flex items-center rounded-full bg-amber-400 px-2 py-0.5 text-sm font-bold text-amber-950 shadow-md ${className}`}>
    חדש
  </span>
);

interface PolaroidCardProps {
  id: string;
  childName: string;
  topic: string;
  createdAt?: string | null;
  coverUrl: string | null;
  language?: string;
  onDelete: (id: string) => void | Promise<void>;
  onClick: (id: string) => void;
  onEdit?: (id: string) => void;
  storyId?: string;
  index?: number;
  seriesCount?: number;
  seriesParts?: SeriesPart[];
  isOfflineSaved?: boolean;
  isDownloading?: boolean;
  offlineSize?: number;
  onDownloadOffline?: (id: string) => void;
  onDeleteOffline?: (id: string) => void;
  canShare?: boolean;
  onLockedShare?: (id: string) => void;
  isNew?: boolean;
  onUnlockTaste?: (id: string) => void;
  unlockingTasteId?: string | null;
}

const PolaroidCard = ({
  id,
  childName,
  topic,
  createdAt,
  coverUrl,
  language,
  onDelete,
  onClick,
  onEdit,
  storyId,
  index = 0,
  seriesCount,
  seriesParts,
  isOfflineSaved = false,
  isDownloading = false,
  offlineSize = 0,
  onDownloadOffline,
  onDeleteOffline,
  canShare = true,
  onLockedShare,
  isNew = false,
  onUnlockTaste,
  unlockingTasteId,
}: PolaroidCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);

  const pinColor = PIN_COLORS[index % PIN_COLORS.length];

  const rotation = useMemo(() => {
    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    const deg = ((seed % 5) - 2) * 1.2;
    return deg;
  }, [id]);

  const isSeries = !!seriesParts && seriesParts.length > 1;

  useEffect(() => {
    if (!showSeriesDropdown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Let an open delete confirmation / menu close first.
      if (document.querySelector('[role="alertdialog"], [role="menu"]')) return;
      setShowSeriesDropdown(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showSeriesDropdown]);

  const handleClick = () => {
    if (isSeries) {
      setShowSeriesDropdown(prev => !prev);
    } else {
      onClick(id);
    }
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canShare) {
      onLockedShare?.(id);
      return;
    }
    const text = `✨ ${childName} קיבל סיפור מותאם אישית ב-SolStorie's! רוצים גם? 👉 soulstory.co.il`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <div
        className="group cursor-pointer flex flex-col items-center"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.3s ease, filter 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'rotate(0deg) translateY(-8px) scale(1.05)';
          e.currentTarget.style.animation = 'polaroid-glow-pulse 2s ease-in-out infinite';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = `rotate(${rotation}deg)`;
          e.currentTarget.style.animation = 'none';
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
          {/* Whole card is one real button (stretched over the frame); the share/menu buttons sit above it. */}
          <button
            type="button"
            onClick={handleClick}
            aria-label={`סיפור של ${childName}: ${topic}`}
            className="absolute inset-0 z-10 rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
          />
          {/* Series badge */}
          {seriesCount && seriesCount > 1 && (
            <div
              className="absolute -top-2 -right-2 z-20 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-white text-sm font-bold shadow-md"
              style={{
                background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
              }}
            >
              📖 {seriesCount} סיפורים
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
                <span className="text-sm text-white font-bold">EN</span>
              </div>
            )}

            {/* Offline saved badge */}
            {isOfflineSaved && (
              <div className={`absolute ${language === 'en' ? 'top-7' : 'top-1'} right-1 z-20 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-md`}>
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}

            {/* WhatsApp share button - bottom left */}
            <button
              onClick={handleShareWhatsApp}
              className="absolute bottom-1 left-1 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-green-600 backdrop-blur-sm text-white flex items-center justify-center transition-colors opacity-70 hover:opacity-100 shadow-md"
              aria-label="שתף בוואטסאפ"
              title="שתף בוואטסאפ"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {isNew && <NewBadge className="absolute bottom-1 right-1 z-20" />}

            {/* Download button */}
            {!isSeries && onDownloadOffline && !isOfflineSaved && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownloadOffline(id); }}
                disabled={isDownloading}
                className="absolute top-1 right-1 z-20 w-7 h-7 min-h-[36px] min-w-[36px] rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="הורד לקריאה אופליין"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Menu button (single stories only; folder actions live on each story inside) */}
            {!isSeries && <div className="absolute top-1 left-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
            </div>}
          </div>

          {/* Title area */}
          <div dir="rtl" aria-hidden="true" className="mt-1 px-0.5 text-center" style={{ minHeight: '24px' }}>
            <p
              className="text-sm font-bold leading-tight line-clamp-2"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '14px', color: '#e8d5ff' }}
            >
              {topic}
            </p>
            <p className="text-sm leading-tight text-purple-200/80 mt-0.5 truncate">
              {childName}{createdAt ? ` · ${formatCardDate(createdAt)}` : ''}
            </p>
            {isOfflineSaved && offlineSize > 0 && (
              <p className="text-sm text-purple-300/60 mt-0.5">{formatBytes(offlineSize)}</p>
            )}
          </div>

          {/* Series parts dropdown removed — using dialog instead */}
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

      {/* Series parts selection dialog */}
      {isSeries && showSeriesDropdown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSeriesDropdown(false); }}
        >
          <div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label={`${topic}: ${seriesParts!.length} סיפורים של ${childName}`}
            className="rounded-2xl p-4 w-full max-w-sm max-h-[80vh] shadow-2xl flex flex-col"
            style={{ background: 'linear-gradient(145deg, #2d1a6e, #1a0f3a)', border: '1px solid rgba(200,180,255,0.2)' }}
          >
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="text-base font-bold" style={{ color: '#e8d5ff' }}>
                {topic} · {seriesParts!.length} סיפורים
              </h3>
              <button
                type="button"
                autoFocus
                onClick={() => setShowSeriesDropdown(false)}
                aria-label="סגירה"
                className="min-h-[40px] min-w-[40px] rounded-full text-lg text-purple-100 hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <ul className="flex flex-col gap-2 overflow-y-auto">
              {seriesParts!.map((part) => (
                <SeriesRow
                  key={part.id}
                  part={part}
                  childName={childName}
                  onOpen={(pid) => { setShowSeriesDropdown(false); onClick(pid); }}
                  onEdit={onEdit ? (pid) => { setShowSeriesDropdown(false); onEdit(pid); } : undefined}
                  onDelete={onDelete}
                  onDownloadOffline={onDownloadOffline}
                  onDeleteOffline={onDeleteOffline}
                  onUnlockTaste={onUnlockTaste}
                  unlocking={unlockingTasteId === part.id}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

interface SeriesRowProps {
  part: SeriesPart;
  childName: string;
  onOpen: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
  onDownloadOffline?: (id: string) => void;
  onDeleteOffline?: (id: string) => void;
  onUnlockTaste?: (id: string) => void;
  unlocking?: boolean;
}

const SeriesRow = ({ part, childName, onOpen, onEdit, onDelete, onDownloadOffline, onDeleteOffline, onUnlockTaste, unlocking }: SeriesRowProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const date = formatDotDate(part.created_at);
  return (
    <li className="rounded-xl p-2 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onOpen(part.id)}
          className="flex flex-1 min-w-0 items-center gap-3 text-right rounded-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          aria-label={`פתיחת הסיפור ${part.topic} מתאריך ${date}${part.isTaste ? ', טעימה' : ''}`}
        >
          <div className="w-14 h-14 shrink-0 overflow-hidden rounded-md">
            {part.coverUrl && part.coverUrl.startsWith('http') ? (
              <CoverImage src={part.coverUrl} alt="" />
            ) : part.coverUrl ? (
              <SignedImage src={part.coverUrl} storyId={part.id} alt="" className="w-full h-full object-cover" fallback={<CoverFallback />} />
            ) : <CoverFallback />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: '#e8d5ff' }}>{part.topic}</p>
            <p className="text-sm text-purple-200/80 flex items-center gap-1.5 flex-wrap">
              <span>{date}</span>
              {part.isTaste && <span className="rounded-full bg-purple-300/25 px-2 text-sm font-bold text-purple-100">טעימה</span>}
              {part.isOfflineSaved && <Check className="w-3.5 h-3.5 text-green-400" aria-label="שמור לאופליין" />}
            </p>
          </div>
        </button>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 shrink-0 text-purple-100 hover:bg-white/10 hover:text-white rounded-full"
              aria-label={`אפשרויות לסיפור מתאריך ${date}`}
            >
              {part.isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[170px] z-[110]">
            {onEdit && (
              <DropdownMenuItem onSelect={() => onEdit(part.id)} className="gap-2 cursor-pointer text-sm">
                <Pencil className="w-4 h-4 text-primary" /><span>עריכת סיפור</span>
              </DropdownMenuItem>
            )}
            {onDownloadOffline && !part.isOfflineSaved && (
              <DropdownMenuItem disabled={part.isDownloading} onSelect={() => onDownloadOffline(part.id)} className="gap-2 cursor-pointer text-sm">
                <HardDriveDownload className="w-4 h-4 text-green-600" /><span>הורד לאופליין</span>
              </DropdownMenuItem>
            )}
            {part.isOfflineSaved && onDeleteOffline && (
              <DropdownMenuItem onSelect={() => onDeleteOffline(part.id)} className="gap-2 cursor-pointer text-sm">
                <Trash className="w-4 h-4 text-orange-500" />
                <span>מחק גרסה אופליין {part.offlineSize ? `(${formatBytes(part.offlineSize)})` : ''}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setMenuOpen(false); setTimeout(() => setConfirmDelete(true), 100); }}
              className="gap-2 cursor-pointer text-sm text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" /><span>מחיקת סיפור</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {part.isTaste && onUnlockTaste && (
        <Button size="sm" className="min-h-[44px] text-sm font-bold" disabled={unlocking} onClick={() => onUnlockTaste(part.id)}>
          {unlocking ? 'פותחים…' : 'פתחו בקרדיט אחד'}
        </Button>
      )}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק את הסיפור?</AlertDialogTitle>
            <AlertDialogDescription>
              הסיפור "{part.topic}" של {childName} מתאריך {date} יימחק לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { await onDelete(part.id); setConfirmDelete(false); }}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
};

export default PolaroidCard;
