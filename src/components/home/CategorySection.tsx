import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronUp } from "lucide-react";
import type { CharacterSection } from "@/components/wizard/topic-data";

interface CategorySectionProps {
  section: CharacterSection;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const CategorySection = ({ section, colorClass, bgClass, borderClass }: CategorySectionProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="space-y-3" dir="rtl">
      {/* Banner */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className={`relative w-full rounded-2xl overflow-hidden ${borderClass} border-2 group`}
        aria-label={section.categoryLabel}
      >
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={section.heroImage}
            alt={section.categoryLabel}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
          <div className="absolute inset-0 flex flex-col justify-end items-center pb-3 gap-0.5">
            <h3 className="text-white text-xl font-black drop-shadow-md text-center">
              {section.categoryEmoji} {section.categoryLabel}
            </h3>
            <span className="text-white text-xs font-bold drop-shadow-md">
              {section.topics.length} נושאים
            </span>
          </div>
        </div>
      </button>

      {/* Expanded topics grid */}
      {expanded && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {section.topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => navigate("/create", { state: { preselectedTopic: topic.id } })}
                className="rounded-xl overflow-hidden shadow-sm border border-border bg-card hover:shadow-md hover:scale-[1.02] transition-all text-right"
              >
                <div className="aspect-square w-full bg-muted/20 flex items-center justify-center overflow-hidden">
                  <img src={topic.image} alt={topic.label} className="w-full h-full object-contain" loading="lazy" />
                </div>
                <div className="p-2.5">
                  <h3 className="text-sm font-bold text-foreground leading-tight">{topic.label}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{topic.description}</p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setExpanded(false)}
            className={`flex items-center justify-center gap-1 w-full py-2 text-xs font-bold ${colorClass} hover:opacity-80 transition-opacity`}
          >
            <ChevronUp className="w-4 h-4" />
            הצג פחות
          </button>
        </div>
      )}

      {/* Collapsed: "See All" button */}
      {!expanded && (
        <div className="flex items-center justify-between px-1">
          <span className={`text-sm font-bold ${colorClass}`}>
            {section.categoryEmoji} {section.categoryLabel}
          </span>
          <button
            onClick={() => setExpanded(true)}
            className={`flex items-center gap-1 text-xs font-medium ${colorClass} hover:opacity-80 transition-opacity`}
          >
            הצג הכל
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};

export default CategorySection;
