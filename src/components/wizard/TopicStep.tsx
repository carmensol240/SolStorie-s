import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useTopicWishlist } from "@/hooks/use-topic-wishlist";
import { CHARACTER_SECTIONS, EDUCATOR_TOOLBOX_IMAGE, TopicItem } from "./topic-data";

interface TopicStepProps {
  formData: StoryFormData;
  updateFormData: (updates: Partial<StoryFormData>) => void;
}

const TopicStep = ({ formData, updateFormData }: TopicStepProps) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const { likedTopics, toggleLike } = useTopicWishlist();

  const activeSection = CHARACTER_SECTIONS[activeSectionIndex];
  const sectionTopics = activeSection.topics;

  const handleCustomChange = (value: string) => {
    updateFormData({
      customTopic: value,
      topic: value.trim() ? "custom" : "",
      adventureLogic: undefined,
    });
  };

  const handleTopicSelect = (topic: TopicItem) => {
    updateFormData({
      topic: topic.id,
      customTopic: topic.label,
      adventureLogic: undefined,
    });
  };

  const goToSection = (index: number) => {
    setActiveSectionIndex(index);
    setShowAll(false);
  };

  const prevSection = () => {
    setActiveSectionIndex((i) =>
      i === 0 ? CHARACTER_SECTIONS.length - 1 : i - 1
    );
    setShowAll(false);
  };

  const nextSection = () => {
    setActiveSectionIndex((i) =>
      i === CHARACTER_SECTIONS.length - 1 ? 0 : i + 1
    );
    setShowAll(false);
  };

  const isEduSection = activeSection.id === "edu";

  return (
    <div className="space-y-4" dir="rtl">
      {/* Free text input */}
      <Textarea
        className="w-full min-h-[80px] text-sm resize-none"
        rows={3}
        placeholder="הוספת פסקה אודותית נוספת..."
        value={formData.customTopic}
        onChange={(e) => handleCustomChange(e.target.value)}
        dir="rtl"
      />

      {/* Divider */}
      <div className="text-center text-xs text-muted-foreground font-medium">
        או בחרו נושא
      </div>

      {/* Category tabs - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CHARACTER_SECTIONS.map((section, i) => (
          <button
            key={section.id}
            onClick={() => goToSection(i)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all flex-shrink-0",
              activeSectionIndex === i
                ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-transparent shadow-md"
                : "border-border bg-card text-foreground hover:border-purple-300"
            )}
          >
            {section.categoryEmoji} {section.categoryLabel}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
          style={{
            width: `${((activeSectionIndex + 1) / CHARACTER_SECTIONS.length) * 100}%`,
          }}
        />
      </div>

      {/* Hero Card */}
      <div className="relative rounded-2xl overflow-hidden aspect-[16/10] shadow-lg">
        <img
          src={activeSection.heroImage}
          alt={activeSection.character}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Navigation arrows */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <button
            onClick={prevSection}
            className="w-7 h-7 bg-white/80 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={nextSection}
            className="w-7 h-7 bg-white/80 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* View All toggle */}
        <button
          onClick={() => setShowAll(!showAll)}
          className="absolute top-3 left-3 text-white text-[10px] bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
        >
          צפה בהכל
        </button>

        {/* Category name and character info */}
        <div className="absolute bottom-3 right-3 text-right">
          <h2 className="text-white text-xl font-bold drop-shadow-lg">
            {activeSection.categoryLabel}
          </h2>
          <p className="text-white/80 text-xs drop-shadow-md">
            {activeSection.character} | {activeSection.characterEn}{" "}
            {sectionTopics.length} נושאים
          </p>
        </div>
      </div>

      {/* Topic cards */}
      {showAll ? (
        <div className="grid grid-cols-3 gap-2">
          {sectionTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isSelected={formData.topic === topic.id}
              isLiked={likedTopics.has(topic.id)}
              onSelect={() => handleTopicSelect(topic)}
              onToggleLike={() => toggleLike(topic.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {sectionTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isSelected={formData.topic === topic.id}
              isLiked={likedTopics.has(topic.id)}
              onSelect={() => handleTopicSelect(topic)}
              onToggleLike={() => toggleLike(topic.id)}
              horizontal
            />
          ))}
        </div>
      )}

      {/* Educator Toolbox Banner - show when not in edu section */}
      {!isEduSection && (
        <button
          onClick={() =>
            goToSection(
              CHARACTER_SECTIONS.findIndex((s) => s.id === "edu")
            )
          }
          className="relative rounded-xl overflow-hidden w-full aspect-[21/9] shadow-md"
        >
          <img
            src={EDUCATOR_TOOLBOX_IMAGE}
            alt="ארגז הכלים החינוכי"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-center p-3">
            <span className="text-white text-sm font-bold drop-shadow-md">
              🎓 ארגז הכלים החינוכי – לאנשי חינוך וטיפול
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

/* ─── Topic Card ─── */
interface TopicCardProps {
  topic: TopicItem;
  isSelected: boolean;
  isLiked: boolean;
  onSelect: () => void;
  onToggleLike: () => void;
  horizontal?: boolean;
}

const TopicCard = ({
  topic,
  isSelected,
  isLiked,
  onSelect,
  onToggleLike,
  horizontal,
}: TopicCardProps) => (
  <div
    className={cn(
      "relative rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 group cursor-pointer",
      horizontal ? "w-[130px] aspect-[3/4]" : "aspect-[3/4]",
      isSelected
        ? "border-purple-500 shadow-lg scale-[1.03]"
        : "border-transparent hover:border-purple-300"
    )}
    onClick={onSelect}
  >
    <img
      src={topic.image}
      alt={topic.label}
      className="w-full h-full object-cover"
      loading="lazy"
    />

    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

    {/* Wishlist heart */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleLike();
      }}
      className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center"
    >
      <Heart
        className={cn(
          "w-5 h-5 drop-shadow-md transition-colors",
          isLiked
            ? "fill-pink-500 text-pink-500"
            : "fill-transparent text-white/80"
        )}
      />
    </button>

    {/* Age badge */}
    <div className="absolute bottom-7 left-1.5 bg-black/40 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
      {topic.ageRange}
    </div>

    {/* Topic name */}
    <span className="absolute bottom-1 right-1.5 left-1.5 text-white text-[10px] font-bold leading-tight text-center drop-shadow-md line-clamp-2">
      {topic.label}
    </span>

    {/* Selected checkmark */}
    {isSelected && (
      <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
        <span className="text-white text-xs">✓</span>
      </div>
    )}
  </div>
);

export default TopicStep;
