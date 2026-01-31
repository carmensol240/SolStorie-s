import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface StoryPage {
  illustration_url: string | null;
}

interface DailyStory {
  id: string;
  child_name: string;
  topic: string;
  cover_url: string | null;
  theme: string;
  story_pages: StoryPage[];
}

const StoryOfTheDay = () => {
  const navigate = useNavigate();
  const [story, setStory] = useState<DailyStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDailyStory = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // First try to get a story marked as daily for today
        let { data, error } = await supabase
          .from('stories')
          .select('id, child_name, topic, cover_url, theme, story_pages(illustration_url)')
          .eq('is_daily_story', true)
          .eq('daily_story_date', today)
          .eq('story_pages.page_number', 1)
          .maybeSingle();

        // If no daily story for today, get the most recent story
        if (!data) {
          const { data: fallback } = await supabase
            .from('stories')
            .select('id, child_name, topic, cover_url, theme, story_pages(illustration_url)')
            .eq('story_pages.page_number', 1)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          data = fallback;
        }

        setStory(data);
      } catch (error) {
        console.error('Failed to fetch daily story:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyStory();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 animate-pulse">
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 rounded-2xl comic-shadow">
      {/* Decorative stars */}
      <div className="absolute top-3 right-3">
        <Star className="h-6 w-6 text-amber-400 fill-amber-400 animate-pulse" />
      </div>
      <div className="absolute top-8 left-6">
        <Sparkles className="h-5 w-5 text-primary/60" />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          <h2 className="text-lg font-bold text-foreground">הסיפור של היום</h2>
        </div>

        <div className="flex gap-4">
          {/* Cover Image */}
          <div className="relative w-24 h-32 rounded-xl overflow-hidden flex-shrink-0 comic-shadow">
            {(story.cover_url || story.story_pages?.[0]?.illustration_url) ? (
              <img
                src={story.cover_url || story.story_pages?.[0]?.illustration_url || ''}
                alt={story.topic}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Star className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          {/* Story Info */}
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <h3 className="font-bold text-foreground mb-1 line-clamp-1">
                הסיפור של {story.child_name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {story.topic}
              </p>
            </div>

            <Button
              onClick={() => navigate(`/story/${story.id}`)}
              className="w-full gap-2 mt-2"
              size="sm"
            >
              לקריאה
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryOfTheDay;
