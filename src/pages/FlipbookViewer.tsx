import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Heart, BookOpen, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SignedImage } from "@/components/ui/signed-image";
import "./StoryViewer.css"; // Import shared book animation styles

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

    // 3D flip transition (350ms)
    setTimeout(() => {
      setCurrentPage(prev => direction === 'next' ? prev + 1 : prev - 1);
      setIsFlipping(false);
    }, 350);
  };

  const handleShare = async () => {
    if (!digitalBook || !story) return;
    
    // Clean public URL using slug (fallback to UUID)
    const publicUrl = `https://soulstory.co.il/story/${(story as any).slug || story.id}`;
    const title = `✨ ${story.topic} ✨`;
    const summary = pages[0]?.text 
      ? (pages[0].text.length > 100 ? pages[0].text.substring(0, 100).trim() + '...' : pages[0].text)
      : 'סיפור מקסים שנוצר במיוחד';
    const footer = `\n\n📚 נוצר באהבה באפליקציית SolStorie's™`;
    const fullMessage = `${title}\n\n${summary}\n\n👇 לקריאת הסיפור המלא:\n${publicUrl}${footer}`;
    
    try {
      await navigator.share({
        title: `הסיפור של ${story.child_name}`,
        text: fullMessage,
        url: publicUrl,
      });
    } catch {
      await navigator.clipboard.writeText(publicUrl);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-purple-800 font-medium">טוען את הספרון...</p>
        </div>
      </div>
    );
  }

  if (!digitalBook || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 text-purple-400 mx-auto" />
          <p className="text-xl font-bold text-purple-800">הספרון לא נמצא</p>
          <Button onClick={() => navigate("/")} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
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
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col" 
      dir="rtl"
    >
      {/* Minimal Header */}
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/library")}
          className="text-purple-700 hover:bg-purple-100 gap-1"
          aria-label="חזרה לספרייה"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm">לספרייה</span>
        </Button>
        
        <h1 className="font-serif text-lg font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          הספרון של {story.child_name}
        </h1>

        {digitalBook.is_public && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-purple-700 hover:bg-purple-100"
          >
            {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          </Button>
        )}
      </header>

      {/* Book Container */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
        <div className="w-full max-w-xl">
          {/* Subtle navigation arrows on sides */}
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage <= (hasDedication ? -1 : 0) || isFlipping}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/40 hover:bg-white/70 text-purple-600/60 hover:text-purple-700 backdrop-blur-sm transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed border border-purple-200/50 shadow-sm hover:shadow-md flex items-center justify-center"
            aria-label="עמוד קודם"
          >
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <button
            onClick={() => handlePageChange('next')}
            disabled={currentPage >= pages.length - 1 || isFlipping}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/40 hover:bg-white/70 text-purple-600/60 hover:text-purple-700 backdrop-blur-sm transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed border border-purple-200/50 shadow-sm hover:shadow-md flex items-center justify-center"
            aria-label="עמוד הבא"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Elegant Book Frame with fade transition */}
          <div 
            className={cn(
              "relative bg-white rounded-2xl overflow-hidden",
              "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
              "border border-purple-200",
              "book-page-flip",
              isFlipping && flipDirection === 'next' && "flip-out-next",
              isFlipping && flipDirection === 'prev' && "flip-out-prev",
            )}
          >
            {/* Purple edge decoration */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-purple-400 to-pink-300" />
            
            {/* Page Content */}
            <div className="p-8 md:p-12 min-h-[500px] md:min-h-[600px] flex flex-col mr-2">
              {isDedicationPage ? (
                /* Dedication Page */
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Heart className="w-12 h-12 text-pink-400 mb-6" />
                  <p className="font-serif text-xl md:text-2xl text-purple-900 whitespace-pre-line max-w-md" style={{ lineHeight: '1.7' }}>
                    {digitalBook.dedication_text}
                  </p>
                </div>
              ) : currentPage === -1 || currentPage === 0 && !hasDedication ? (
                /* Cover/Title Page */
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-purple-900" style={{ lineHeight: '1.5' }}>
                    הסיפור של
                  </h2>
                  <h3 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                    {story.child_name}
                  </h3>
                  <p className="font-serif text-lg text-purple-600 mt-4 max-w-xs" style={{ lineHeight: '1.6' }}>
                    {story.topic}
                  </p>
                  <div className="w-20 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent mt-8" />
                </div>
              ) : page ? (
                /* Story Page */
                <div className="flex-1 flex flex-col">
                  {/* High Quality Illustration */}
                  {page.illustration_url && (
                    <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg bg-[#F5E6D3]">
                      <div className="aspect-[4/3] flex items-center justify-center">
                        <SignedImage
                          src={page.illustration_url}
                          storyId={story.id}
                          shareToken={shareToken || undefined}
                          alt={page.text ? `איור לעמוד: ${page.text.slice(0, 60)}` : "איור לסיפור"}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Elegant Typography with better line-height */}
                  <div className="flex-1 flex items-center px-2 md:px-4">
                    <p className="font-serif text-xl md:text-2xl text-purple-900 text-right" style={{ lineHeight: '1.7' }}>
                      {page.text}
                    </p>
                  </div>

                  {/* Discreet page indicator */}
                  <div className="text-center pt-6 mt-6">
                    <span className="text-xs text-gray-400 font-light">
                      {currentPage + 1} / {pages.length}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FlipbookViewer;
