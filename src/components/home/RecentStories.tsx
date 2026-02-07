import { useNavigate } from "react-router-dom";
import { ChevronLeft, BookOpen } from "lucide-react";
import { SignedImage } from "@/components/ui/signed-image";

interface Story {
  id: string;
  child_name: string;
  topic: string;
  cover_url: string | null;
  created_at: string;
}

interface RecentStoriesProps {
  stories: Story[];
}

const RecentStories = ({ stories }: RecentStoriesProps) => {
  const navigate = useNavigate();

  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-label="הסיפורים האחרונים">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">הסיפורים האחרונים</h3>
        <button 
          onClick={() => navigate("/library")}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          הכל
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Stories Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => navigate(`/story/${story.id}`)}
            className="flex-shrink-0 w-28 group focus-ring rounded-xl"
            aria-label={`קרא את הסיפור של ${story.child_name}`}
          >
            {/* Cover Image */}
            <div className="w-28 h-36 rounded-xl overflow-hidden comic-shadow border-2 border-foreground/10 bg-muted group-hover:scale-[1.03] transition-transform">
              <SignedImage
                src={story.cover_url}
                storyId={story.id}
                alt={`שער הסיפור של ${story.child_name}`}
                className="w-full h-full object-cover"
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <BookOpen className="w-8 h-8 text-primary/40" aria-hidden="true" />
                  </div>
                }
              />
            </div>
            
            {/* Title */}
            <p className="mt-2 text-xs font-medium text-foreground truncate text-center">
              {story.child_name}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default RecentStories;
