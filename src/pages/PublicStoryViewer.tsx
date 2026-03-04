import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Loader2, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";
import castWavingFarewell from "@/assets/cast-waving-farewell.png";
import solSuperheroWelcome from "@/assets/sol-superhero-welcome.jpg";
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

interface VirtualPage {
  type: 'illustration' | 'text';
  dbPage: PublicPage;
  text: string;
  illustrationUrl: string | null;
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

  // Build virtual pages — merge every 2 for toddlers (0-2)
  const virtualPages = useMemo<VirtualPage[]>(() => {
    if (!story) return [];
    const pages = story.pages;
    const isToddler = story.age_range === '0-2';

    if (isToddler) {
      const result: VirtualPage[] = [];
      for (let i = 0; i < pages.length; i += 2) {
        const p1 = pages[i];
        const p2 = pages[i + 1];
        result.push({
          dbPage: p1,
          combinedText: p2 ? `${p1.text}\n${p2.text}` : p1.text,
          illustrationUrl: p1.illustration_url,
        });
      }
      return result;
    }

    return pages.map(p => ({
      dbPage: p,
      illustrationUrl: p.illustration_url,
    }));
  }, [story]);

  const handlePageNav = useCallback((dir: 'next' | 'prev') => {
    if (!story) return;
    const maxPage = virtualPages.length; // end page
    setCurrentPage(p => dir === 'next' ? Math.min(p + 1, maxPage) : Math.max(p - 1, -1));
  }, [story, virtualPages.length]);

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
  const isEndPage = currentPage >= virtualPages.length;
  const currentVirtual = (!isCoverPage && !isEndPage && currentPage >= 0) ? virtualPages[currentPage] : null;
  const illustrationSrc = currentVirtual?.illustrationUrl ? getPublicIllustrationUrl(currentVirtual.illustrationUrl) : null;
  const displayText = currentVirtual?.combinedText || currentVirtual?.dbPage.text || '';

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
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border-2 border-[#D4A574]">

            {/* Cover Page */}
            {isCoverPage && (
              <div className="h-full w-full relative">
                <img src={story.cover_url || solSuperheroWelcome} alt="כריכה" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                {/* Content — dedication + button */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">

                  <p className="text-base text-white/90 font-medium drop-shadow-md" dir="rtl">
                    הספר הזה נוצר במיוחד עבורך,
                  </p>
                  <p className="text-2xl md:text-4xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg mt-1">
                    {story.child_name} ❤️
                  </p>
                  <p className="text-sm text-white/70 mt-2 drop-shadow-md">{story.topic}</p>
                </div>

                {/* Bottom — open button */}
                <div className="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center">
                  <button onClick={() => handlePageNav('next')} aria-label="התחל לקרוא"
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all border-2 border-white/50 text-sm">
                    📖 פִּתְחוּ אֶת הַסֵּפֶר
                  </button>
                  <span className="mt-2 text-xs text-white/60 font-bold">SolStorie's™</span>
                </div>
              </div>
            )}

            {/* End Page */}
            {isEndPage && (
              <div className="h-full w-full relative bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 flex flex-col items-center justify-center">
                <div className="text-center space-y-4 p-6">
                  <p className="text-4xl">📚✨</p>
                  <h2 className="text-2xl font-bold text-[#8B4513]">תודה שקראתם!</h2>
                  <p className="text-[#6B4423]">נוצר באהבה ב-SolStorie's™</p>
                  <Button onClick={() => navigate("/")} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 mt-4">
                    <Home className="w-4 h-4 ml-2" />
                    צרו סיפור משלכם
                  </Button>
                </div>
                <button onClick={() => handlePageNav('prev')} aria-label="עמוד קודם"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-purple-100/60 hover:bg-purple-200 text-purple-500 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Story Pages — Fullscreen illustration + overlay */}
            {currentVirtual && (
              <div key={currentPage} className="h-full w-full relative animate-fade-in">
                {/* Fullscreen illustration */}
                {illustrationSrc ? (
                  <img src={illustrationSrc} alt={`איור עמוד ${currentVirtual.dbPage.page_number}`}
                    className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 flex items-center justify-center">
                    <span className="text-6xl opacity-30">✨</span>
                  </div>
                )}

                {/* Dark gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 via-black/15 to-transparent"
                  style={{ minHeight: '35%' }}>
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                    <p className="text-lg md:text-2xl text-white font-semibold whitespace-pre-line text-center leading-relaxed"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 3px 8px rgba(0,0,0,0.7), 0 0 16px rgba(0,0,0,0.5)', backgroundColor: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: '12px', lineHeight: '1.9' }} dir="rtl">
                      {displayText}
                    </p>
                    <div className="flex items-center justify-center mt-3">
                      <span className="text-xs text-white/50">{currentPage + 1} / {virtualPages.length}</span>
                    </div>
                  </div>
                </div>

                {/* Navigation arrows */}
                <button onClick={() => handlePageNav('prev')} disabled={currentPage <= 0}
                  className={cn("absolute right-2 top-1/2 -translate-y-1/2 z-20",
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-white/20 hover:bg-white/40 text-white transition-all",
                    "disabled:opacity-20 disabled:cursor-not-allowed")}>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => handlePageNav('next')} disabled={currentPage >= virtualPages.length - 1}
                  className={cn("absolute left-2 top-1/2 -translate-y-1/2 z-20",
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-white/20 hover:bg-white/40 text-white transition-all",
                    "disabled:opacity-20 disabled:cursor-not-allowed")}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Page indicator */}
        <div className="dot-indicator pb-2">
          {virtualPages.length <= 10 ? (
            <>
              <div className={cn("dot", currentPage === -1 && "active")} />
              {virtualPages.map((_, i) => (
                <div key={i} className={cn("dot", currentPage === i && "active")} />
              ))}
              <div className={cn("dot", isEndPage && "active")} />
            </>
          ) : (
            <span className="text-xs text-gray-400">
              {isCoverPage ? '' : isEndPage ? 'סוף' : `${currentPage + 1} / ${virtualPages.length}`}
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
