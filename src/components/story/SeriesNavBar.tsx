import { cn } from "@/lib/utils";
import { BookOpen, ChevronLeft } from "lucide-react";

export interface SeriesPart {
  id: string;
  slug: string | null;
  topic: string;
  created_at: string;
}

interface SeriesNavBarProps {
  parts: SeriesPart[];
  currentStoryId: string;
  onNavigate: (storyId: string) => void;
}

const SeriesNavBar = ({ parts, currentStoryId, onNavigate }: SeriesNavBarProps) => {
  if (parts.length <= 1) return null;

  const currentIndex = parts.findIndex(p => p.id === currentStoryId);

  return (
    <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 px-3 py-1.5">
      <div className="max-w-2xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-hide" dir="rtl">
        <BookOpen className="w-4 h-4 text-purple-300 flex-shrink-0" />
        <span className="text-xs text-purple-300 flex-shrink-0 font-medium">
          סדרה ({parts.length} חלקים)
        </span>
        <div className="flex items-center gap-1.5">
          {parts.map((part, idx) => {
            const isCurrent = part.id === currentStoryId;
            return (
              <button
                key={part.id}
                onClick={() => !isCurrent && onNavigate(part.slug || part.id)}
                disabled={isCurrent}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap",
                  isCurrent
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105"
                    : "bg-white/15 text-purple-200 hover:bg-white/25 hover:text-white active:scale-95"
                )}
              >
                חלק {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Next part shortcut */}
        {currentIndex >= 0 && currentIndex < parts.length - 1 && (
          <button
            onClick={() => {
              const next = parts[currentIndex + 1];
              onNavigate(next.slug || next.id);
            }}
            className="mr-auto flex items-center gap-1 text-xs text-purple-300 hover:text-white transition-colors flex-shrink-0"
          >
            <span>לחלק הבא</span>
            <ChevronLeft className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SeriesNavBar;
