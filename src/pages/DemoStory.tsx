import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookFrame, BookPage, NavigationArrows } from "@/components/story/book-frame";
import { supabase } from "@/integrations/supabase/client";

const DEMO_SLUG = "wm25f6";

type DemoPage = {
  page_number: number;
  text: string | null;
  illustration_url: string | null;
};

type DemoStoryData = {
  child_name: string;
  topic: string;
  age_range: string;
  pages: DemoPage[];
};

const DemoStory = () => {
  const navigate = useNavigate();
  const [story, setStory] = useState<DemoStoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc("get_public_story", {
          p_story_id: DEMO_SLUG,
        });
        if (cancelled) return;
        if (rpcError || !data) { setError(true); return; }
        const s = data as unknown as DemoStoryData;
        if (!s.pages || s.pages.length === 0) { setError(true); return; }
        // Ensure pages are ordered
        s.pages.sort((a, b) => a.page_number - b.page_number);
        setStory(s);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
              {story?.child_name ?? "סיפור לדוגמה"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-pink-400 text-white">
              סיפור לדוגמה
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-3 py-4 md:py-8">
        {loading && (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        )}

        {!loading && (error || !story || !page) && (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-slate-600">לא ניתן לטעון את הסיפור</p>
          </div>
        )}

        {!loading && !error && story && page && (
        <div className="relative w-full max-w-6xl">
          <BookFrame>
            <div dir="ltr" className="grid grid-cols-1 md:grid-cols-2 md:min-h-[70vh]">
              {/* Illustration page (left) — inline so mobile shows the full image */}
              <div className="relative w-full aspect-square md:aspect-auto md:h-full bg-gradient-to-br from-[#FFFBF5] via-[#F5E6D3] to-[#FAF3E8] overflow-hidden">
                {page.illustration_url && (
                  <img
                    src={page.illustration_url}
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
                text={page.text ?? ""}
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