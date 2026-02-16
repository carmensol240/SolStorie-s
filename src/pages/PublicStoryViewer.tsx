import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Loader2, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PublicPage {
  page_number: number;
  text: string;
  illustration_url: string | null;
}

interface PublicStory {
  id: string;
  child_name: string;
  topic: string;
  age_range: string;
  language: string;
  cover_url: string | null;
  child_gender: string | null;
  pages: PublicPage[];
}

const PublicStoryViewer = () => {
  const { storySlug } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<PublicStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!storySlug) return;

    const fetchStory = async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc("get_public_story", {
          p_story_id: storySlug,
        });

        if (rpcError || !data) {
          setError(true);
          return;
        }

        const storyData = data as unknown as PublicStory;
        if (!storyData.pages || storyData.pages.length === 0) {
          setError(true);
          return;
        }

        setStory(storyData);

        // Fetch signed URLs for illustrations
        const illustrationPaths = storyData.pages
          .filter((p) => p.illustration_url)
          .map((p) => p.illustration_url!);

        if (illustrationPaths.length > 0) {
          const resolvedId = storyData.id;
          const { data: urlData } = await supabase.functions.invoke(
            "get-signed-illustration-url",
            {
              body: { paths: illustrationPaths, storyId: resolvedId, publicView: true },
            }
          );
          if (urlData?.signedUrls) {
            setSignedUrls(urlData.signedUrls);
          }
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [storySlug]);

  const handleNext = useCallback(() => {
    if (story && currentPage < story.pages.length - 1) {
      setCurrentPage((p) => p + 1);
    }
  }, [story, currentPage]);

  const handlePrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto" />
          <p className="text-purple-800 font-medium">טוען את הסיפור...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <BookOpen className="w-16 h-16 text-purple-400 mx-auto" />
          <p className="text-xl font-bold text-purple-800">הסיפור לא נמצא</p>
          <p className="text-purple-600">ייתכן שהקישור אינו תקין</p>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Home className="w-4 h-4 ml-2" />
            לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  const page = story.pages[currentPage];
  const illustrationSrc = page?.illustration_url
    ? signedUrls[page.illustration_url] || null
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-purple-800 truncate flex-1 text-center">
          ✨ {story.topic} ✨
        </h1>
      </header>

      {/* Story Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full">
        {/* Illustration */}
        {illustrationSrc && (
          <div className="w-full max-w-md mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={illustrationSrc}
              alt={`איור עמוד ${page.page_number}`}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Text */}
        <div className="w-full bg-white/90 rounded-2xl shadow-md p-6 mb-6">
          <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line text-center font-medium">
            {page?.text}
          </p>
        </div>

        {/* Page indicator */}
        <div className="text-sm text-purple-500 mb-4">
          עמוד {currentPage + 1} מתוך {story.pages.length}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentPage >= story.pages.length - 1}
            className="rounded-full border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Page dots */}
          <div className="flex gap-1.5">
            {story.pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  i === currentPage
                    ? "bg-purple-500 scale-125"
                    : "bg-purple-200 hover:bg-purple-300"
                )}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentPage <= 0}
            className="rounded-full border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-purple-100 px-4 py-3 text-center">
        <p className="text-sm text-purple-600">
          נוצר באהבה ב-
          <a href="https://www.soulstory.co.il" className="font-bold text-purple-700 hover:underline mr-1">
            SolStorie's™
          </a>
          📚✨
        </p>
      </footer>
    </div>
  );
};

export default PublicStoryViewer;
