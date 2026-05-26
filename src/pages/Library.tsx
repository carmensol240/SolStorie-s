import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Coins, Wand2, BookOpen, WifiOff, Plane, Palette, Download, Paintbrush } from "lucide-react";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";
import solMagicBookCover from "@/assets/sol-magic-book-cover.png";
import libraryGirlReading from "@/assets/library-girl-reading.png";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MobileNavigation from "@/components/MobileNavigation";
import PolaroidCard from "@/components/ui/polaroid-card";
import CorkBoard from "@/components/ui/cork-board";
import '@fontsource/caveat/index.css';

import OfflineIndicator from "@/components/ui/offline-indicator";
import EditStoryDialog from "@/components/story/edit-story-dialog";
import { GenderSwapDialog } from "@/components/story/GenderSwapDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useFullOfflineStorage, OfflineStory } from "@/hooks/use-full-offline-storage";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { useAuth } from "@/hooks/use-auth";
import { getUserData } from "@/lib/user-storage";
import { translateTopic } from '@/lib/topic-translations';
import libraryEmptyState from "@/assets/library-empty-state.png";
import { OnlineColoringCanvas } from "@/components/story/OnlineColoringCanvas";

interface StoryPage {
  illustration_url: string | null;
  page_number: number;
}

interface Story {
  id: string;
  slug: string | null;
  child_name: string;
  topic: string;
  created_at: string;
  cover_url: string | null;
  theme: string | null;
  story_type: string | null;
  min_age: number | null;
  max_age: number | null;
  is_premium: boolean | null;
  child_gender: string | null;
  child_id: string | null;
  language?: string;
  story_pages: StoryPage[];
}

interface ChildRecord {
  id: string;
  name: string;
}

interface ColoringPageRecord {
  id: string;
  story_id: string;
  illustration_url: string;
  coloring_image_path: string;
  created_at: string;
  story_child_name?: string;
  story_topic?: string;
  story_slug?: string;
}

