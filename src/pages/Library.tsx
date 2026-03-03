import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Coins, Wand2, BookOpen, Sparkles } from "lucide-react";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";
import solMagicBookCover from "@/assets/sol-magic-book-cover.png";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MobileNavigation from "@/components/MobileNavigation";
import StoryListItem from "@/components/ui/story-list-item";

import OfflineIndicator from "@/components/ui/offline-indicator";
import EditStoryDialog from "@/components/story/edit-story-dialog";
import { GenderSwapDialog } from "@/components/story/GenderSwapDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";

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
  story_pages: StoryPage[];
}

interface PremiumStory {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  theme: string | null;
  min_age: number | null;
  max_age: number | null;
  display_order: number | null;
}

import { translateTopic } from '@/lib/topic-translations';

const Library = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline } = useOfflineStorage();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { avatarUrl } = useChildAvatar();
  const [stories, setStories] = useState<Story[]>([]);
  const [premiumStories, setPremiumStories] = useState<PremiumStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremiumLoading, setIsPremiumLoading] = useState(true);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [genderSwapStory, setGenderSwapStory] = useState<Story | null>(null);
  
  const totalCredits = (credits ?? 0) + shareCoins;

  useEffect(() => {
    fetchStories();
    fetchPremiumStories();
  }, []);

  const fetchPremiumStories = async () => {
    try {
      const { data, error } = await supabase
        .from("premium_stories")
        .select("id, title, description, cover_url, theme, min_age, max_age, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.log('📚 Premium stories fetch info:', error.message);
        setPremiumStories([]);
        return;
      }
      setPremiumStories(data || []);
    } catch (error) {
      console.error("Error fetching premium stories:", error);
      setPremiumStories([]);
    } finally {
      setIsPremiumLoading(false);
    }
  };

  // Library is accessible to all users - shows empty state for unauthenticated users
  const fetchStories = async () => {
    try {
      const { data: storiesData, error: storiesError } = await supabase
        .from("stories")
        .select("id, slug, child_name, topic, created_at, cover_url, theme, story_type, min_age, max_age, is_premium, child_gender")
        .order("created_at", { ascending: false });

      if (storiesError) {
        console.log('📚 Stories fetch info:', storiesError.message);
        setStories([]);
        setIsLoading(false);
        return;
      }

      if (!storiesData || storiesData.length === 0) {
        setStories([]);
        setIsLoading(false);
        return;
      }

      const storyIds = storiesData.map(s => s.id);
      const { data: pagesData, error: pagesError } = await supabase
        .from("story_pages")
        .select("story_id, illustration_url, page_number")
        .in("story_id", storyIds)
        .eq("page_number", 1);

      if (pagesError) {
        console.error("Error fetching story pages:", pagesError);
      }

      const coverMap = new Map<string, string | null>();
      pagesData?.forEach(page => {
        if (page.illustration_url) {
          coverMap.set(page.story_id, page.illustration_url);
        }
      });

      const storiesWithCovers: Story[] = storiesData.map(story => ({
        ...story,
        story_pages: coverMap.has(story.id) 
          ? [{ illustration_url: coverMap.get(story.id) || null, page_number: 1 }]
          : []
      }));

      setStories(storiesWithCovers);
    } catch (error) {
      console.error("Error fetching stories:", error);
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;

      setStories((prev) => prev.filter((s) => s.id !== storyId));
      toast({ title: "הסיפור נמחק בהצלחה" });
    } catch (error) {
      console.error("Error deleting story:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא הצלחנו למחוק את הסיפור",
      });
    }
  };

  const [regeneratingCoverId, setRegeneratingCoverId] = useState<string | null>(null);

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
    } catch (error) {
      console.error("Regenerate cover error:", error);
      toast({ variant: "destructive", title: "שגיאה ביצירת כריכה", description: "נסו שוב מאוחר יותר" });
    } finally {
      setRegeneratingCoverId(null);
    }
  };

  const handleGenderSwap = (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      setGenderSwapStory(story);
    }
  };

  const handleGenderSwapSuccess = () => {
    fetchStories();
    toast({
      title: "✨ הסיפור עודכן!",
      description: "המגדר הוחלף בהצלחה בכל הטקסט",
    });
  };

  const handleEditStory = (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      setEditingStory(story);
    }
  };

  const getCoverImage = (story: Story): string | null => {
    if (story.story_pages && story.story_pages.length > 0) {
      const firstPage = story.story_pages.find(p => p.page_number === 1);
      const illustrationUrl = firstPage?.illustration_url || story.story_pages[0]?.illustration_url;
      if (illustrationUrl) return getPublicIllustrationUrl(illustrationUrl);
    }
    return solMagicBookCover;
  };

  const LoadingSkeleton = () => (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i} 
          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted animate-pulse"
          aria-hidden="true"
        >
          <div className="w-14 h-14 rounded-lg bg-muted-foreground/20 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/4 bg-muted-foreground/20 rounded" />
            <div className="h-3 w-1/2 bg-muted-foreground/20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-screen h-[100dvh] bg-background pb-20 overflow-y-auto overscroll-contain">
      <OfflineIndicator isOnline={isOnline} />
      
      <div className="container max-w-lg mx-auto px-3 py-3">
        {/* Header with Avatar + Credits */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200 p-4 -mx-3 -mt-3 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigate("/")} className="hidden md:flex" aria-label="חזרה לדף הבית">
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              {avatarUrl && (
                <div className="w-12 h-12 rounded-full overflow-hidden border-3 border-purple-400 shadow-lg">
                  <img 
                    src={avatarUrl} 
                    alt="דמות הילד" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <button 
                onClick={() => navigate("/upgrade")}
                className="flex items-center gap-2 bg-white/70 border-2 border-purple-300 rounded-full px-4 py-2 hover:bg-purple-50 transition-colors shadow-md"
                aria-label="צפה בקרדיטים ושדרג"
              >
                <Coins className="w-6 h-6 text-purple-600" aria-hidden="true" />
                <span className="font-bold text-purple-700 text-lg">{totalCredits}</span>
              </button>
            </div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">הספרייה הקסומה שלי</span>
              <Wand2 className="w-5 h-5 text-purple-500 animate-wiggle" />
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my" dir="rtl" className="w-full">
          <TabsList className="w-full h-12 bg-purple-100/60 rounded-xl p-1 mb-4">
            <TabsTrigger 
              value="my" 
              className="flex-1 rounded-lg text-sm font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md text-purple-500"
            >
              <BookOpen className="w-4 h-4" />
              הסיפורים שלי
            </TabsTrigger>
            <TabsTrigger 
              value="sol" 
              className="flex-1 rounded-lg text-sm font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-md text-pink-400"
            >
              <Sparkles className="w-4 h-4" />
              סיפורי סול
            </TabsTrigger>
          </TabsList>

          {/* My Stories Tab */}
          <TabsContent value="my">
            {isLoading ? (
              <LoadingSkeleton />
            ) : stories.length === 0 ? (
              <EmptyState onCreateClick={() => navigate("/create")} />
            ) : (
              <div className="flex flex-col gap-2">
                {stories.map((story) => (
                  <StoryListItem
                    key={story.id}
                    id={story.id}
                    storyId={story.id}
                    childName={story.child_name}
                    topic={translateTopic(story.topic)}
                    coverUrl={getCoverImage(story)}
                    createdAt={story.created_at}
                    childGender={story.child_gender as 'male' | 'female' | undefined}
                    onDelete={handleDeleteStory}
                    onEdit={handleEditStory}
                    onClick={(id) => {
                      const s = stories.find(st => st.id === id);
                      const slug = s?.slug || id;
                      navigate(`/story/${slug}`);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sol Stories Tab */}
          <TabsContent value="sol">
            {isPremiumLoading ? (
              <LoadingSkeleton />
            ) : premiumStories.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <Sparkles className="w-12 h-12 text-pink-300 mx-auto" />
                <p className="text-muted-foreground font-medium">סיפורי סול יגיעו בקרוב! ✨</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {premiumStories.map((ps) => (
                  <div
                    key={ps.id}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 cursor-pointer hover:shadow-md hover:border-pink-200 transition-all duration-200 active:scale-[0.99]"
                    onClick={() => navigate(`/story/premium/${ps.id}`)}
                    role="article"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/story/premium/${ps.id}`)}
                    aria-label={ps.title}
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200">
                      {ps.cover_url ? (
                        <img src={ps.cover_url} alt={ps.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-pink-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{ps.title}</h3>
                      {ps.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{ps.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Button */}
        {stories.length > 0 && (
          <div className="fixed left-3 bottom-20 z-40">
            <Button
              onClick={() => navigate("/create")}
              size="lg"
              className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 comic-shadow min-h-[48px] min-w-[48px]"
              aria-label="צור סיפור חדש"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
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

      <MobileNavigation />
    </div>
  );
};

import libraryEmptyState from "@/assets/library-empty-state.png";

const EmptyState = ({ onCreateClick }: { onCreateClick: () => void }) => (
  <div className="text-center py-6 space-y-5">
    <div className="relative mx-auto w-48 h-48">
      <div className="relative">
        <img 
          src={libraryEmptyState} 
          alt="ילד קורא בטאבלט" 
          className="w-48 h-48 rounded-2xl object-cover border-2 border-purple-300"
        />
      </div>
      <div 
        className="absolute top-full left-0 right-0 h-16 overflow-hidden opacity-30 pointer-events-none"
        style={{
          transform: 'scaleY(-1)',
          maskImage: 'linear-gradient(to top, transparent 0%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 100%)',
        }}
      >
        <img 
          src={libraryEmptyState} 
          alt="" 
          className="w-48 h-48 rounded-2xl object-cover mx-auto"
          aria-hidden="true"
        />
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
