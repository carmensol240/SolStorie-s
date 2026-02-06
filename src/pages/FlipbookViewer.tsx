import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Heart, BookOpen, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StoryPage {
  id: string;
  page_number: number;
  text: string;
  illustration_url: string | null;
}

interface Story {
  id: string;
  child_name: string;
  topic: string;
}

interface DigitalBook {
  id: string;
  story_id: string;
  dedication_text: string | null;
  share_token: string;
  is_public: boolean;
}

const FlipbookViewer = () => {
  const { bookId } = useParams();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('token');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [digitalBook, setDigitalBook] = useState<DigitalBook | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [currentPage, setCurrentPage] = useState(-1); // -1 = dedication/cover, 0+ = story pages
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (bookId || shareToken) {
      fetchDigitalBook();
    }
  }, [bookId, shareToken]);

  const fetchDigitalBook = async () => {
    try {
      let bookData: DigitalBook | null = null;
      
      if (shareToken) {
        // Use secure function for shared books (doesn't expose user_id or dedication_text)
        const { data: publicBooks, error: publicError } = await supabase
          .rpc("get_public_book", { p_share_token: shareToken });

        if (publicError) throw publicError;
        if (publicBooks && publicBooks.length > 0) {
          const publicBook = publicBooks[0];
          // For public books, dedication is intentionally hidden for privacy
          bookData = {
            ...publicBook,
            user_id: '', // Not exposed in public function
            dedication_text: null, // Privacy: not shown to public viewers
          } as DigitalBook;
        }
      } else if (bookId) {
        // Owner viewing their own book - can see everything
        const { data, error } = await supabase
          .from("digital_books")
          .select("*")
          .eq("id", bookId)
          .maybeSingle();
        
        if (error) throw error;
        bookData = data;
      }

      if (!bookData) {
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "הספרון לא נמצא",
        });
        navigate("/");
        return;
      }

      setDigitalBook(bookData);

      // Fetch story
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select("id, child_name, topic")
        .eq("id", bookData.story_id)
        .maybeSingle();

      if (storyError) throw storyError;
      if (!storyData) throw new Error("Story not found");

      setStory(storyData);

      // Fetch pages
      const { data: pagesData, error: pagesError } = await supabase
        .from("story_pages")
        .select("*")
        .eq("story_id", bookData.story_id)
        .order("page_number", { ascending: true });

      if (pagesError) throw pagesError;
      setPages(pagesData || []);

    } catch (error) {
      console.error("Error fetching digital book:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הספרון",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (isFlipping) return;

    const hasDedication = !!digitalBook?.dedication_text;
    const minPage = hasDedication ? -1 : 0;
    const maxPage = pages.length - 1;

    if (direction === 'next' && currentPage >= maxPage) return;
    if (direction === 'prev' && currentPage <= minPage) return;

    setFlipDirection(direction);
    setIsFlipping(true);

    setTimeout(() => {
      setCurrentPage(prev => direction === 'next' ? prev + 1 : prev - 1);
      setIsFlipping(false);
    }, 400);
  };

  const handleShare = async () => {
    if (!digitalBook) return;
    
    const shareUrl = `${window.location.origin}/flipbook?token=${digitalBook.share_token}`;
    
    try {
      await navigator.share({
        title: `הספרון של ${story?.child_name}`,
        text: "ראו את הספרון המדהים שיצרנו!",
        url: shareUrl,
      });
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "הקישור הועתק!",
        description: "עכשיו אפשר לשתף אותו",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-amber-800 font-medium">טוען את הספרון...</p>
        </div>
      </div>
    );
  }

  if (!digitalBook || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 text-amber-400 mx-auto" />
          <p className="text-xl font-bold text-amber-800">הספרון לא נמצא</p>
          <Button onClick={() => navigate("/")} variant="outline">
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  const hasDedication = !!digitalBook.dedication_text;
  const isDedicationPage = currentPage === -1 && hasDedication;
  const page = currentPage >= 0 ? pages[currentPage] : null;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex flex-col" 
      dir="rtl"
    >
      {/* Minimal Header */}
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/library")}
          className="text-amber-700 hover:bg-amber-100 gap-1"
          aria-label="חזרה לספרייה"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm">לספרייה</span>
        </Button>
        
        <h1 className="font-serif text-lg text-amber-800 font-semibold">
          הספרון של {story.child_name}
        </h1>

        {digitalBook.is_public && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-amber-700 hover:bg-amber-100"
          >
            {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          </Button>
        )}
      </header>

      {/* Book Container */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-xl">
          {/* Elegant Book Frame */}
          <div 
            className={cn(
              "relative bg-white rounded-2xl overflow-hidden",
              "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
              "border border-amber-200",
              "transition-transform duration-400",
              isFlipping && (flipDirection === 'next' ? "animate-flip-next" : "animate-flip-prev")
            )}
          >
            {/* Gold edge decoration */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-amber-300 to-amber-100" />
            
            {/* Page Content */}
            <div className="p-8 md:p-12 min-h-[500px] md:min-h-[600px] flex flex-col mr-2">
              {isDedicationPage ? (
                /* Dedication Page */
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Heart className="w-12 h-12 text-rose-400 mb-6" />
                  <p className="font-serif text-xl md:text-2xl text-amber-900 leading-relaxed whitespace-pre-line max-w-md">
                    {digitalBook.dedication_text}
                  </p>
                </div>
              ) : currentPage === -1 || currentPage === 0 && !hasDedication ? (
                /* Cover/Title Page */
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-amber-900 leading-relaxed">
                    הסיפור של
                  </h2>
                  <h3 className="font-serif text-4xl md:text-5xl font-bold text-amber-700">
                    {story.child_name}
                  </h3>
                  <p className="font-serif text-lg text-amber-600 mt-4 max-w-xs">
                    {story.topic}
                  </p>
                  <div className="w-20 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-8" />
                </div>
              ) : page ? (
                /* Story Page */
                <div className="flex-1 flex flex-col">
                  {/* High Quality Illustration */}
                  {page.illustration_url && (
                    <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
                      <div className="aspect-[4/3]">
                        <img
                          src={page.illustration_url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}

                  {/* Elegant Typography */}
                  <div className="flex-1 flex items-center">
                    <p className="font-serif text-xl md:text-2xl leading-loose text-amber-900 text-right">
                      {page.text}
                    </p>
                  </div>

                  {/* Page Number */}
                  <div className="text-center pt-6 border-t border-amber-100 mt-6">
                    <span className="font-serif text-amber-500 text-sm">
                      עמוד {currentPage + 1} מתוך {pages.length}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {/* Navigation */}
      <footer className="p-4 md:p-6">
        <nav className="flex items-center justify-center gap-6 max-w-xl mx-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handlePageChange('prev')}
            disabled={currentPage <= (hasDedication ? -1 : 0)}
            className="rounded-full border-2 border-amber-300 bg-white/80 hover:bg-amber-50 text-amber-700 px-6"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            הקודם
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => handlePageChange('next')}
            disabled={currentPage >= pages.length - 1}
            className="rounded-full border-2 border-amber-300 bg-white/80 hover:bg-amber-50 text-amber-700 px-6"
          >
            הבא
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>
        </nav>
      </footer>
    </div>
  );
};

export default FlipbookViewer;
