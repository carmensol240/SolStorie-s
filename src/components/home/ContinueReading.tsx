import { useNavigate } from "react-router-dom";
import { Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Story {
  id: string;
  child_name: string;
  topic: string;
  cover_url: string | null;
}

interface ContinueReadingProps {
  story: Story | null;
}

const ContinueReading = ({ story }: ContinueReadingProps) => {
  const navigate = useNavigate();

  if (!story) {
    return null;
  }

  return (
    <section className="animate-fade-in" aria-label="המשך לקרוא">
      <button
        onClick={() => navigate(`/story/${story.id}`)}
        className="w-full bg-card rounded-2xl overflow-hidden comic-shadow border-2 border-foreground/10 group focus-ring"
        aria-label={`המשך לקרוא את הסיפור של ${story.child_name}`}
      >
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden">
          {story.cover_url ? (
            <img
              src={story.cover_url}
              alt={`שער הסיפור של ${story.child_name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{ imageOrientation: 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <BookOpen className="w-16 h-16 text-primary/30" aria-hidden="true" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          
          {/* Play Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-primary-foreground mr-[-2px]" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 text-right">
          <h3 className="font-bold text-lg text-foreground">הסיפור של {story.child_name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{story.topic}</p>
          <p className="text-xs text-primary font-medium mt-2">המשיכו לקרוא ←</p>
        </div>
      </button>
    </section>
  );
};

export default ContinueReading;
