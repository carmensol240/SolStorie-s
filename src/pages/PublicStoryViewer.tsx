import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Loader2, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";
import "./StoryViewer.css";

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
  const [currentPage, setCurrentPage] = useState(-1); // -1 = cover

  // Landscape lock on mobile
  useEffect(() => {
    const lockLandscape = async () => {
      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape');
        }
      } catch { /* not supported */ }
    };
    lockLandscape();
    return () => {
      try {
        if (screen.orientation && 'unlock' in screen.orientation) {
          screen.orientation.unlock();
        }
      } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    if (!storySlug) return;
    const fetchStory = async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc("get_public_story", {
          p_story_id: storySlug,
        });
        if (rpcError || !data) { setError(true); return; }
        const storyData = data as unknown as PublicStory;
        if (!storyData.pages || storyData.pages.length === 0) { setError(true); return; }
        setStory(storyData);
      } catch { setError(true); } finally { setIsLoading(false); }
    };
    fetchStory();
  }, [storySlug]);

  const handlePageNav = useCallback((dir: 'next' | 'prev') => {
    if (!story) return;
    const maxPage = story.pages.length; // end page
    setCurrentPage(p => dir === 'next' ? Math.min(p + 1, maxPage) : Math.max(p - 1, -1));
  }, [story]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePageNav('next');
      if (e.key === 'ArrowRight') handlePageNav('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePageNav]);

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
          <Button onClick={() => navigate("/")} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
            <Home className="w-4 h-4 ml-2" />
            לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  const isCoverPage = currentPage === -1;
  const isEndPage = currentPage >= story.pages.length;
  const page = (!isCoverPage && !isEndPage && currentPage >= 0) ? story.pages[currentPage] : null;
  const illustrationSrc = page?.illustration_url ? getPublicIllustrationUrl(page.illustration_url) : null;
  const coverIllustration = story.pages[0]?.illustration_url ? getPublicIllustrationUrl(story.pages[0].illustration_url) : null;

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex flex-col story-viewer-landscape" dir="rtl">
      {/* Compact header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-2 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold text-purple-800 truncate flex-1 text-center">
          ✨ {story.topic} ✨
        </h1>
      </header>

      {/* Book area */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 min-h-0">
        <div className="book-container w-full max-w-4xl" style={{ height: 'calc(100vh - 100px)' }}>
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border-2 border-[#D4A574]"
            style={{ background: 'linear-gradient(135deg, #FFFBF5 0%, #FFF8E7 50%, #FFFBF5 100%)' }}>

            {/* Cover Page */}
            {isCoverPage && (
              <div className="open-book-spread h-full">
                <div className="open-book-page-left bg-[#F5E6D3] flex items-center justify-center">
                  {coverIllustration ? (
                    <img src={coverIllustration} alt="כריכה" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-20 h-20 text-purple-300" />
                  )}
                </div>
                <div className="open-book-page-right relative bg-[#FFFBF5] px-6 py-5 md:px-10 md:py-6">
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                    <p className="text-sm text-[#8B4513]">✦ סיפור מיוחד ✦</p>
                    <h2 className="text-2xl md:text-4xl font-bold text-[#8B4513]">הסיפור של</h2>
                    <h3 className="text-3xl md:text-5xl font-bold text-purple-600">{story.child_name}</h3>
                    <p className="text-lg text-[#6B4423]">{story.topic}</p>
                  </div>
                  <button onClick={() => handlePageNav('next')} aria-label="התחל לקרוא"
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-purple-100/60 hover:bg-purple-200 text-purple-500 opacity-50 hover:opacity-100 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="page-curl-corner bottom-right" />
                </div>
              </div>
            )}

            {/* End Page */}
            {isEndPage && (
              <div className="open-book-spread h-full">
                <div className="open-book-page-left bg-[#F5E6D3] flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-purple-300" />
                </div>
                <div className="open-book-page-right relative bg-[#FFFBF5] px-6 py-5">
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                    <p className="text-4xl">📚✨</p>
                    <h2 className="text-2xl font-bold text-[#8B4513]">תודה שקראתם!</h2>
                    <p className="text-[#6B4423]">נוצר באהבה ב-SolStorie's™</p>
                    <Button onClick={() => navigate("/")} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 mt-4">
                      <Home className="w-4 h-4 ml-2" />
                      צרו סיפור משלכם
                    </Button>
                  </div>
                  <button onClick={() => handlePageNav('prev')} aria-label="עמוד קודם"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-purple-100/60 hover:bg-purple-200 text-purple-500 opacity-50 hover:opacity-100 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Story Pages */}
            {page && (
              <div className="open-book-spread h-full">
                {illustrationSrc ? (
                  <>
                    <div className="open-book-page-left bg-[#F5E6D3] flex items-center justify-center">
                      <img src={illustrationSrc} alt={`איור עמוד ${page.page_number}`} className="w-full h-full object-cover" />
                      <div className="page-curl-corner bottom-left" />
                    </div>

                    <div className="open-book-page-right relative px-6 py-5 md:px-10 md:py-6 bg-[#FFFBF5]">
                      <div className="page-curl-corner bottom-right" />
                      <button onClick={() => handlePageNav('prev')} disabled={currentPage <= 0}
                        className={cn("absolute right-1.5 top-1/2 -translate-y-1/2 z-10",
                          "w-7 h-7 rounded-full flex items-center justify-center",
                          "bg-purple-100/60 hover:bg-purple-200 border border-purple-200/60",
                          "text-purple-500 opacity-50 hover:opacity-100 transition-all",
                          "disabled:opacity-20 disabled:cursor-not-allowed")}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button onClick={() => handlePageNav('next')} disabled={currentPage >= story.pages.length - 1}
                        className={cn("absolute left-1.5 top-1/2 -translate-y-1/2 z-10",
                          "w-7 h-7 rounded-full flex items-center justify-center",
                          "bg-purple-100/60 hover:bg-purple-200 border border-purple-200/60",
                          "text-purple-500 opacity-50 hover:opacity-100 transition-all",
                          "disabled:opacity-20 disabled:cursor-not-allowed")}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full overflow-y-auto min-h-0 pt-2">
                        <p className="text-xl md:text-2xl text-[#3D2914] text-right font-medium whitespace-pre-line" style={{ lineHeight: '1.9' }} dir="rtl">
                          {page.text}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-4 pt-2 mt-auto">
                        <button onClick={() => handlePageNav('next')} disabled={currentPage >= story.pages.length - 1}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-100/60 hover:bg-purple-200 text-purple-500 disabled:opacity-20 transition-all">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-400 font-light">{currentPage + 1} / {story.pages.length}</span>
                        <button onClick={() => handlePageNav('prev')} disabled={currentPage <= 0}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-100/60 hover:bg-purple-200 text-purple-500 disabled:opacity-20 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Text-only page — full width, centered text */
                  <div className="w-full h-full relative bg-[#FDFBF7] flex flex-col">
                    <div className="w-full h-0.5 shrink-0 bg-gradient-to-r from-purple-300/60 via-pink-300/60 to-orange-200/60" />
                    <button onClick={() => handlePageNav('prev')} disabled={currentPage <= 0}
                      className={cn("absolute right-1.5 top-1/2 -translate-y-1/2 z-10",
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        "bg-purple-100/60 hover:bg-purple-200 border border-purple-200/60",
                        "text-purple-500 opacity-50 hover:opacity-100 transition-all",
                        "disabled:opacity-20 disabled:cursor-not-allowed")}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => handlePageNav('next')} disabled={currentPage >= story.pages.length - 1}
                      className={cn("absolute left-1.5 top-1/2 -translate-y-1/2 z-10",
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        "bg-purple-100/60 hover:bg-purple-200 border border-purple-200/60",
                        "text-purple-500 opacity-50 hover:opacity-100 transition-all",
                        "disabled:opacity-20 disabled:cursor-not-allowed")}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 md:px-12 md:py-10 flex flex-col">
                      <div className="max-w-lg mx-auto w-full flex-1 flex items-center justify-center">
                        <p className="text-xl md:text-2xl text-[#3D2914] text-right font-medium whitespace-pre-line" style={{ lineHeight: '1.9' }} dir="rtl">
                          {page.text}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1 pt-4 pb-1 shrink-0">
                        <span className="text-[#D4A574]/50 text-sm select-none">✦</span>
                        <span className="text-xs text-gray-400 font-light">{currentPage + 1} / {story.pages.length}</span>
                      </div>
                    </div>
                    <div className="w-full h-0.5 shrink-0 bg-gradient-to-r from-orange-200/60 via-pink-300/60 to-purple-300/60" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Page indicator */}
        <div className="dot-indicator pb-2">
          {story.pages.length <= 10 ? (
            <>
              <div className={cn("dot", currentPage === -1 && "active")} />
              {story.pages.map((_, i) => (
                <div key={i} className={cn("dot", currentPage === i && "active")} />
              ))}
              <div className={cn("dot", isEndPage && "active")} />
            </>
          ) : (
            <span className="text-xs text-gray-400">
              {isCoverPage ? '' : isEndPage ? 'סוף' : `${currentPage + 1} / ${story.pages.length}`}
            </span>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-purple-100 px-4 py-2 text-center shrink-0">
        <p className="text-sm text-purple-600">
          נוצר באהבה ב-
          <a href="https://soulstory.co.il" className="font-bold text-purple-700 hover:underline mr-1">SolStorie's™</a>
          📚✨
        </p>
      </footer>
    </div>
  );
};

export default PublicStoryViewer;
