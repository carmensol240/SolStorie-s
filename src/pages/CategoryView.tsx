import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CHARACTER_SECTIONS } from "@/components/wizard/topic-data";
import MobileNavigation from "@/components/MobileNavigation";

const COLOR_MAP: Record<string, { colorClass: string; bgClass: string }> = {
  heroes: { colorClass: "text-purple-600", bgClass: "bg-purple-50" },
  growing: { colorClass: "text-emerald-600", bgClass: "bg-emerald-50" },
  imagination: { colorClass: "text-blue-600", bgClass: "bg-blue-50" },
  adventure: { colorClass: "text-orange-600", bgClass: "bg-orange-50" },
  edu: { colorClass: "text-lime-700", bgClass: "bg-lime-50" },
};

const CategoryView = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const section = CHARACTER_SECTIONS.find((s) => s.id === categoryId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!section) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-muted-foreground">קטגוריה לא נמצאה</p>
      </div>
    );
  }

  const colors = COLOR_MAP[section.id] || COLOR_MAP.heroes;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-20" dir="rtl">
      {/* Hero banner */}
      <div className="relative h-48 w-full">
        <img
          src={section.heroImage}
          alt={section.character}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
          }}
        />
        <button
          onClick={() => navigate("/adventure")}
          className="absolute top-4 right-4 bg-black/30 backdrop-blur-md rounded-full p-2 text-white hover:bg-black/50 transition-colors"
          aria-label="חזרה"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-4 right-5">
          <h1 className="text-white text-2xl font-black drop-shadow-lg">
            {section.categoryEmoji} {section.categoryLabel}
          </h1>
        </div>
      </div>

      {/* Topics grid */}
      <div className="container max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {section.topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => navigate("/create", { state: { preselectedTopic: topic.id } })}
              className="rounded-xl overflow-hidden shadow-sm border border-border bg-card hover:shadow-md hover:scale-[1.02] transition-all text-right"
            >
              <div className="h-24 w-full">
                <img
                  src={topic.image}
                  alt={topic.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2.5">
                <h3 className="text-sm font-bold text-foreground leading-tight">{topic.label}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  {topic.description}
                </p>
                <span className={`text-[10px] font-medium ${colors.colorClass} mt-1 inline-block`}>
                  גילאי {topic.ageRange}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
};

export default CategoryView;
