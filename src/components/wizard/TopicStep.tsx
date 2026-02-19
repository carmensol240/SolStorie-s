import { useRef, useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronUp, Sparkles, Search, X, ChevronDown } from "lucide-react";
import { CHARACTER_SECTIONS, TopicItem } from "./topic-data";

interface TopicStepProps {
  formData: StoryFormData;
  updateFormData: (updates: Partial<StoryFormData>) => void;
}

const TopicStep = ({ formData, updateFormData }: TopicStepProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.trim().toLowerCase();
    const results: TopicItem[] = [];
    for (const section of CHARACTER_SECTIONS) {
      for (const topic of section.topics) {
        if (
          topic.label.toLowerCase().includes(q) ||
          topic.description.toLowerCase().includes(q) ||
          (topic.keywords && topic.keywords.some(k => k.toLowerCase().includes(q)))
        ) {
          results.push(topic);
        }
      }
    }
    return results;
  }, [searchQuery]);

  const handleCustomChange = (value: string) => {
    updateFormData({
      customTopic: value,
      personalityTraits: value,
      topic: value.trim() ? "custom" : "",
      adventureLogic: undefined,
    });
  };

  const handleTopicSelect = (topic: TopicItem) => {
    if (formData.topic === topic.id) {
      updateFormData({ topic: "", customTopic: "", adventureLogic: undefined });
    } else {
      updateFormData({ topic: topic.id, customTopic: topic.label, adventureLogic: undefined });
    }
  };

  const filteredSections = activeTab === "all"
    ? CHARACTER_SECTIONS
    : CHARACTER_SECTIONS.filter((s) => s.id === activeTab);

  const isSearching = searchResults !== null;

  return (
    <div className="space-y-4" dir="rtl">
      <h2 className="text-lg font-bold text-foreground text-center flex items-center justify-center gap-2">
        <span className="text-purple-500"><Sparkles className="w-5 h-5" /></span>
        על מה נכתוב היום?
        <span className="text-orange-400"><Sparkles className="w-5 h-5" /></span>
      </h2>

      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 p-[2.5px] rounded-2xl shadow-lg">
        <Textarea
          className="w-full min-h-[100px] text-base resize-none rounded-2xl border-0 bg-card focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={4}
          placeholder="למשל: סול הביישנית אוהבת חיות ויוצאת להרפתקה בממלכת הדמיון..."
          value={formData.customTopic}
          onChange={(e) => handleCustomChange(e.target.value)}
          dir="rtl"
        />
      </div>

      <div className="text-center text-xs text-muted-foreground font-medium">או בחרו נושא</div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pr-9 pl-9 text-sm"
          placeholder="חיפוש נושא... (למשל: מקלחת, שיניים, חושך)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          dir="rtl"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSearching ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            {searchResults.length > 0 ? `נמצאו ${searchResults.length} נושאים` : "לא נמצאו נושאים מתאימים 😕"}
          </p>
          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {searchResults.map((topic) => (
                <SimpleTile key={topic.id} topic={topic} isSelected={formData.topic === topic.id} onSelect={() => handleTopicSelect(topic)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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

          {/* Category sections */}
          {filteredSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const visibleTopics = isExpanded ? section.topics : section.topics.slice(0, 2);

            return (
              <div key={section.id} className="space-y-3">
                {/* Banner */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="relative w-full rounded-2xl overflow-hidden border-2 border-border group"
                >
                  <div className="relative h-32 w-full">
                    <img src={section.heroImage} alt={section.categoryLabel} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                    <div className="absolute inset-0 flex flex-col justify-end items-center pb-3 gap-0.5">
                      <h3 className="text-white text-xl font-black drop-shadow-md text-center">{section.categoryEmoji} {section.categoryLabel}</h3>
                      <span className="text-white text-xs font-bold drop-shadow-md">{section.topics.length} נושאים</span>
                    </div>
                  </div>
                </button>

                {/* Topics grid */}
                <div className="grid grid-cols-2 gap-3">
                  {visibleTopics.map((topic) => (
                    <SimpleTile key={topic.id} topic={topic} isSelected={formData.topic === topic.id} onSelect={() => handleTopicSelect(topic)} />
                  ))}
                </div>

                {/* Expand/Collapse */}
                {!isExpanded && section.topics.length > 2 && (
                  <button onClick={() => toggleSection(section.id)} className="flex items-center justify-center gap-1 w-full py-2 text-xs font-medium text-purple-600 hover:opacity-80 transition-opacity">
                    הצג הכל ({section.topics.length} נושאים)
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                {isExpanded && (
                  <button onClick={() => toggleSection(section.id)} className="flex items-center justify-center gap-1 w-full py-2 text-xs font-bold text-purple-600 hover:opacity-80 transition-opacity">
                    <ChevronUp className="w-4 h-4" />
                    הצג פחות
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

/* ─── Simple Tile ─── */
interface SimpleTileProps {
  topic: TopicItem;
  isSelected: boolean;
  onSelect: () => void;
}

const SimpleTile = ({ topic, isSelected, onSelect }: SimpleTileProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden shadow-sm border-2 bg-card hover:shadow-md transition-all text-right",
        isSelected ? "border-purple-500 shadow-lg scale-[1.03]" : "border-transparent"
      )}
    >
      {/* Clickable image area */}
      <button onClick={onSelect} className="w-full text-right">
        <div className="relative h-24 w-full">
          <img src={topic.image} alt={topic.label} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Age badge */}
          <div className="absolute bottom-1.5 left-1.5 bg-black/40 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
            {topic.ageRange}
          </div>
          {/* Selected check */}
          {isSelected && (
            <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
        <div className="px-2.5 pt-2.5 pb-1">
          <h3 className="text-sm font-bold text-foreground leading-tight">{topic.label}</h3>
        </div>
      </button>

      {/* Description with expand toggle */}
      <div className="px-2.5 pb-2">
        <p className={cn("text-[10px] text-muted-foreground", !expanded && "line-clamp-2")}>
          {topic.description}
        </p>
        {topic.description && topic.description.length > 80 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-0.5 mt-0.5 text-[10px] font-semibold text-purple-500 hover:text-purple-700 transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="w-3 h-3" />הסתר</>
            ) : (
              <><ChevronDown className="w-3 h-3" />קרא עוד</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TopicStep;
