import { Book, Trash2, MoreVertical, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { SignedImage } from './signed-image';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface StoryListItemProps {
  id: string;
  childName: string;
  topic: string;
  coverUrl: string | null;
  createdAt: string;
  childGender?: 'male' | 'female';
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  onGenderSwap?: (id: string) => void;
  className?: string;
  storyId?: string; // For signed URL fetching
}

const StoryListItem = ({
  id,
  childName,
  topic,
  coverUrl,
  createdAt,
  childGender,
  onDelete,
  onClick,
  onGenderSwap,
  className,
  storyId,
}: StoryListItemProps) => {
  const formattedDate = format(new Date(createdAt), 'd בMMMM yyyy', { locale: he });

  const handleClick = () => {
    onClick(id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const confirmDelete = () => {
    onDelete(id);
  };

  const handleGenderSwap = () => {
    onGenderSwap?.(id);
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
        <SignedImage
          src={coverUrl}
          storyId={storyId || id}
          alt={topic}
          className="w-full h-full object-cover"
          fallback={
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Book className="w-8 h-8 text-primary/40" />
            </div>
          }
        />
      </div>

      {/* Center: Title + Date */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground truncate">
          הסיפור של {childName}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{topic}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{formattedDate}</p>
      </div>

      {/* Left: Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 h-10 w-10 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={handleMenuClick}
            aria-label="אפשרויות נוספות"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          {onGenderSwap && (
            <DropdownMenuItem onClick={handleGenderSwap} className="gap-2 cursor-pointer">
              <RefreshCw className="w-4 h-4 text-primary" />
              <span>שינוי מגדר הגיבור/ה</span>
            </DropdownMenuItem>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem 
                onSelect={(e) => e.preventDefault()} 
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>מחיקת סיפור</span>
              </DropdownMenuItem>
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default StoryListItem;
