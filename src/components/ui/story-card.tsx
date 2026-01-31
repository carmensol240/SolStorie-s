import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Headphones, Sparkles, Moon, GraduationCap, Heart, TreePine, Crown, Pencil, Trash2 } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '@/lib/utils';
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

interface StoryCardProps {
  id: string;
  title: string;
  childName: string;
  coverUrl?: string | null;
  theme?: string;
  storyType?: string;
  minAge?: number;
  maxAge?: number;
  isPremium?: boolean;
  className?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const themeIcons: Record<string, React.ReactNode> = {
  adventure: <Sparkles className="h-3 w-3" />,
  bedtime: <Moon className="h-3 w-3" />,
  educational: <GraduationCap className="h-3 w-3" />,
  friendship: <Heart className="h-3 w-3" />,
  nature: <TreePine className="h-3 w-3" />,
};

const themeLabels: Record<string, string> = {
  adventure: 'הרפתקה',
  bedtime: 'לפני השינה',
  educational: 'לימודי',
  friendship: 'חברות',
  nature: 'טבע',
};

const typeIcons: Record<string, React.ReactNode> = {
  text: <Book className="h-3 w-3" />,
  audio: <Headphones className="h-3 w-3" />,
  interactive: <Sparkles className="h-3 w-3" />,
};

const StoryCard = ({
  id,
  title,
  childName,
  coverUrl,
  theme = 'adventure',
  storyType = 'text',
  minAge = 0,
  maxAge = 10,
  isPremium = false,
  className,
  onEdit,
  onDelete,
}: StoryCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const ageLabel = `${minAge}-${maxAge}`;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const confirmDelete = () => {
    onDelete?.(id);
  };

  return (
    <div
      onClick={() => navigate(`/story/${id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/story/${id}`)}
      tabIndex={0}
      role="article"
      aria-label={`סיפור של ${childName}: ${title}`}
      className={cn(
        'relative bg-card rounded-2xl overflow-hidden cursor-pointer',
        'transform transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1',
        'comic-shadow hover:shadow-lg',
        'border-2 border-foreground/10',
        'active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {!imageError && coverUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
            )}
            <img
              src={coverUrl}
              alt={title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Book className="h-16 w-16 text-primary/50" />
          </div>
        )}

        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-500 text-white gap-1">
              <Crown className="h-3 w-3" />
              פרימיום
            </Badge>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="gap-1">
            {typeIcons[storyType]}
          </Badge>
        </div>

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {onEdit && (
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-110 active:scale-95"
                onClick={handleEdit}
                aria-label="עריכת סיפור"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-10 w-10 rounded-full min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-110 active:scale-95"
                    onClick={handleDelete}
                    aria-label="מחיקת סיפור"
                  >
                    <Trash2 className="h-4 w-4" />
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
            )}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3">
        <h3 className="font-bold text-foreground line-clamp-1 mb-1">
          הסיפור של {childName}
        </h3>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Age Badge */}
          <Badge variant="outline" className="text-xs">
            גיל {ageLabel}
          </Badge>

          {/* Theme Badge */}
          <Badge variant="secondary" className="text-xs gap-1">
            {themeIcons[theme]}
            {themeLabels[theme] || theme}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
