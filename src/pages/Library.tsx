import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import MobileNavigation from "@/components/MobileNavigation";
import StoryListItem from "@/components/ui/story-list-item";
import StoryFilters, { FilterState } from "@/components/ui/story-filters";
import OfflineIndicator from "@/components/ui/offline-indicator";
import EditStoryDialog from "@/components/story/edit-story-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useCredits } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { useChildAvatar } from "@/hooks/use-child-avatar";
import girlReadingBed from "@/assets/girl-reading-bed.jpg";

interface StoryPage {
  illustration_url: string | null;
  page_number: number;
}

interface Story {
  id: string;
  child_name: string;
  topic: string;
  created_at: string;
  cover_url: string | null;
  theme: string | null;
  story_type: string | null;
  min_age: number | null;
  max_age: number | null;
  is_premium: boolean | null;
  story_pages: StoryPage[];
}

const Library = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline } = useOfflineStorage();
  const { credits } = useCredits();
  const { shareCoins } = useReferral();
  const { avatarUrl } = useChildAvatar();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    ageRange: null,
    theme: null,
    storyType: null,
  });
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  
  const totalCredits = (credits ?? 0) + shareCoins;

  useEffect(() => {
    fetchStories();
  }, []);

  // Library is accessible to all users - shows empty state for unauthenticated users
  const fetchStories = async () => {
    try {
      // First fetch stories - this will return empty if user is not logged in due to RLS
      const { data: storiesData, error: storiesError } = await supabase
        .from("stories")
        .select("id, child_name, topic, created_at, cover_url, theme, story_type, min_age, max_age, is_premium")
        .order("created_at", { ascending: false });

      // Gracefully handle RLS errors for non-authenticated users
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

      // Fetch first page illustrations for all stories
      const storyIds = storiesData.map(s => s.id);
      const { data: pagesData, error: pagesError } = await supabase
        .from("story_pages")
        .select("story_id, illustration_url, page_number")
        .in("story_id", storyIds)
        .eq("page_number", 1);

      if (pagesError) {
        console.error("Error fetching story pages:", pagesError);
      }

      // Create a map of story_id to illustration_url
      const coverMap = new Map<string, string | null>();
      pagesData?.forEach(page => {
        if (page.illustration_url) {
          coverMap.set(page.story_id, page.illustration_url);
        }
      });

      // Merge stories with their cover images
      const storiesWithCovers: Story[] = storiesData.map(story => ({
        ...story,
        story_pages: coverMap.has(story.id) 
          ? [{ illustration_url: coverMap.get(story.id) || null, page_number: 1 }]
          : []
      }));

      setStories(storiesWithCovers);
    } catch (error) {
      console.error("Error fetching stories:", error);
      // Don't show error toast for auth issues - just show empty state
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

  const handleEditStory = (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      setEditingStory(story);
    }
  };

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Age filter
      if (filters.ageRange) {
        const [minStr, maxStr] = filters.ageRange.split('-');
        const filterMin = parseInt(minStr, 10);
        const filterMax = parseInt(maxStr, 10);
        const storyMin = story.min_age ?? 0;
        const storyMax = story.max_age ?? 10;
        
        // Check if ranges overlap
        if (storyMax < filterMin || storyMin > filterMax) {
          return false;
        }
      }

      // Theme filter
      if (filters.theme && story.theme !== filters.theme) {
        return false;
      }

      // Story type filter
      if (filters.storyType && story.story_type !== filters.storyType) {
        return false;
      }

      return true;
    });
  }, [stories, filters]);

  const getCoverImage = (story: Story): string | null => {
    if (story.cover_url) {
      console.log(`📖 Story ${story.id} using cover_url:`, story.cover_url);
      return story.cover_url;
    }
    
    if (story.story_pages && story.story_pages.length > 0) {
      const firstPage = story.story_pages.find(p => p.page_number === 1);
      const illustrationUrl = firstPage?.illustration_url || story.story_pages[0]?.illustration_url;
      console.log(`📖 Story ${story.id} using illustration:`, illustrationUrl);
      return illustrationUrl || null;
    }
    
    console.log(`📖 Story ${story.id} has no cover image`);
    return null;
  };

  return (
    <div className="h-screen h-[100dvh] bg-background bg-halftone pb-20 overflow-y-auto overscroll-contain">
      <OfflineIndicator isOnline={isOnline} />
      
      <div className="container max-w-lg mx-auto px-3 py-3">
        {/* Header with Avatar + Credits */}
        <div className="bg-card border-b-2 border-foreground/10 p-3 -mx-3 -mt-3 mb-3">
          <div className="flex items-center justify-between">
            {/* Left: Avatar + Credits */}
            <div className="flex items-center gap-1.5">
              {avatarUrl && (
                <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                  <img 
                    src={avatarUrl} 
                    alt="דמות הילד" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <button 
                onClick={() => navigate("/upgrade")}
                className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-full px-2 py-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                aria-label="צפה בקרדיטים ושדרג"
              >
                <Coins className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                <span className="font-semibold text-amber-700 dark:text-amber-400 text-xs">{totalCredits}</span>
              </button>
            </div>
            {/* Right: Title */}
            <h1 className="text-lg font-bold">הספרייה הקסומה שלי</h1>
          </div>
        </div>

        {/* Filters */}
        {stories.length > 0 && (
          <StoryFilters onFilterChange={setFilters} className="mb-3" />
        )}

        {/* Content */}
        {isLoading ? (
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
        ) : stories.length === 0 ? (
          <EmptyState onCreateClick={() => navigate("/create")} />
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-muted-foreground text-sm">אין סיפורים התואמים לסינון</p>
            <Button variant="outline" size="sm" onClick={() => setFilters({ ageRange: null, theme: null, storyType: null })}>
              נקה סינון
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredStories.map((story) => (
              <StoryListItem
                key={story.id}
                id={story.id}
                childName={story.child_name}
                topic={story.topic}
                coverUrl={getCoverImage(story)}
                createdAt={story.created_at}
                onDelete={handleDeleteStory}
                onClick={(id) => navigate(`/story/${id}`)}
              />
            ))}
          </div>
        )}

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

      <MobileNavigation />
    </div>
  );
};

const EmptyState = ({ onCreateClick }: { onCreateClick: () => void }) => (
  <div className="text-center py-8 space-y-6">
    <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden shadow-lg border-4 border-primary/20">
      <img 
        src={girlReadingBed} 
        alt="ילדה קוראת סיפור" 
        className="w-full h-full object-cover"
      />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-bold">עדיין אין לכם סיפורים</h2>
      <p className="text-muted-foreground">צרו את הסיפור הראשון שלכם עכשיו!</p>
    </div>
    <Button
      onClick={onCreateClick}
      size="lg"
      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 rounded-2xl comic-shadow"
    >
      <Plus className="w-5 h-5 ml-2" />
      צרו סיפור חדש
    </Button>
  </div>
);

export default Library;
