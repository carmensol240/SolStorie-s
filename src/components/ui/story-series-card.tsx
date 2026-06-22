import { useState } from 'react';
import { ChevronDown, BookOpen, Book } from 'lucide-react';
import { Badge } from './badge';
import { SignedImage } from './signed-image';
import { cn } from '@/lib/utils';

export interface SeriesStory {
  id: string;
  slug: string | null;
  child_name: string;
  topic: string;
  created_at: string;
  cover_url: string | null;
  child_gender: string | null;
  child_id: string | null;
  story_pages: { illustration_url: string | null; page_number: number }[];
}

interface StorySeriesCardProps {
  stories: SeriesStory[];
  getCoverImage: (story: SeriesStory) => string | null;
  onDelete: (id: string) => void | Promise<void>;
  onClick: (id: string) => void;
  onEdit?: (id: string) => void;
  isOfflineSaved: (id: string) => boolean;
  downloadingId: string | null;
  getOfflineSize: (id: string) => number;
  onDownloadOffline?: (id: string) => void;
  onDeleteOffline?: (id: string) => void;
}

const StorySeriesCard = ({
  stories,
  getCoverImage,
  onClick,
}: StorySeriesCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const mainStory = stories[0]; // oldest
  const count = stories.length;
  const coverUrl = getCoverImage(mainStory);

  return (
    <div className={cn('flex flex-col', expanded && 'col-span-2')}>
      {/* Main series card */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'relative rounded-r-xl rounded-l-sm overflow-hidden bg-card border-2 border-foreground/10',
          'comic-shadow hover:shadow-lg transition-all duration-200',
          'hover:scale-[1.02] active:scale-[0.98]',
          'text-right w-full',
          !expanded && 'aspect-[3/4]'
        )}
      >
        {/* Cover image */}
        <div className={cn('w-full overflow-hidden', expanded ? 'h-40' : 'h-full')}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`כריכה לחלק 1: ${mainStory.topic || ''}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex items-center justify-center">
              <Book className="w-10 h-10 text-primary/40" />
            </div>
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Bottom info */}
        <div className="absolute bottom-0 inset-x-0 p-2.5 flex flex-col items-start gap-1">
          <h3 className="text-white text-sm font-bold leading-tight drop-shadow-md line-clamp-2">
            {mainStory.topic}
          </h3>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-primary/90 text-primary-foreground text-[10px] px-1.5 py-0.5 gap-1 shadow-md">
              📖 {count} חלקים
            </Badge>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-white drop-shadow transition-transform duration-200',
                expanded && 'rotate-180'
              )}
            />
          </div>
        </div>

        {/* Spine effect */}
        <div className="absolute left-0 top-0 w-[6px] h-full bg-gradient-to-r from-foreground/15 to-transparent pointer-events-none" />
      </button>

      {/* Expanded parts list */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          expanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl bg-muted/50 border border-border overflow-hidden" dir="rtl">
            {stories.map((story, idx) => (
              <button
                key={story.id}
                onClick={() => onClick(story.id)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 text-right',
                  'hover:bg-accent/50 transition-colors',
                  idx < stories.length - 1 && 'border-b border-border',
                  expanded
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                )}
                style={{
                  transition: `opacity 0.25s ease-out ${idx * 80}ms, transform 0.25s ease-out ${idx * 80}ms, background-color 0.15s`,
                }}
              >
                {/* Thumbnail */}
                <div className="w-12 h-14 rounded-md overflow-hidden flex-shrink-0 border border-foreground/10">
                  {getCoverImage(story) ? (
                    <img
                      src={getCoverImage(story)!}
                      alt={`כריכה לחלק ${idx + 1}: ${story.topic || ''}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">חלק {idx + 1}</p>
                  <p className="text-xs text-muted-foreground truncate">{story.child_name}</p>
                </div>

                {/* Read button */}
                <span className="text-xs font-bold text-primary flex-shrink-0">
                  קראו &larr;
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorySeriesCard;
