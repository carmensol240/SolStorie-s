import { useState, useEffect } from 'react';
import { Book, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';

interface StoryListItemProps {
  id: string;
  childName: string;
  topic: string;
  coverUrl: string | null;
  createdAt: string;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  className?: string;
  storyId?: string; // For signed URL fetching
}

const StoryListItem = ({
  id,
  childName,
  topic,
  coverUrl,
  createdAt,
  onDelete,
  onClick,
  className,
  storyId,
}: StoryListItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { fetchSignedUrls } = useSignedUrls();

  // Fetch signed URL when coverUrl changes
  useEffect(() => {
    if (!coverUrl) {
      setSignedUrl(null);
      return;
    }

    const fetchUrl = async () => {
      try {
        const urls = await fetchSignedUrls([coverUrl], storyId || id);
        setSignedUrl(urls[coverUrl] || coverUrl);
      } catch (err) {
        console.error('Error fetching signed cover URL:', err);
        setSignedUrl(coverUrl); // Fallback to original
      }
    };

    fetchUrl();
  }, [coverUrl, storyId, id, fetchSignedUrls]);

  const formattedDate = format(new Date(createdAt), 'd בMMMM yyyy', { locale: he });

  const handleClick = () => {
    onClick(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const confirmDelete = () => {
    onDelete(id);
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      tabIndex={0}
      role="article"
      aria-label={`סיפור של ${childName}: ${topic}`}
      className={cn(
        'flex items-center gap-3 p-3 bg-card rounded-xl',
        'border border-border/50 cursor-pointer',
        'hover:shadow-md hover:border-primary/20 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        className
      )}
    >
      {/* Right: Square Thumbnail - Always visible */}
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20">
        {!imageError && (signedUrl || coverUrl) ? (
          <>
            {!imageLoaded && (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse flex items-center justify-center">
                <Book className="w-6 h-6 text-primary/30" />
              </div>
            )}
            <img
              src={signedUrl || coverUrl || ''}
              alt={topic}
              loading="lazy"
              onLoad={() => {
                setImageLoaded(true);
              }}
              onError={() => {
                setImageError(true);
              }}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Book className="w-8 h-8 text-primary/40" />
          </div>
        )}
      </div>

      {/* Center: Title + Date */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground truncate">
          הסיפור של {childName}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{topic}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{formattedDate}</p>
      </div>

      {/* Left: Delete Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 h-10 w-10 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleDelete}
            aria-label="מחיקת סיפור"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק את הסיפור?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הסיפור לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StoryListItem;
