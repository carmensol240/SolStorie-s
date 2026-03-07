import { useState } from 'react';
import { ChevronDown, Library } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { Badge } from './badge';
import StoryBookCard from './story-book-card';

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
  onDelete,
  onClick,
  onEdit,
  isOfflineSaved,
  downloadingId,
  getOfflineSize,
  onDownloadOffline,
  onDeleteOffline,
}: StorySeriesCardProps) => {
  const [open, setOpen] = useState(false);
  const mainStory = stories[0];
  const count = stories.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={open ? 'col-span-2' : ''}>
      <div className="relative">
        {/* Main card — first story in the series */}
        <StoryBookCard
          id={mainStory.id}
          storyId={mainStory.id}
          childName={mainStory.child_name}
          topic={mainStory.topic}
          coverUrl={getCoverImage(mainStory)}
          onDelete={onDelete}
          onEdit={onEdit}
          onClick={onClick}
          isOfflineSaved={isOfflineSaved(mainStory.id)}
          isDownloading={downloadingId === mainStory.id}
          offlineSize={getOfflineSize(mainStory.id)}
          onDownloadOffline={onDownloadOffline}
          onDeleteOffline={onDeleteOffline}
        />

        {/* Series badge overlay */}
        <CollapsibleTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-12 right-1.5 z-20 flex items-center gap-1 px-2 py-1 rounded-full
              bg-primary/90 backdrop-blur-sm text-primary-foreground text-[11px] font-bold
              shadow-lg hover:bg-primary transition-colors"
            aria-label={`סדרה עם ${count} חלקים`}
          >
            <Library className="w-3 h-3" />
            <span>📚 סדרה ({count})</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className={open ? 'col-span-2 mt-2' : ''}>
        <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-muted/50 border border-border">
          {stories.map((story, idx) => (
            <div key={story.id} className="relative">
              <StoryBookCard
                id={story.id}
                storyId={story.id}
                childName={story.child_name}
                topic={story.topic}
                coverUrl={getCoverImage(story)}
                onDelete={onDelete}
                onEdit={onEdit}
                onClick={onClick}
                isOfflineSaved={isOfflineSaved(story.id)}
                isDownloading={downloadingId === story.id}
                offlineSize={getOfflineSize(story.id)}
                onDownloadOffline={onDownloadOffline}
                onDeleteOffline={onDeleteOffline}
              />
              {/* Part number badge */}
              <Badge
                className="absolute top-1 left-1 z-20 bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 shadow-md pointer-events-none"
              >
                חלק {idx + 1}
              </Badge>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default StorySeriesCard;
