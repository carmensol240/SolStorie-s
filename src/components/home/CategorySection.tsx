import { useNavigate } from "react-router-dom";
import { ChevronLeft, BookOpen } from "lucide-react";
import { SignedImage } from "@/components/ui/signed-image";
import type { CharacterSection } from "@/components/wizard/topic-data";

interface StoryItem {
  id: string;
  child_name: string;
  topic: string;
  cover_url: string | null;
  created_at: string;
}

interface CategorySectionProps {
  section: CharacterSection;
  stories: StoryItem[];
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const CategorySection = ({ section, stories, colorClass, bgClass, borderClass }: CategorySectionProps) => {
  const navigate = useNavigate();

  return (
    <section className="space-y-3" dir="rtl">
      {/* Banner */}
      <button
        onClick={() => navigate(`/category/${section.id}`)}
        className={`relative w-full rounded-2xl overflow-hidden ${borderClass} border-2 group`}
        aria-label={`${section.categoryLabel} - ${section.character}`}
      >
        <div className="relative h-36 w-full">
          <img
            src={section.heroImage}
            alt={section.character}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
            }}
          />
          {/* Text */}
          <div className="absolute inset-0 flex flex-col justify-center items-end pr-5 gap-1">
            <span className="text-white/80 text-xs font-medium">
              {section.character} {section.categoryEmoji}
            </span>
            <h3 className="text-white text-lg font-black drop-shadow-md">
              {section.categoryLabel}
            </h3>
          </div>
        </div>
      </button>

      {/* "See All" + Stories row */}
      <div className="flex items-center justify-between px-1">
        <span className={`text-sm font-bold ${colorClass}`}>
          {section.categoryEmoji} {section.categoryLabel}
        </span>
        <button
          onClick={() => navigate(`/category/${section.id}`)}
          className={`flex items-center gap-1 text-xs font-medium ${colorClass} hover:opacity-80 transition-opacity`}
        >
          הצג הכל
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal story carousel */}
      {stories.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => navigate(`/story/${story.id}`)}
              className="flex-shrink-0 w-28 group focus-ring rounded-xl"
              aria-label={`קרא את הסיפור של ${story.child_name}`}
            >
              <div className={`w-28 h-36 rounded-xl overflow-hidden shadow-md ${borderClass} border bg-muted group-hover:scale-[1.03] transition-transform`}>
                <SignedImage
                  src={story.cover_url}
                  storyId={story.id}
                  alt={`שער הסיפור של ${story.child_name}`}
                  className="w-full h-full object-cover"
                  fallback={
                    <div className={`w-full h-full flex items-center justify-center ${bgClass}`}>
                      <BookOpen className={`w-8 h-8 ${colorClass} opacity-40`} />
                    </div>
                  }
                />
              </div>
              <p className="mt-2 text-xs font-medium text-foreground truncate text-center">
                {story.child_name}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className={`rounded-xl ${bgClass} py-6 text-center`}>
          <p className="text-sm text-muted-foreground">
            עדיין אין סיפורים בקטגוריה זו
          </p>
          <button
            onClick={() => navigate(`/category/${section.id}`)}
            className={`mt-2 text-xs font-bold ${colorClass} hover:opacity-80`}
          >
            צרו את הסיפור הראשון ✨
          </button>
        </div>
      )}
    </section>
  );
};

export default CategorySection;