const Library = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline } = useOfflineStorage();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { user, loading: authLoading } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [genderSwapStory, setGenderSwapStory] = useState<Story | null>(null);
  const [regeneratingCoverId, setRegeneratingCoverId] = useState<string | null>(null);
  const [showOfflineFilter, setShowOfflineFilter] = useState(false);
  const [offlineStories, setOfflineStories] = useState<OfflineStory[]>([]);
  const [coloringPages, setColoringPages] = useState<ColoringPageRecord[]>([]);
  const [libraryTab, setLibraryTab] = useState<string>("stories");
  const [coloringCanvasImage, setColoringCanvasImage] = useState<string | null>(null);
  const [coloringCanvasTitle, setColoringCanvasTitle] = useState<string>('');
  const [coloringCanvasIndex, setColoringCanvasIndex] = useState<number>(-1);
  const [hasAnyPurchase, setHasAnyPurchase] = useState(false);
  const [unlockedStoryIds, setUnlockedStoryIds] = useState<Set<string>>(new Set());

  // Selected child for header avatar — falls back to first child
  const selectedChildId = user ? getUserData(user.id, 'selected_child_id') : null;
  const selectedChildName = selectedChildId
    ? children.find(c => c.id === selectedChildId)?.name
    : undefined;
  const { avatarUrl } = useChildAvatar(selectedChildName);

  const fullOffline = useFullOfflineStorage();

  const totalCredits = (credits ?? 0) + shareCoins;

  // Load offline stories when offline
  useEffect(() => {
    if (!isOnline) {
      fullOffline.getAllOfflineStories().then(setOfflineStories);
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) {
      fetchStories();
      fetchChildren();
      fetchColoringPages();
      fetchPurchaseStatus();
    } else {
      setIsLoading(false);
    }
  }, [user, isOnline]);

  const fetchPurchaseStatus = async () => {
    if (!user) { setHasAnyPurchase(false); setUnlockedStoryIds(new Set()); return; }
    try {
      const [purchasesRes, unlocksRes] = await Promise.all([
        supabase.from('purchases').select('id').eq('user_id', user.id).limit(1),
        supabase.from('story_unlocks').select('story_id').eq('user_id', user.id),
      ]);
      const hasPkg = (purchasesRes.data?.length ?? 0) > 0;
      setHasAnyPurchase(hasPkg);
      setUnlockedStoryIds(new Set((unlocksRes.data || []).map((u: any) => u.story_id)));
    } catch {
      setHasAnyPurchase(false);
      setUnlockedStoryIds(new Set());
    }
  };

  const handleLockedShare = (storyId: string) => {
    navigate(`/upgrade?firstStory=${storyId}&from=library_share`);
  };

  const fetchChildren = async () => {
    if (!user) { setChildren([]); return; }
    try {
      const { data } = await supabase
        .from("children")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setChildren(data || []);
    } catch { setChildren([]); }
  };

  const fetchColoringPages = async () => {
    if (!user) { setColoringPages([]); return; }
    try {
      const { data } = await supabase
        .from("story_coloring_pages")
        .select("id, story_id, illustration_url, coloring_image_path, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) { setColoringPages([]); return; }

      // Fetch story info for labels
      const storyIds = [...new Set(data.map(cp => cp.story_id))];
      const { data: storiesData } = await supabase
        .from("stories")
        .select("id, child_name, topic, slug")
        .in("id", storyIds);

      const storyMap = new Map(storiesData?.map(s => [s.id, s]) || []);

      setColoringPages(data.map(cp => {
        const story = storyMap.get(cp.story_id);
        return {
          ...cp,
          story_child_name: story?.child_name,
          story_topic: story?.topic,
          story_slug: story?.slug,
        };
      }));
    } catch { setColoringPages([]); }
  };

  const fetchStories = async () => {
    if (!user) { setStories([]); return; }
    try {
      const { data: storiesData, error: storiesError } = await supabase
        .from("stories")
        .select("id, slug, child_name, topic, created_at, cover_url, theme, story_type, min_age, max_age, is_premium, child_gender, child_id, language")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (storiesError || !storiesData || storiesData.length === 0) {
        setStories([]);
        setIsLoading(false);
        return;
      }

      const storyIds = storiesData.map(s => s.id);
      const { data: pagesData } = await supabase
        .from("story_pages")
        .select("story_id, illustration_url, page_number")
        .in("story_id", storyIds)
        .eq("page_number", 1);

      const coverMap = new Map<string, string | null>();
      pagesData?.forEach(page => {
        if (page.illustration_url) coverMap.set(page.story_id, page.illustration_url);
      });

      setStories(storiesData.map(story => ({
        ...story,
        story_pages: coverMap.has(story.id)
          ? [{ illustration_url: coverMap.get(story.id) || null, page_number: 1 }]
          : []
      })));
    } catch {
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const childTabs = useMemo(() => {
    if (children.length < 2) return null;
    const childNameSet = new Set(children.map(c => c.name));
    const unmatchedStories = stories.filter(s => !s.child_id && !childNameSet.has(s.child_name));
    const tabs = children.map(child => ({
      key: child.id,
      label: child.name,
      stories: stories.filter(s => s.child_id === child.id || (!s.child_id && s.child_name === child.name)),
    }));
    if (unmatchedStories.length > 0) {
      tabs.push({ key: "__other", label: "אחר", stories: unmatchedStories });
    }
    return tabs;
  }, [children, stories]);

  const handleDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase.from("stories").delete().eq("id", storyId);
      if (error) throw error;
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      // Also delete offline version if exists
      if (fullOffline.isSaved(storyId)) {
        await fullOffline.deleteOfflineStory(storyId);
      }
      toast({ title: "הסיפור נמחק בהצלחה" });
    } catch {
      toast({ variant: "destructive", title: "שגיאה", description: "לא הצלחנו למחוק את הסיפור" });
    }
  };

  const handleRegenerateCover = async (storyId: string) => {
    if (regeneratingCoverId) return;
    setRegeneratingCoverId(storyId);
    try {
      const story = stories.find(s => s.id === storyId);
      const { data, error } = await supabase.functions.invoke('generate-cover', {
        body: { storyId, title: story?.topic || '', topic: story?.topic || '' },
      });
      if (error) throw error;
      if (data?.coverUrl) {
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, cover_url: data.coverUrl } : s));
        toast({ title: "הכריכה נוצרה בהצלחה! 🎨" });
      }
    } catch {
      toast({ variant: "destructive", title: "שגיאה ביצירת כריכה", description: "נסו שוב מאוחר יותר" });
    } finally {
      setRegeneratingCoverId(null);
    }
  };

  const handleDownloadOffline = async (storyId: string) => {
    try {
      const story = stories.find(s => s.id === storyId);
      if (!story) return;

      // Fetch all pages for this story
      const { data: pagesData } = await supabase
        .from("story_pages")
        .select("id, page_number, text, illustration_url, illustration_prompt")
        .eq("story_id", storyId)
        .order("page_number");

      if (!pagesData) throw new Error("No pages found");

      const coverImage = getCoverImage(story);

      await fullOffline.downloadStory(
        storyId,
        {
          id: story.id,
          slug: story.slug,
          child_name: story.child_name,
          topic: story.topic,
          cover_url: story.cover_url,
          created_at: story.created_at,
          child_gender: story.child_gender,
          age_range: story.min_age != null && story.max_age != null ? `${story.min_age}-${story.max_age}` : null,
        },
        pagesData,
        coverImage,
      );
      toast({ title: "📥 הסיפור נשמר לקריאה אופליין!" });
    } catch {
      toast({ variant: "destructive", title: "שגיאה", description: "לא הצלחנו להוריד את הסיפור" });
    }
  };

  const handleDeleteOffline = async (storyId: string) => {
    await fullOffline.deleteOfflineStory(storyId);
    toast({ title: "הגרסה האופליין נמחקה" });
  };

  const handleGenderSwap = (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (story) setGenderSwapStory(story);
  };

  const handleGenderSwapSuccess = () => {
    fetchStories();
    toast({ title: "✨ הסיפור עודכן!", description: "המגדר הוחלף בהצלחה בכל הטקסט" });
  };

  const handleEditStory = (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (story) setEditingStory(story);
  };

  const getCoverImage = (story: Story): string | null => {
    // 1. Use dedicated cover_url if available
    if (story.cover_url) {
      return story.cover_url.startsWith('http') ? story.cover_url : getPublicIllustrationUrl(story.cover_url);
    }
    // 2. Fall back to first page illustration
    if (story.story_pages && story.story_pages.length > 0) {
      const firstPage = story.story_pages.find(p => p.page_number === 1);
      const illustrationUrl = firstPage?.illustration_url || story.story_pages[0]?.illustration_url;
      if (illustrationUrl) return getPublicIllustrationUrl(illustrationUrl);
    }
    // 3. Generic fallback
    return solMagicBookCover;
  };

  const navigateToStory = (id: string) => {
    const s = stories.find(st => st.id === id);
    navigate(`/story/${s?.slug || id}`);
  };

  // Filtered stories for offline filter
  const displayStories = showOfflineFilter
    ? stories.filter(s => fullOffline.isSaved(s.id))
    : stories;

  // Detect learning category from topic
  const getLearningCategory = (topic: string): string | null => {
    if (topic.startsWith('אות ') || topic.startsWith('letter-')) return '__learning_letters__';
    if (topic.startsWith('מספר ') || topic.startsWith('number-')) return '__learning_numbers__';
    if (topic.startsWith('צבע ') || topic.startsWith('color-')) return '__learning_colors__';
    if (topic.startsWith('צורת ') || topic.startsWith('shape-')) return '__learning_shapes__';
    return null;
  };

  const LEARNING_CATEGORY_LABELS: Record<string, string> = {
    '__learning_letters__': '📚 אותיות',
    '__learning_numbers__': '🔢 מספרים',
    '__learning_colors__': '🎨 צבעים',
    '__learning_shapes__': '📐 צורות',
  };

  // Group stories into series by topic + group learning stories by category
  const groupStories = (storyList: Story[]) => {
    const groups = new Map<string, Story[]>();
    const order: string[] = [];
    storyList.forEach(story => {
      // Custom/free-text stories are never grouped into series
      const isCustom = story.story_type === 'custom';
      const learningCat = getLearningCategory(story.topic);

      let key: string;
      if (isCustom) {
        key = `__custom__${story.id}`;
      } else if (learningCat) {
        // Group all learning stories of the same category together
        key = `${story.child_name}::${learningCat}`;
      } else {
        key = `${story.child_name}::${story.topic}`;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
        order.push(key);
      }
      groups.get(key)!.push(story);
    });
    // Sort each group internally by created_at ascending (oldest first)
    groups.forEach(group => group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    return { groups, order };
  };

  const renderStoryList = (storyList: Story[], tabTitle?: string) => {
    const { groups, order } = groupStories(storyList);
    let cardIndex = 0;
    return (
      <CorkBoard title={tabTitle || 'הסיפורים שלי'}>
        {order.map((key) => {
          const group = groups.get(key)!;
          const isLearningFolder = key.includes('__learning_');
          const learningCatKey = isLearningFolder ? key.split('::')[1] : null;

          if (group.length === 1) {
            const story = group[0];
            const idx = cardIndex++;
            return (
              <PolaroidCard
                key={story.id}
                id={story.id}
                storyId={story.id}
                childName={story.child_name}
                topic={translateTopic(story.topic)}
                coverUrl={getCoverImage(story)}
                language={story.language}
                onDelete={handleDeleteStory}
                onEdit={handleEditStory}
                onClick={navigateToStory}
                index={idx}
                isOfflineSaved={fullOffline.isSaved(story.id)}
                isDownloading={fullOffline.downloadingId === story.id}
                offlineSize={fullOffline.getSize(story.id)}
                onDownloadOffline={handleDownloadOffline}
                onDeleteOffline={handleDeleteOffline}
                canShare={hasAnyPurchase || unlockedStoryIds.has(story.id)}
                onLockedShare={handleLockedShare}
              />
            );
          }

          // Series or learning folder
          const mainStory = group[0];
          const idx = cardIndex++;
          const folderLabel = isLearningFolder && learningCatKey
            ? LEARNING_CATEGORY_LABELS[learningCatKey] || translateTopic(mainStory.topic)
            : translateTopic(mainStory.topic);
          const seriesParts = group.map(s => ({
            id: s.id,
            slug: s.slug,
            topic: translateTopic(s.topic),
            created_at: s.created_at,
          }));
          return (
            <PolaroidCard
              key={mainStory.id}
              id={mainStory.id}
              storyId={mainStory.id}
              childName={mainStory.child_name}
              topic={folderLabel}
              coverUrl={getCoverImage(mainStory)}
              language={mainStory.language}
              onDelete={handleDeleteStory}
              onEdit={handleEditStory}
              onClick={navigateToStory}
              index={idx}
              seriesCount={group.length}
              seriesParts={seriesParts}
              isOfflineSaved={fullOffline.isSaved(mainStory.id)}
              isDownloading={fullOffline.downloadingId === mainStory.id}
              offlineSize={fullOffline.getSize(mainStory.id)}
              onDownloadOffline={handleDownloadOffline}
              onDeleteOffline={handleDeleteOffline}
              canShare={hasAnyPurchase || unlockedStoryIds.has(mainStory.id)}
              onLockedShare={handleLockedShare}
            />
          );
        })}
      </CorkBoard>
    );
  };

  const handleDownloadColoringPage = useCallback(async (coloringImagePath: string, storyTopic?: string) => {
    try {
      const url = getPublicIllustrationUrl(coloringImagePath);
      if (!url) throw new Error('No URL');
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `coloring-${storyTopic || 'page'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast({ title: "📥 דף הצביעה הורד בהצלחה!" });
    } catch {
      toast({ variant: "destructive", title: "שגיאה בהורדה" });
    }
  }, [toast]);

  const renderColoringPages = () => {
    if (coloringPages.length === 0) {
      return (
        <div className="text-center py-16 space-y-4">
          <Palette className="w-16 h-16 mx-auto text-muted-foreground/30" />
          <h2 className="text-lg font-bold text-muted-foreground">אין עדיין דפי צביעה</h2>
          <p className="text-sm text-muted-foreground/70">
            פתחו סיפור ולחצו על 🎨 כדי ליצור דף צביעה
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {coloringPages.map(cp => {
          const imgUrl = getPublicIllustrationUrl(cp.coloring_image_path);
          const topicLabel = cp.story_topic ? translateTopic(cp.story_topic) : '';
          return (
            <div key={cp.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="aspect-square bg-white relative">
                <img
                  src={imgUrl || ''}
                  alt={`דף צביעה - ${topicLabel}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="p-2 space-y-1.5">
                {cp.story_child_name && (
                  <p className="text-xs font-bold text-foreground truncate">{cp.story_child_name}</p>
                )}
                {topicLabel && (
                  <p className="text-xs text-muted-foreground truncate">{topicLabel}</p>
                )}
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7 gap-1"
                    onClick={() => {
                      const url = getPublicIllustrationUrl(cp.coloring_image_path);
                      if (url) {
                        const idx = coloringPages.findIndex(c => c.id === cp.id);
                        setColoringCanvasImage(url);
                        setColoringCanvasTitle(cp.story_topic ? translateTopic(cp.story_topic) : '');
                        setColoringCanvasIndex(idx);
                      }
                    }}
                  >
                    <Paintbrush className="w-3 h-3" />
                    צביעה
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7 gap-1"
                    onClick={() => handleDownloadColoringPage(cp.coloring_image_path, cp.story_topic)}
                  >
                    <Download className="w-3 h-3" />
                    הורדה
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const LoadingSkeleton = React.forwardRef<HTMLDivElement>((_, ref) => (
    <div ref={ref} className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="aspect-[2/3] rounded-r-xl rounded-l-sm bg-muted animate-pulse" aria-hidden="true">
          <div className="absolute left-0 top-0 w-[6px] h-full bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  ));
  LoadingSkeleton.displayName = "LoadingSkeleton";

  // ---- GUEST MODE (not logged in) ----
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1a0f3a 0%, #2d1a6e 50%, #1a0f3a 100%)' }} dir="rtl">
        {/* Floating stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/60 animate-pulse"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-5 pt-4 sm:pt-6 pb-24">
          {/* Hero image */}
          <div className="w-44 h-44 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-4 border-purple-400/40 shadow-2xl mb-4 sm:mb-5" style={{ boxShadow: '0 0 50px rgba(108,92,231,0.5), 0 0 100px rgba(168,85,247,0.2)' }}>
            <img
              src={libraryGirlReading}
              alt="ילדה קוראת סיפור"
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* Headline */}
          <h1 className="text-xl sm:text-2xl font-black text-center mb-2">
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #e8d5ff, #f0c040, #e8d5ff)' }}>
              ✨ הספרייה הקסומה מחכה לכם!
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-purple-200 text-center font-medium leading-relaxed mb-4 sm:mb-6 max-w-xs">
            צרו סיפורים מותאמים אישית עם הילד שלכם כגיבור — ושמרו אותם בספרייה האישית שלכם לתמיד
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-xs mb-5 sm:mb-8">
            {[
              { emoji: "📚", text: "ספרייה משפחתית עם כל הסיפורים " },
              { emoji: "🎨", text: "איורים מקצועיים בסגנון סרטי ילדים המותאמים לילד שלך" },
              { emoji: "📥", text: "קראו גם ללא אינטרנט בכל מקום ובכל שעה" },
              { emoji: "🖨️", text: "הורידו PDF והדפיסו לספר אמיתי" },
              { emoji: "🎙️", text: "הקליטו את הסיפור לזכרון לכל החיים" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 sm:gap-3 rounded-2xl px-3 py-2 sm:px-4 sm:py-3" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                <span className="text-xl sm:text-2xl flex-shrink-0 leading-none">{feature.emoji}</span>
                <span className="text-[13px] sm:text-sm font-bold text-white/90 leading-snug">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate("/create")}
            className="w-full max-w-xs py-3.5 rounded-full font-black text-base text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #a855f7, #6366f1)',
              boxShadow: '0 8px 30px -8px rgba(168,85,247,0.5)',
            }}
          >
            צרו את הסיפור הראשון שלכם ✨
          </button>
        </div>

        <MobileNavigation />
      </div>
    );
  }

  // ---- OFFLINE MODE ----
  if (!isOnline) {
    return (
      <div className="h-screen h-[100dvh] bg-background pb-20 overflow-y-auto overscroll-contain" dir="rtl">
        <div className="container max-w-lg mx-auto px-3 py-3">
          {/* Offline header */}
          <div className="bg-gradient-to-r from-sky-100 to-blue-100 border-b-2 border-sky-300 p-5 -mx-3 -mt-3 mb-4 shadow-sm text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sky-700">
              <Plane className="w-6 h-6" />
              <h1 className="text-xl font-black">אתם אופליין ✈️</h1>
            </div>
            <p className="text-sm text-sky-600">הנה הסיפורים השמורים שלכם — תהנו!</p>
          </div>

          {offlineStories.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <WifiOff className="w-16 h-16 mx-auto text-muted-foreground/40" />
              <h2 className="text-lg font-bold text-muted-foreground">אין סיפורים שמורים</h2>
              <p className="text-sm text-muted-foreground/70">כשתהיו מחוברים לאינטרנט, הורידו סיפורים מהספרייה לקריאה אופליין 📥</p>
            </div>
          ) : (
            <CorkBoard title="סיפורים שמורים">
              {offlineStories.map((os, idx) => {
                const coverUrl = os.coverBlob ? URL.createObjectURL(os.coverBlob) : solMagicBookCover;
                return (
                  <PolaroidCard
                    key={os.id}
                    id={os.id}
                    storyId={os.id}
                    childName={os.meta.child_name}
                    topic={translateTopic(os.meta.topic)}
                    coverUrl={coverUrl}
                    onDelete={async () => {}}
                    onClick={() => navigate(`/story/${os.meta.slug || os.id}`)}
                    index={idx}
                    isOfflineSaved
                    offlineSize={os.sizeBytes}
                  />
                );
              })}
            </CorkBoard>
          )}
        </div>
        <MobileNavigation />
      </div>
    );
  }

  // ---- ONLINE MODE ----
  return (
    <div className="h-screen h-[100dvh] bg-background pb-20 overflow-y-auto overscroll-contain">
      <OfflineIndicator isOnline={isOnline} />

      <div className="container max-w-lg mx-auto px-3 py-3">
        {/* Header */}
        <div
          className="p-4 -mx-3 -mt-3 mb-4"
          style={{
            background: 'linear-gradient(135deg, #1a0f3a 0%, #2d1a6e 50%, #1a0f3a 100%)',
            borderBottom: '3px solid #6c5ce7',
            boxShadow: '0 4px 20px rgba(80,40,160,0.3)',
          }}
        >
          {/* Title - centered */}
          <h1 className="text-xl font-black text-center mb-3 flex items-center justify-center gap-2">
            <Wand2 className="w-5 h-5 text-yellow-400" />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #e8d5ff, #f0c040, #e8d5ff)' }}>הספרייה הקסומה שלי</span>
            <span className="text-yellow-400">✨</span>
          </h1>

          {/* Toolbar row */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hidden md:flex text-white/70 hover:text-white hover:bg-white/10" aria-label="חזרה לדף הבית">
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 mx-auto">
              {avatarUrl && (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400/60 shadow-lg">
                  <img src={avatarUrl} alt="דמות הילד" className="w-full h-full object-cover" />
                </div>
              )}
              {(credits ?? 0) > 0 && (
                <button
                  onClick={() => navigate("/upgrade")}
                  className="flex items-center gap-1.5 bg-white/10 border border-purple-400/40 rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors shadow-md"
                  aria-label="סיפורים זמינים ליצירה"
                >
                  <Wand2 className="w-4 h-4 text-yellow-400" aria-hidden="true" />
                  <span className="font-bold text-yellow-300 text-sm">{credits}</span>
                </button>
              )}
              <div className="flex items-center gap-1 bg-white/10 border border-purple-400/40 rounded-full px-3 py-1.5 shadow-md">
                <BookOpen className="w-4 h-4 text-purple-300" aria-hidden="true" />
                <span className="font-bold text-purple-200 text-sm">{stories.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top-level library tabs: Stories vs Coloring Pages */}
        {hasAnyPurchase && (credits ?? 0) > 0 && (
          <button
            onClick={() => navigate('/create')}
            className="w-full mb-3 rounded-2xl px-4 py-3 text-right shadow-lg border border-yellow-300/50 bg-gradient-to-l from-yellow-500/20 via-amber-500/15 to-purple-600/20 hover:from-yellow-500/30 hover:to-purple-600/30 transition-all"
            aria-label="צרו סיפור נוסף עם הקרדיט החינמי שלכם"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎁</div>
              <div className="flex-1">
                <div className="text-purple-800 font-black text-sm leading-tight">
                  יש לך {credits} קרדיט{(credits ?? 0) > 1 ? 'ים' : ''} לסיפור נוסף חינם!
                </div>
                <div className="text-purple-600/80 text-[11px] font-semibold mt-0.5">
                  ✨ ללא תוקף – הקרדיט שמור לכם לכל החיים
                </div>
              </div>
              <div className="text-purple-700 text-xs font-bold whitespace-nowrap">
                צרו עכשיו ←
              </div>
            </div>
          </button>
        )}
        <Tabs value={libraryTab} onValueChange={setLibraryTab} dir="rtl" className="w-full mb-4">
          <TabsList className="w-full bg-purple-100/60 rounded-xl p-1 gap-1">
            <TabsTrigger
              value="stories"
              className="flex-1 rounded-lg text-sm font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md text-purple-500 px-3 py-1.5"
            >
              📚 סיפורים
            </TabsTrigger>
            <TabsTrigger
              value="coloring"
              className="flex-1 rounded-lg text-sm font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md text-purple-500 px-3 py-1.5"
            >
              🎨 דפי צביעה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories">
            {/* Offline filter toggle */}
            {stories.length > 0 && fullOffline.savedStoryIds.size > 0 && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setShowOfflineFilter(!showOfflineFilter)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    showOfflineFilter
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-muted text-muted-foreground border-2 border-transparent hover:bg-muted/80'
                  }`}
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  סיפורים אופליין ({fullOffline.savedStoryIds.size})
                </button>
              </div>
            )}

            {/* Stories content */}
            {isLoading || authLoading ? (
              <LoadingSkeleton />
            ) : displayStories.length === 0 && showOfflineFilter ? (
              <div className="text-center py-10">
                <WifiOff className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">אין סיפורים שמורים אופליין</p>
                <Button onClick={() => setShowOfflineFilter(false)} variant="outline" className="mt-3">הצג את כל הסיפורים</Button>
              </div>
            ) : stories.length === 0 ? (
              <EmptyState onCreateClick={() => navigate("/create")} />
            ) : childTabs && !showOfflineFilter ? (
              <Tabs defaultValue="__all" dir="rtl" className="w-full">
                <TabsList className="w-full h-auto flex-wrap bg-purple-100/60 rounded-xl p-1 mb-4 gap-1">
                  <TabsTrigger
                    value="__all"
                    className="rounded-lg text-sm font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md text-purple-500 px-3 py-1.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    הכל
                  </TabsTrigger>
                  {childTabs.map(tab => (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="rounded-lg text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md text-purple-500 px-3 py-1.5"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="__all">
                  {renderStoryList(stories)}
                </TabsContent>
                {childTabs.map(tab => (
                  <TabsContent key={tab.key} value={tab.key}>
                    {tab.stories.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground font-medium">אין עדיין סיפורים עבור {tab.label}</p>
                        <Button onClick={() => navigate("/create")} variant="outline" className="mt-3">
                          <Plus className="w-4 h-4 ml-1" /> צרו סיפור חדש
                        </Button>
                      </div>
                    ) : renderStoryList(tab.stories)}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              renderStoryList(displayStories)
            )}
          </TabsContent>

          <TabsContent value="coloring">
            {isLoading || authLoading ? <LoadingSkeleton /> : renderColoringPages()}
          </TabsContent>
        </Tabs>

        {/* Create Button */}
        {stories.length > 0 && (
          <div className="fixed left-3 bottom-20 z-40">
            <Button
              onClick={() => navigate("/create")}
              size="lg"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white comic-shadow min-h-[40px] min-w-[40px]"
              aria-label="צור סיפור חדש"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingStory && (
        <EditStoryDialog
          open={!!editingStory}
          onOpenChange={(open) => !open && setEditingStory(null)}
          storyId={editingStory.id}
          childName={editingStory.child_name}
          topic={editingStory.topic}
          onUpdate={fetchStories}
        />
      )}

      {/* Gender Swap Dialog */}
      {genderSwapStory && (
        <GenderSwapDialog
          open={!!genderSwapStory}
          onOpenChange={(open) => !open && setGenderSwapStory(null)}
          storyId={genderSwapStory.id}
          currentGender={(genderSwapStory.child_gender as 'male' | 'female') || 'male'}
          onSuccess={handleGenderSwapSuccess}
        />
      )}

      {/* Online Coloring Canvas */}
      <OnlineColoringCanvas
        isOpen={!!coloringCanvasImage}
        onClose={() => { setColoringCanvasImage(null); setColoringCanvasIndex(-1); }}
        backgroundImage={coloringCanvasImage || ''}
        storyTitle={coloringCanvasTitle}
        onNavigatePrev={() => {
          if (coloringCanvasIndex > 0) {
            const prev = coloringPages[coloringCanvasIndex - 1];
            const url = getPublicIllustrationUrl(prev.coloring_image_path);
            if (url) {
              setColoringCanvasImage(url);
              setColoringCanvasTitle(prev.story_topic ? translateTopic(prev.story_topic) : '');
              setColoringCanvasIndex(coloringCanvasIndex - 1);
            }
          }
        }}
        onNavigateNext={() => {
          if (coloringCanvasIndex < coloringPages.length - 1) {
            const next = coloringPages[coloringCanvasIndex + 1];
            const url = getPublicIllustrationUrl(next.coloring_image_path);
            if (url) {
              setColoringCanvasImage(url);
              setColoringCanvasTitle(next.story_topic ? translateTopic(next.story_topic) : '');
              setColoringCanvasIndex(coloringCanvasIndex + 1);
            }
          }
        }}
        canGoPrev={coloringCanvasIndex > 0}
        canGoNext={coloringCanvasIndex < coloringPages.length - 1}
      />

      <MobileNavigation />
    </div>
  );
};

const EmptyState = ({ onCreateClick }: { onCreateClick: () => void }) => (
  <div className="text-center py-6 space-y-5">
    <div className="relative mx-auto w-48 h-48">
      <div className="relative">
        <img src={libraryEmptyState} alt="ילד קורא בטאבלט" className="w-48 h-48 rounded-2xl object-cover border-2 border-purple-300" />
      </div>
      <div
        className="absolute top-full left-0 right-0 h-16 overflow-hidden opacity-30 pointer-events-none"
        style={{
          transform: 'scaleY(-1)',
          maskImage: 'linear-gradient(to top, transparent 0%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 100%)',
        }}
      >
        <img src={libraryEmptyState} alt="" className="w-48 h-48 rounded-2xl object-cover mx-auto" aria-hidden="true" />
      </div>
    </div>
    <div className="space-y-2 pt-4">
      <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">הספרייה שלך מחכה לסיפור הראשון!</h2>
      <p className="text-purple-600/80">בואו נתחיל?</p>
    </div>
    <Button
      onClick={onCreateClick}
      size="lg"
      className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold px-8 py-6 rounded-2xl shadow-lg"
    >
      <Plus className="w-5 h-5 ml-2" />
      צרו סיפור חדש
    </Button>
  </div>
);

export default Library;
