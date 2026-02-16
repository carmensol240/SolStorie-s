import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";
import { Heart, ChevronLeft, ChevronRight, Sparkles, Info } from "lucide-react";
import { useTopicWishlist } from "@/hooks/use-topic-wishlist";
import { CHARACTER_SECTIONS, TopicItem } from "./topic-data";

interface TopicStepProps {
  formData: StoryFormData;
  updateFormData: (updates: Partial<StoryFormData>) => void;
}

const TopicStep = ({ formData, updateFormData }: TopicStepProps) => {
  const { likedTopics, toggleLike } = useTopicWishlist();
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeTab, setActiveTab] = useState("all");

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

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filteredSections = activeTab === "all"
    ? CHARACTER_SECTIONS
    : CHARACTER_SECTIONS.filter((s) => s.id === activeTab);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Title with sparkles */}
      <h2 className="text-lg font-bold text-foreground text-center flex items-center justify-center gap-2">
        <span className="text-purple-500"><Sparkles className="w-5 h-5" /></span>
        על מה נכתוב היום?
        <span className="text-orange-400"><Sparkles className="w-5 h-5" /></span>
      </h2>

      {/* Single unified text input */}
      <Textarea
        className="w-full min-h-[80px] text-sm resize-none"
        rows={3}
        placeholder="כתבו נושא חופשי, או בחרו מהרשימה למטה ✨&#10;אפשר גם לבחור נושא ולהוסיף עליו פרטים אישיים!"
        value={formData.customTopic}
        onChange={(e) => handleCustomChange(e.target.value)}
        dir="rtl"
      />

      {/* Divider */}
      <div className="text-center text-xs text-muted-foreground font-medium">
        או בחרו נושא
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all flex-shrink-0",
            activeTab === "all"
              ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-transparent shadow-md"
              : "border-border bg-card text-foreground hover:border-purple-300"
          )}
        >
          🌟 הכל
        </button>
        {CHARACTER_SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all flex-shrink-0",
              activeTab === section.id
                ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-transparent shadow-md"
                : "border-border bg-card text-foreground hover:border-purple-300"
            )}
          >
            {section.categoryEmoji} {section.categoryLabel}
          </button>
        ))}
      </div>

      {/* All character sections stacked */}
      {filteredSections.map((section, sectionIndex) => (
        <div
          key={section.id}
          ref={(el) => { sectionRefs.current[sectionIndex] = el; }}
          className="space-y-3"
        >
          {/* Hero Card */}
          <HeroCard section={section} />

          {/* Topic cards - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {section.topics.map((topic) => (
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

          {/* Progress bar for horizontal scroll */}
          <div className="h-1 bg-muted rounded-full overflow-hidden mx-4">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              style={{ width: "30%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Hero Card ─── */
const HeroCard = ({ section }: { section: (typeof CHARACTER_SECTIONS)[number] }) => (
  <div className="relative rounded-2xl overflow-hidden aspect-[16/10] shadow-lg">
    <img
      src={section.heroImage}
      alt={section.character}
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

    {/* Navigation arrows + View All */}
    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
      <button className="w-7 h-7 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
        <ChevronLeft className="w-4 h-4 text-foreground" />
      </button>
      <button className="w-7 h-7 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
        <ChevronRight className="w-4 h-4 text-foreground" />
      </button>
      <span className="text-white text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/30 mr-1">
        צפה בהכל
      </span>
    </div>

    {/* Category name and character info */}
    <div className="absolute bottom-3 right-3 text-right">
      <h2 className="text-white text-xl font-bold drop-shadow-lg">
        {section.categoryLabel}
      </h2>
      <p className="text-white/80 text-xs drop-shadow-md">
        {section.character} | {section.characterEn} {section.topics.length} נושאים
      </p>
    </div>
  </div>
);

/* ─── Topic Card (Flip) ─── */
interface TopicCardProps {
  topic: TopicItem;
  isSelected: boolean;
  isLiked: boolean;
  onSelect: () => void;
  onToggleLike: () => void;
}

const TopicCard = ({
  topic,
  isSelected,
  isLiked,
  onSelect,
  onToggleLike,
}: TopicCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  const handleSelectAndClose = () => {
    onSelect();
    setIsFlipped(false);
  };

  return (
    <div
      className={cn(
        "relative flex-shrink-0 w-[130px] aspect-[3/4]",
        "[perspective:600px]"
      )}
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* ─── Front ─── */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl overflow-hidden border-2 cursor-pointer [backface-visibility:hidden]",
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

          {/* Info icon */}
          <button
            onClick={handleFlip}
            className="absolute top-1.5 left-1.5 w-6 h-6 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 transition-colors hover:bg-black/50"
            aria-label="מידע נוסף"
          >
            <span><Info className="w-3.5 h-3.5 text-white/90" /></span>
          </button>

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
            <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center z-10">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        {/* ─── Back ─── */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl overflow-hidden border-2 [backface-visibility:hidden] [transform:rotateY(180deg)]",
            "bg-gradient-to-b from-purple-50 to-white dark:from-purple-950 dark:to-gray-900",
            "border-purple-300 shadow-lg",
            "flex flex-col p-3 direction-rtl"
          )}
          dir="rtl"
        >
          {/* Close / flip back */}
          <button
            onClick={handleFlip}
            className="absolute top-1.5 left-1.5 w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 text-xs font-bold"
            aria-label="חזרה"
          >
            ✕
          </button>

          {/* Title */}
          <h3 className="text-[11px] font-bold text-purple-700 dark:text-purple-300 mb-1.5 pr-0 pl-6 leading-tight">
            {topic.label}
          </h3>

          {/* Description */}
          <p className="text-[9px] leading-relaxed text-foreground/80 flex-1 overflow-y-auto">
            {topic.description}
          </p>

          {/* Select button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAndClose();
            }}
            className="mt-2 w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white text-[10px] font-bold shadow-md hover:shadow-lg transition-shadow"
          >
            בחירת נושא והמשך ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicStep;