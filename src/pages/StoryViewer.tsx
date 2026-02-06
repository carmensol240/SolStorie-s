import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DrawingCanvas } from "@/components/ui/drawing-canvas";
import OfflineIndicator from "@/components/ui/offline-indicator";
import EditPageDialog from "@/components/story/edit-page-dialog";
import DedicationDialog from "@/components/story/DedicationDialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAnalytics } from "@/hooks/use-analytics";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useSettings } from "@/hooks/use-settings";
import { usePdfExport } from "@/hooks/use-pdf-export";
import { useNikud } from "@/hooks/use-nikud";


import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipe } from "@/hooks/use-swipe";
import { BookFrame, BookPage, BookHeader, NavigationArrows } from "@/components/story/book-frame";
import { FileDown } from "lucide-react";

import "./StoryViewer.css";

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
  pages: StoryPage[];
}

const FONT_SIZES = [
  { label: 'קטן', size: 'text-lg md:text-xl' },
  { label: 'בינוני', size: 'text-xl md:text-2xl' },
  { label: 'גדול', size: 'text-2xl md:text-3xl' },
];

const StoryViewer = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [story, setStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(1);
  const [isEditingPage, setIsEditingPage] = useState(false);
  
  const [showDedicationDialog, setShowDedicationDialog] = useState(false);
  const [isCreatingDigitalBook, setIsCreatingDigitalBook] = useState(false);
  const [showPdfFormatDialog, setShowPdfFormatDialog] = useState(false);
  
  const { trackStoryStarted, trackStoryCompleted, trackPageViewed, trackFeatureUsed } = useAnalytics();
  const { isOnline, cacheStory, getCachedStory } = useOfflineStorage();
  const { settings } = useSettings();
  const { exportToPdf, isExporting } = usePdfExport();
  const { addNikud, isLoading: isAddingNikud } = useNikud();
  
  const { user } = useAuth();
  const hasTrackedStart = useRef(false);
  
  // Swipe gesture handlers for page navigation
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      // In RTL, swipe left = next page
      if (story && currentPage < story.pages.length) {
        handlePageChange('next');
      }
    },
    onSwipeRight: () => {
      // In RTL, swipe right = prev page
      if (currentPage > -1) {
        handlePageChange('prev');
      }
    },
    threshold: 50,
  });

  useEffect(() => {
    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  useEffect(() => {
    if (story && !hasTrackedStart.current) {
      trackStoryStarted(story.id);
      hasTrackedStart.current = true;
    }
  }, [story, trackStoryStarted]);

  useEffect(() => {
    if (story && currentPage >= 0) {
      trackPageViewed(story.id, currentPage);
    }
  }, [currentPage, story?.id]);

  // Sound effects disabled - silent reading experience

  const fetchStory = async (retryCount = 0) => {
    try {
      if (!isOnline && storyId) {
        const cached = getCachedStory(storyId);
        if (cached) {
          setStory(cached);
          setIsLoading(false);
          return;
        }
      }

      console.log(`Fetching story ${storyId}, attempt ${retryCount + 1}`);

      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select("*")
        .eq("id", storyId)
        .maybeSingle();

      if (storyError) {
        console.error("Story fetch error:", storyError);
        throw storyError;
      }
      
      if (!storyData) {
        // Story not found - might be RLS or timing issue after creation
        // Retry a couple of times with delay for newly created stories
        if (retryCount < 3) {
          console.log(`Story not found, retrying in 1s (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => fetchStory(retryCount + 1), 1000);
          return;
        }
        
        console.error("Story not found after retries:", storyId);
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "הסיפור לא נמצא. ייתכן שהסיפור עדיין נוצר - נסו לרענן את הדף.",
        });
        navigate("/library");
        return;
      }

      const { data: pagesData, error: pagesError } = await supabase
        .from("story_pages")
        .select("*")
        .eq("story_id", storyId)
        .order("page_number", { ascending: true });

      if (pagesError) throw pagesError;

      // If no pages yet, retry (generation in progress)
      if (!pagesData || pagesData.length === 0) {
        if (retryCount < 5) {
          console.log(`No pages found, retrying in 2s (attempt ${retryCount + 1}/5)...`);
          setTimeout(() => fetchStory(retryCount + 1), 2000);
          return;
        }
      }

      const storyObj = {
        id: storyData.id,
        child_name: storyData.child_name,
        topic: storyData.topic,
        pages: pagesData || [],
      };
      
      setStory(storyObj);
      
      if (storyId) {
        cacheStory(storyId, storyObj);
      }
    } catch (error) {
      console.error("Error fetching story:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הסיפור",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
    
    const maxPage = story ? story.pages.length : 0;
    
    if (direction === 'next' && (!story || currentPage >= maxPage)) return;
    if (direction === 'prev' && currentPage <= -1) return;
    
    setFlipDirection(direction);
    setIsFlipping(true);
    
    setTimeout(() => {
      if (direction === 'next' && story && currentPage < maxPage) {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        
        if (newPage === story.pages.length) {
          trackStoryCompleted(story.id);
        }
      } else if (direction === 'prev' && currentPage > -1) {
        setCurrentPage(currentPage - 1);
      }
      setIsFlipping(false);
    }, 400);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `הסיפור של ${story?.child_name}`,
        text: "ראו את הסיפור המדהים שיצרתי!",
        url: window.location.href,
      });
    } catch {
      toast({
        title: "הקישור הועתק!",
        description: "תוכלו לשתף אותו עם חברים",
      });
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDrawingOpen = () => {
    trackFeatureUsed('drawing', story?.id);
    setIsDrawingMode(true);
  };

  const handleEditClick = () => {
    setIsEditingPage(true);
  };

  const handleEditSave = async (newText: string) => {
    setStory((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === page?.id ? { ...p, text: newText } : p
        ),
      };
    });
  };

  const handleAddNikud = async () => {
    if (!page?.text || !page?.id) return;
    
    trackFeatureUsed('nikud', story?.id);
    const nikudText = await addNikud(page.text);
    
    if (nikudText) {
      const { error } = await supabase
        .from('story_pages')
        .update({ text: nikudText })
        .eq('id', page.id);

      if (error) {
        toast({ title: 'שגיאה בשמירת הניקוד', variant: 'destructive' });
        return;
      }

      setStory((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((p) =>
            p.id === page.id ? { ...p, text: nikudText } : p
          ),
        };
      });

      toast({ title: 'הניקוד נוסף ונשמר בהצלחה' });
    } else {
      toast({ title: 'שגיאה בהוספת ניקוד', variant: 'destructive' });
    }
  };

  const handleCreateDigitalBook = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowDedicationDialog(true);
  };

  const handleSaveDedication = async (dedication: string) => {
    if (!story || !user) return;
    
    setIsCreatingDigitalBook(true);
    
    try {
      const { data: existing } = await supabase
        .from('digital_books')
        .select('id, share_token')
        .eq('story_id', story.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('digital_books')
          .update({ 
            dedication_text: dedication || null,
            is_public: true 
          })
          .eq('id', existing.id);
        
        setShowDedicationDialog(false);
        navigate(`/flipbook/${existing.id}`);
      } else {
        const { data: newBook, error } = await supabase
          .from('digital_books')
          .insert({
            story_id: story.id,
            user_id: user.id,
            dedication_text: dedication || null,
            is_public: true,
          })
          .select()
          .single();

        if (error) throw error;
        
        setShowDedicationDialog(false);
        navigate(`/flipbook/${newBook.id}`);
      }
      
      toast({ title: 'הספרון נוצר בהצלחה!' });
    } catch (error) {
      console.error('Error creating digital book:', error);
      toast({ 
        title: 'שגיאה ביצירת הספרון', 
        variant: 'destructive' 
      });
    } finally {
      setIsCreatingDigitalBook(false);
    }
  };

  const handleRateStory = () => {
    toast({ title: 'תודה! דירוג הסיפור יתווסף בקרוב' });
  };

  const handleReportIssue = () => {
    toast({ title: 'תודה על הדיווח! נבדוק את הנושא' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#E8D5C4] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin" />
            <BookOpen className="absolute inset-0 m-auto w-8 h-8 text-[#8B5A2B]" />
          </div>
          <p className="text-[#5D3A1A] font-medium text-lg">פותחים את הספר...</p>
        </div>
      </div>
    );
  }

  if (!story || story.pages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#E8D5C4] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl font-bold text-[#5D3A1A]">הסיפור לא נמצא</p>
          <Button onClick={() => navigate("/")} className="bg-[#8B5A2B] hover:bg-[#6B4423]">
            <Home className="w-4 h-4 ml-2" />
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  const isCoverPage = currentPage === -1;
  const isEndPage = currentPage === story.pages.length;
  const page = (!isCoverPage && !isEndPage) ? story.pages[currentPage] : null;
  const currentFontSize = FONT_SIZES[fontSizeIndex];
  const showPageActions = !isCoverPage && !isEndPage && page !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8D5C4] to-[#D4C4B0] flex flex-col" dir="rtl">
      <OfflineIndicator isOnline={isOnline} />
      
      {/* Header */}
      <BookHeader
        onBack={() => navigate("/library")}
        onShare={handleShare}
        onDownload={() => setShowPdfFormatDialog(true)}
        onDigitalBook={handleCreateDigitalBook}
        onToggleFontSize={() => setFontSizeIndex((fontSizeIndex + 1) % FONT_SIZES.length)}
        onEdit={showPageActions ? handleEditClick : undefined}
        onAddNikud={showPageActions ? handleAddNikud : undefined}
        onDraw={showPageActions ? handleDrawingOpen : undefined}
        onRate={handleRateStory}
        onReport={handleReportIssue}
        fontSizeLabel={currentFontSize.label}
        isExporting={isExporting}
        isAddingNikud={isAddingNikud}
        showPageActions={showPageActions}
      />

      {/* Book Container with Swipe Support */}
      <main 
        className="flex-1 flex items-center justify-center px-4 py-6 md:px-8 md:py-8 lg:px-16 touch-pan-y"
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchMove={swipeHandlers.onTouchMove}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        <div className="relative w-full">
          <BookFrame isFlipping={isFlipping} flipDirection={flipDirection}>
            {/* Navigation Arrows on Book Frame */}
            <NavigationArrows
              onPrev={() => handlePageChange('prev')}
              onNext={() => handlePageChange('next')}
              canGoPrev={currentPage > -1}
              canGoNext={story !== null && currentPage < story.pages.length}
              isFlipping={isFlipping}
            />
            
            {isCoverPage ? (
              /* Cover Page - RTL: Illustration on RIGHT, Title on LEFT */
              <div className="min-h-[70vh] md:min-h-[75vh] flex flex-col md:flex-row-reverse">
                {/* Illustration Page - Always on RIGHT for RTL */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 border-b md:border-b-0 md:border-r-2 border-[#D4A574]/30 bg-gradient-to-br from-[#FFFBF5] to-[#F5E6D3]">
                  {story.pages[0]?.illustration_url ? (
                    <div className="w-full max-w-sm mx-auto">
                      <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-[#D4A574] transform hover:scale-[1.02] transition-transform duration-300">
                        <img
                          src={story.pages[0].illustration_url}
                          alt=""
                          className="w-full aspect-[4/5] object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm mx-auto">
                      <div className="rounded-2xl border-4 border-dashed border-[#D4A574]/50 aspect-[4/5] flex items-center justify-center bg-[#F5E6D3]/50">
                        <div className="text-center text-[#A08060]">
                          <BookOpen className="w-16 h-16 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">טוען איור...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Title Page - On LEFT for RTL */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center bg-gradient-to-bl from-[#FFFBF5] to-[#FAF3E8]">
                  <div className="space-y-5">
                    {/* Large child-friendly title */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#5D3A1A] leading-tight" style={{ fontFamily: "'Heebo', 'Comic Sans MS', cursive, sans-serif" }}>
                      הסיפור של
                      <br />
                      <span className="text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4] bg-clip-text text-transparent">
                        {story.child_name}
                      </span>
                    </h1>
                    
                    {/* Decorative divider */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-16 h-1 bg-gradient-to-r from-transparent to-[#D4A574] rounded-full" />
                      <span className="text-2xl">✨</span>
                      <div className="w-16 h-1 bg-gradient-to-l from-transparent to-[#D4A574] rounded-full" />
                    </div>
                    
                    {/* Topic */}
                    <p className="text-lg md:text-xl text-[#6B4423] max-w-xs mx-auto font-medium">
                      {story.topic}
                    </p>
                  </div>
                  
                  {/* Colorful, prominent button */}
                  <Button 
                    size="lg"
                    onClick={() => handlePageChange('next')}
                    className="mt-10 bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4] hover:from-[#FF5252] hover:via-[#FFD93D] hover:to-[#26A69A] text-[#2D3436] font-bold px-10 py-7 text-xl rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-white/50"
                  >
                    <BookOpen className="w-6 h-6 ml-3" />
                    פתח את הספר 📖
                  </Button>
                </div>
              </div>
            ) : isEndPage ? (
              /* End Page */
              <div className="min-h-[70vh] md:min-h-[75vh] flex flex-col items-center justify-center p-8 text-center">
                {story.pages[0]?.illustration_url && (
                  <div className="w-full max-w-xs mx-auto mb-6">
                    <div className="rounded-xl overflow-hidden shadow-xl border-4 border-[#D4A574]">
                      <img
                        src={story.pages[0].illustration_url}
                        alt=""
                        className="w-full aspect-[3/4] object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <p className="text-3xl md:text-4xl font-bold text-[#5D3A1A]">
                    ✦ סוף ✦
                  </p>
                  <p className="text-xl text-[#6B4423]">
                    תודה שקראתם!
                  </p>
                  <p className="text-base text-[#8B7355]">
                    הסיפור של {story.child_name}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentPage(-1)}
                    className="border-2 border-[#8B5A2B] text-[#8B5A2B] hover:bg-[#8B5A2B]/10 px-6 py-5 rounded-full"
                  >
                    <BookOpen className="w-5 h-5 ml-2" />
                    קרא שוב
                  </Button>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/library')}
                    className="bg-[#8B5A2B] hover:bg-[#6B4423] text-white px-6 py-5 rounded-full"
                  >
                    <Home className="w-5 h-5 ml-2" />
                    לספרייה
                  </Button>
                </div>
              </div>
            ) : (
              /* Story Pages - Dual Page Layout with Illustrations */
              <div className={cn(
                "min-h-[70vh] md:min-h-[75vh] flex",
                isMobile ? "flex-col" : "flex-row"
              )}>
                {/* Right Page (Illustration) - First in RTL - Disney Pixar Style */}
                <div className={cn(
                  "flex-1 flex flex-col items-center justify-center p-4 md:p-6",
                  "bg-gradient-to-br from-[#FFFBF5] to-[#F5E6D3]",
                  isMobile ? "border-b-2" : "border-l-2",
                  "border-[#D4A574]/30"
                )}>
                  {page?.illustration_url ? (
                    <div className="relative w-full max-w-md mx-auto">
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#E8D5C4]">
                        <img
                          src={page.illustration_url}
                          alt=""
                          className="w-full aspect-[4/5] object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-md mx-auto">
                      <div className="rounded-2xl border-4 border-dashed border-[#D4A574]/50 aspect-[4/5] flex items-center justify-center bg-[#F5E6D3]/50">
                        <div className="text-center text-[#A08060]">
                          <BookOpen className="w-16 h-16 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">טוען איור...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Left Page (Text) - Second in RTL */}
                <div className={cn(
                  "flex-1 flex flex-col justify-center p-6 md:p-8 lg:p-10",
                  "bg-gradient-to-bl from-[#FFFBF5] to-[#FAF3E8]"
                )}>
                  <div className="flex-1 flex items-center justify-center">
                    <p 
                      className={cn(
                        "leading-loose text-[#3D2914] text-right font-medium transition-all",
                        currentFontSize.size
                      )} 
                      dir="rtl"
                    >
                      {page?.text}
                    </p>
                  </div>
                  
                  {/* Page number */}
                  {page?.page_number !== undefined && (
                    <div className="text-center pt-4 border-t border-[#D4A574]/20 mt-4">
                      <span className="text-sm text-[#8B7355] font-serif italic">
                        עמוד {page.page_number} מתוך {story.pages.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </BookFrame>
          
          {/* Bottom Navigation Buttons - Clear Back/Next */}
          {!isCoverPage && !isEndPage && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handlePageChange('prev')}
                disabled={currentPage <= -1 || isFlipping}
                className="rounded-full border-2 border-[#8B5A2B] text-[#8B5A2B] hover:bg-[#8B5A2B]/10 px-8 py-5 font-bold"
              >
                חזרה
              </Button>
              
              <Button
                size="lg"
                onClick={() => handlePageChange('next')}
                disabled={!story || currentPage >= story.pages.length || isFlipping}
                className="rounded-full bg-[#8B5A2B] hover:bg-[#6B4423] text-white px-8 py-5 font-bold"
              >
                הבא
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Drawing Canvas */}
      <DrawingCanvas isOpen={isDrawingMode} onClose={() => setIsDrawingMode(false)} />

      {/* Edit Page Dialog */}
      {page && storyId && (
        <EditPageDialog
          open={isEditingPage}
          onOpenChange={setIsEditingPage}
          pageId={page.id}
          storyId={storyId}
          pageNumber={page.page_number}
          totalPages={story.pages.length}
          text={page.text}
          illustrationUrl={page.illustration_url || undefined}
          onUpdate={handleEditSave}
        />
      )}

      {/* Dedication Dialog */}
      <DedicationDialog
        open={showDedicationDialog}
        onOpenChange={setShowDedicationDialog}
        onSave={handleSaveDedication}
        childName={story.child_name}
        isLoading={isCreatingDigitalBook}
      />

      {/* PDF Format Selection Dialog */}
      <AlertDialog open={showPdfFormatDialog} onOpenChange={setShowPdfFormatDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>בחר פורמט PDF</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              בחר את סגנון ה-PDF שברצונך להוריד
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-1 border-2 hover:border-[#8B5A2B] hover:bg-[#8B5A2B]/5"
              onClick={() => {
                setShowPdfFormatDialog(false);
                story && exportToPdf(story, 'portrait');
              }}
            >
              <FileDown className="w-6 h-6" />
              <span className="font-bold">עמוד רגיל (לאורך)</span>
              <span className="text-xs text-muted-foreground">תמונה וטקסט באותו עמוד</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-1 border-2 hover:border-[#8B5A2B] hover:bg-[#8B5A2B]/5"
              onClick={() => {
                setShowPdfFormatDialog(false);
                story && exportToPdf(story, 'landscape-book');
              }}
            >
              <BookOpen className="w-6 h-6" />
              <span className="font-bold">ספר פתוח (לרוחב)</span>
              <span className="text-xs text-muted-foreground">תמונה בצד אחד, טקסט בצד השני</span>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StoryViewer;
