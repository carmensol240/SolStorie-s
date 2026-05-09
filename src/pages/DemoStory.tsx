import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookFrame, BookPage, NavigationArrows } from "@/components/story/book-frame";
import { supabase } from "@/integrations/supabase/client";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";

const DEMO_SLUG = "wm25f6";
const DEMO_UUID = "a9809104-e088-46f4-810f-0d6d47a9bb24";

interface DemoPage {
  page_number: number;
  text: string;
  illustration_url: string | null;
}

interface DemoStoryData {
  id: string;
  child_name: string;
  topic: string;
  age_range: string;
  cover_url: string | null;
  pages: DemoPage[];
}

const DemoStory = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [story, setStory] = useState<DemoStoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tryFetch = async (id: string) => {
      const { data, error: rpcError } = await supabase.rpc("get_public_story", {
        p_story_id: id,
      });
      if (rpcError || !data) return null;
      const sd = data as unknown as DemoStoryData;
      if (!sd.pages || sd.pages.length === 0) return null;
      return sd;
    };
    const fetchStory = async () => {
      try {
        let storyData = await tryFetch(DEMO_SLUG);
        if (cancelled) return;
        if (!storyData) {
          console.warn("[DemoStory] slug fetch returned no pages, falling back to UUID overload");
          storyData = await tryFetch(DEMO_UUID);
          if (cancelled) return;
        }
        if (!storyData) {
          setError(true);
          return;
        }
        setStory(storyData);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStory();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = story?.pages.length ?? 0;
  const page = story?.pages[currentPage];

  const goPrev = () => setCurrentPage((p) => Math.max(0, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background" dir="rtl">
      {/* Simple read-only header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-white/30 px-3 py-2 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.85)' }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-slate-600 hover:bg-sky-100/60 min-h-[44px] p-2 gap-1"
            aria-label="חזרה"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-medium">חזרה</span>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700 truncate max-w-[180px] md:max-w-none">
              {story?.topic ?? "סיפור לדוגמה"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-pink-400 text-white">
              סיפור לדוגמה
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-3 py-4 md:py-8">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-sm text-slate-600">טוען סיפור לדוגמה...</p>
          </div>
        ) : error || !story || !page ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-base font-bold text-slate-700">לא הצלחנו לטעון את הסיפור לדוגמה</p>
            <Button onClick={() => navigate("/")} variant="outline">חזרה לדף הבית</Button>
          </div>
        ) : (
        <div className="relative w-full max-w-6xl">
          <BookFrame>
            <div dir="ltr" className="grid grid-cols-1 md:grid-cols-2 md:min-h-[70vh]">
              {/* Illustration page (left) — inline so mobile shows the full image */}
              <div className="relative w-full aspect-square md:aspect-auto md:h-full bg-gradient-to-br from-[#FFFBF5] via-[#F5E6D3] to-[#FAF3E8] overflow-hidden">
                {page.illustration_url && (
                  <img
                    src={getPublicIllustrationUrl(page.illustration_url) ?? ""}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain md:object-cover"
                  />
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="text-sm text-white/80 font-serif italic drop-shadow">
                    {page.page_number}
                  </span>
                </div>
              </div>
              {/* Text page (right) */}
              <BookPage
                type="text"
                text={page.text}
                pageNumber={page.page_number}
                totalPages={totalPages}
              />
            </div>
          </BookFrame>

          <NavigationArrows
            onPrev={goPrev}
            onNext={goNext}
            canGoPrev={currentPage > 0}
            canGoNext={currentPage < totalPages - 1}
          />
        </div>
        )}

        {/* CTA to real flow */}
        <button
          onClick={() => navigate("/create#photo-upload-section")}
          className="mt-6 group flex items-center justify-center gap-2.5 rounded-full px-6 py-3 w-full max-w-[300px] bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.03] active:scale-95 transition-all duration-300 border border-white/30"
        >
          <Wand2 className="w-5 h-5 text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-300" />
          <span className="font-black text-base text-white drop-shadow-md">
            צרו את הסיפור שלכם ✨
          </span>
        </button>
      </main>
    </div>
  );
};

export default DemoStory;