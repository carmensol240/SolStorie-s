import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Loader2, ChevronLeft, ChevronRight, Home, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";
import { TheaterFrame } from "@/components/story/theater-frame";
import castWavingFarewell from "@/assets/cast-waving-farewell.png";
import solSuperheroWelcome from "@/assets/sol-superhero-welcome.jpg";
import { useAuth } from "@/hooks/use-auth";
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
  type: 'illustration' | 'text' | 'combined';
  dbPage: PublicPage;
  text: string;
  illustrationUrl: string | null;
}

const PublicStoryViewer = () => {
  const { storySlug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [story, setStory] = useState<PublicStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(-1); // -1 = cover
  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [signupLockOpen, setSignupLockOpen] = useState(false);
  const guestStoryId = sessionStorage.getItem("guest_story_id");

  // Show guest banner if this is a guest-generated story
  useEffect(() => {
    if (guestStoryId && !user) {
      setShowGuestBanner(true);
    }
    // If user just signed up, claim the story
    if (guestStoryId && user) {
      const claimStory = async () => {
        try {
          const { error } = await supabase.functions.invoke("claim-guest-story", {
            body: { storyId: guestStoryId },
          });
          if (!error) {
            sessionStorage.removeItem("guest_story_id");
            setShowGuestBanner(false);
            // Redirect to proper story viewer
            navigate(`/story/${storySlug}`, { replace: true });
          }
        } catch (e) {
          console.warn("Failed to claim guest story:", e);
        }
      };
      claimStory();
    }
  }, [guestStoryId, user, storySlug, navigate]);

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

  // Require auth: redirect logged-out visitors to /auth and return them back
  useEffect(() => {
    if (authLoading) return;
    if (!user && storySlug) {
      navigate(`/auth?returnTo=${encodeURIComponent(`/s/${storySlug}`)}`, { replace: true });
    }
  }, [user, authLoading, storySlug, navigate]);

  useEffect(() => {
    if (!storySlug || authLoading || !user) return;
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
  }, [storySlug, authLoading, user]);

  const isToddler = story?.age_range === '0-2';
  // Free taste for public/guest viewers — same limit as unpaid logged-in users
  const DEMO_VIRTUAL_PAGE_LIMIT = isToddler ? 5 : 4;
  const isLockedVirtualPage = (index: number) => index >= DEMO_VIRTUAL_PAGE_LIMIT;

  // Build virtual pages — age-based layout
  const virtualPages = useMemo<VirtualPage[]>(() => {
    if (!story) return [];
    const result: VirtualPage[] = [];
    for (const page of story.pages) {
      const hasText = page.text && page.text.trim().length > 0;
      const hasIllustration = !!page.illustration_url;

      if (isToddler) {
        // Ages 0-2: single combined page
        if (hasIllustration || hasText) {
          result.push({
            type: 'combined',
            dbPage: page,
            text: page.text,
            illustrationUrl: page.illustration_url,
          });
        }
      } else {
        // Ages 3+: separate pages
        if (hasText) {
          result.push({ type: 'text', dbPage: page, text: page.text, illustrationUrl: null });
        }
        if (hasIllustration) {
          result.push({ type: 'illustration', dbPage: page, text: page.text, illustrationUrl: page.illustration_url });
        }
      }
    }
    return result;
  }, [story, isToddler]);

  const handlePageNav = useCallback((dir: 'next' | 'prev') => {
    if (!story) return;
    const maxPage = virtualPages.length; // end page
    if (dir === 'next') {
      setCurrentPage(p => {
        const next = Math.min(p + 1, maxPage);
        if (next < virtualPages.length && isLockedVirtualPage(next)) {
          setSignupLockOpen(true);
          return p;
        }
        return next;
      });
      return;
    }
    setCurrentPage(p => Math.max(p - 1, -1));
  }, [story, virtualPages.length, DEMO_VIRTUAL_PAGE_LIMIT]);

  // Scroll to top on every page change — fires before paint
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentPage]);

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
  const isCurrentLocked = !isCoverPage && !isEndPage && currentPage >= 0 && isLockedVirtualPage(currentPage);
  const currentVirtual = (!isCoverPage && !isEndPage && currentPage >= 0 && !isCurrentLocked) ? virtualPages[currentPage] : null;
  const illustrationSrc = currentVirtual?.illustrationUrl ? getPublicIllustrationUrl(currentVirtual.illustrationUrl) : null;
  const displayText = currentVirtual?.text || '';
  const dbPageCount = story?.pages?.length || 0;
  const visiblePagesCount = Math.min(virtualPages.length, DEMO_VIRTUAL_PAGE_LIMIT);
  const signupUrl = `/auth?returnTo=${encodeURIComponent(`/s/${storySlug}`)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a1a] via-[#2a1030] to-[#1a0a1a] flex flex-col story-viewer-landscape" dir="rtl">
      {/* Compact header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-2 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold text-purple-800 truncate flex-1 text-center">
          ✨ {story.topic} ✨
        </h1>
      </header>

      {/* Book area */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 min-h-0">
        <div className="w-full max-w-4xl" style={{ height: 'calc(100vh - 100px)' }}>
          <TheaterFrame>

            {/* Cover Page */}
            {isCoverPage && (
              <div className="h-full w-full relative overflow-hidden">
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

            {/* Locked page — guest taste limit reached */}
            {isCurrentLocked && (
              <div className="h-full w-full relative bg-gradient-to-br from-[#2a1030] via-[#3a1840] to-[#1a0a1a] flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-[#FFD66B]" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white">רוצים לדעת איך זה נגמר?</h2>
                <p className="text-white/80 mt-2 max-w-sm">
                  המשך הסיפור מחכה לכם — הירשמו בחינם כדי להמשיך לקרוא ולשמור את הסיפור.
                </p>
                <Button
                  onClick={() => navigate(signupUrl)}
                  className="mt-5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full px-6 h-12"
                >
                  הירשמו והמשיכו לקרוא ✨
                </Button>
                <button onClick={() => handlePageNav('prev')} aria-label="עמוד קודם"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 text-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
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

            {/* Story Pages */}
            {currentVirtual && (
              <div key={currentPage} className="h-full w-full relative animate-fade-in overflow-hidden">
                {currentVirtual.type === 'combined' ? (
                  /* Combined page (ages 0-2) — fullscreen illustration + text overlay */
                  <>
                    {illustrationSrc ? (
                      <img src={illustrationSrc} alt={`איור עמוד ${currentVirtual.dbPage.page_number}`}
                        className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 flex items-center justify-center">
                        <span className="text-6xl opacity-30">✨</span>
                      </div>
                    )}
                    {displayText && displayText.trim() && (
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6" dir="rtl">
                        <div className="max-w-lg mx-auto">
                          <p className="text-lg md:text-2xl text-white font-semibold whitespace-pre-line text-right drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                            style={{ lineHeight: '1.8', padding: '12px 16px' }}>
                            {displayText}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center z-0">
                      <span className="text-xs text-white/50">{currentVirtual.dbPage.page_number} / {dbPageCount}</span>
                    </div>
                  </>
                ) : currentVirtual.type === 'illustration' ? (
                  /* Illustration page — fullscreen image, no text */
                  <>
                    {illustrationSrc ? (
                      <img src={illustrationSrc} alt={`איור עמוד ${currentVirtual.dbPage.page_number}`}
                        className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 flex items-center justify-center">
                        <span className="text-6xl opacity-30">✨</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                      <span className="text-xs text-white/50">{Math.ceil((currentPage + 1) / 2)} / {dbPageCount}</span>
                    </div>
                  </>
                ) : (
                  /* Text page — pastel gradient, no image */
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-y-auto flex flex-col items-center">
                    <div className="flex-1" />
                    <div className="max-w-lg mx-auto w-full px-6 md:px-10 py-6 shrink-0">
                      <p className="text-lg md:text-2xl text-[#3D2B5A] font-semibold whitespace-pre-line text-right"
                        style={{ lineHeight: '2', backgroundColor: 'rgba(255,255,255,0.5)', padding: '16px 20px', borderRadius: '16px', backdropFilter: 'blur(4px)' }} dir="rtl">
                        {displayText}
                      </p>
                    </div>
                    <div className="flex-1" />
                    <div className="pb-4 shrink-0">
                      <span className="text-xs text-[#5B3E96]/60">{Math.ceil((currentPage + 1) / 2)} / {dbPageCount}</span>
                    </div>
                  </div>
                )}

                {/* Navigation arrows */}
                <button onClick={() => handlePageNav('prev')} disabled={currentPage <= 0}
                  className={cn("absolute right-2 top-1/2 -translate-y-1/2 z-20",
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    currentVirtual.type !== 'text' ? "bg-white/20 hover:bg-white/40 text-white" : "bg-purple-100/60 hover:bg-purple-200 text-purple-500",
                    "transition-all disabled:opacity-20 disabled:cursor-not-allowed")}>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => handlePageNav('next')} disabled={currentPage >= virtualPages.length - 1}
                  className={cn("absolute left-2 top-1/2 -translate-y-1/2 z-20",
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    currentVirtual.type !== 'text' ? "bg-white/20 hover:bg-white/40 text-white" : "bg-purple-100/60 hover:bg-purple-200 text-purple-500",
                    "transition-all disabled:opacity-20 disabled:cursor-not-allowed")}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </TheaterFrame>
        </div>

        {/* Page indicator */}
        <div className="dot-indicator pb-2">
          {visiblePagesCount <= 10 ? (
            <>
              <div className={cn("dot", currentPage === -1 && "active")} />
              {Array.from({ length: visiblePagesCount }).map((_, i) => (
                <div key={i} className={cn("dot", currentPage === i && "active")} />
              ))}
              <div className={cn("dot", isEndPage && "active")} />
            </>
          ) : (
             <span className="text-xs text-gray-400">
              {isCoverPage ? '' : isEndPage ? 'סוף' : `${Math.ceil((currentPage + 1) / 2)} / ${dbPageCount}`}
            </span>
          )}
        </div>
      </main>

      {/* Signup lock modal */}
      <Dialog open={signupLockOpen} onOpenChange={setSignupLockOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center">הירשמו כדי להמשיך לקרוא</DialogTitle>
            <DialogDescription className="text-center">
              קראתם את הטעימה מהסיפור. הרשמה חינמית פותחת את שאר העמודים ושומרת את הסיפור בספרייה שלכם.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => navigate(signupUrl)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full h-12"
          >
            הירשמו והמשיכו לקרוא ✨
          </Button>
        </DialogContent>
      </Dialog>

      {/* Guest signup banner */}
      {showGuestBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white px-4 py-3 shadow-2xl" dir="rtl">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Save className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold truncate">💾 הסיפור לא נשמר — הירשמו כדי לשמור אותו!</p>
            </div>
            <Button
              onClick={() => navigate(`/auth?returnTo=/public-story/${storySlug}`)}
              size="sm"
              className="bg-white text-purple-700 hover:bg-purple-50 font-black text-xs shrink-0 rounded-full px-4"
            >
              הירשמו עכשיו ✨
            </Button>
          </div>
        </div>
      )}

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
