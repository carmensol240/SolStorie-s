import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, BookOpen, Sparkles, Palette, Wand2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DrawingCanvas } from "@/components/ui/drawing-canvas";
import { SignedImage } from "@/components/ui/signed-image";
import OfflineIndicator from "@/components/ui/offline-indicator";
import EditPageDialog from "@/components/story/edit-page-dialog";
import DedicationDialog from "@/components/story/DedicationDialog";
import { GenderSwapDialog } from "@/components/story/GenderSwapDialog";
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
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useAccessibility } from "@/hooks/use-accessibility";

import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipe } from "@/hooks/use-swipe";
import { useSignedUrls } from "@/hooks/use-signed-urls";
import { BookFrame, BookPage, BookHeader, NavigationArrows } from "@/components/story/book-frame";
import { FileDown } from "lucide-react";
import PdfFeaturePopup from "@/components/story/PdfFeaturePopup";

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
  child_gender?: string;
  topic: string;
  pages: StoryPage[];
  generation_status?: string;
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
  const [generationStatus, setGenerationStatus] = useState<string>('ready');
  const [illustrationProgress, setIllustrationProgress] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  
  const [showDedicationDialog, setShowDedicationDialog] = useState(false);
  const [isCreatingDigitalBook, setIsCreatingDigitalBook] = useState(false);
  const [showPdfFormatDialog, setShowPdfFormatDialog] = useState(false);
  const [showGenderSwapDialog, setShowGenderSwapDialog] = useState(false);
  
  const { trackStoryStarted, trackStoryCompleted, trackPageViewed, trackFeatureUsed } = useAnalytics();
  const { isOnline, cacheStory, getCachedStory } = useOfflineStorage();
  const { settings } = useSettings();
  const { exportToPdf, isExporting } = usePdfExport();
  const { addNikud, isLoading: isAddingNikud } = useNikud();
  const { startReading, stopReading, isReading, isLoading: isLoadingAudio } = useTextToSpeech();
  const { audioSupport } = useAccessibility();
  const { getSignedUrl } = useSignedUrls();
  
  const { user } = useAuth();
  const hasTrackedStart = useRef(false);
  

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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
      
      // Pre-fetch next image for smooth transitions
      if (currentPage < story.pages.length - 1) {
        const nextPage = story.pages[currentPage + 1];
        if (nextPage?.illustration_url) {
          const signedUrl = getSignedUrl(nextPage.illustration_url);
          if (signedUrl) {
            const img = new Image();
            img.src = signedUrl;
          }
        }
      }
    }
  }, [currentPage, story?.id, getSignedUrl]);

  // Poll for illustration updates when status is generating_illustrations
  const pollForUpdates = useCallback(async () => {
    if (!storyId) return;

    try {
      // Check story status
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select("generation_status")
        .eq("id", storyId)
        .maybeSingle();

      if (storyError || !storyData) return;

      const status = (storyData as any).generation_status || 'ready';
      setGenerationStatus(status);

      // If still generating, check pages for updates
      if (status === 'generating_illustrations') {
        const { data: pagesData } = await supabase
          .from("story_pages")
          .select("*")
          .eq("story_id", storyId)
          .order("page_number", { ascending: true });

        if (pagesData) {
          const pagesWithIllustrations = pagesData.filter(p => p.illustration_url).length;
          const progress = Math.round((pagesWithIllustrations / pagesData.length) * 100);
          setIllustrationProgress(progress);
          setStory(prev => prev ? { ...prev, pages: pagesData } : null);
        }

        // 60-second timeout: allow viewing even if illustrations aren't done
        const elapsed = pollingStartTimeRef.current
          ? (Date.now() - pollingStartTimeRef.current) / 1000
          : 0;
        if (elapsed >= 60) {
          console.log("⏱️ 60s timeout reached - allowing story access without all illustrations");
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setGenerationStatus('ready');
          setStory(prev => prev ? { ...prev, generation_status: 'ready' } : null);
        }
      } else if (status === 'ready') {
        // Stop polling when done
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Fetch final pages
        const { data: pagesData } = await supabase
          .from("story_pages")
          .select("*")
          .eq("story_id", storyId)
          .order("page_number", { ascending: true });

        if (pagesData) {
          setStory(prev => prev ? { ...prev, pages: pagesData, generation_status: 'ready' } : null);
          setIllustrationProgress(100);
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, [storyId]);

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

      // Check generation status
      const status = (storyData as any).generation_status || 'ready';
      setGenerationStatus(status);

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

      const storyObj: Story = {
        id: storyData.id,
        child_name: storyData.child_name,
        child_gender: (storyData as any).child_gender || 'male',
        topic: storyData.topic,
        pages: pagesData || [],
        generation_status: status,
      };
      
      setStory(storyObj);

      // Calculate initial progress
      if (pagesData && pagesData.length > 0) {
        const pagesWithIllustrations = pagesData.filter(p => p.illustration_url).length;
        const progress = Math.round((pagesWithIllustrations / pagesData.length) * 100);
        setIllustrationProgress(progress);
      }

      // Start polling if illustrations are still generating
      if (status === 'generating_illustrations' && !pollingIntervalRef.current) {
        console.log("Starting polling for illustration updates...");
        pollingStartTimeRef.current = Date.now();
        pollingIntervalRef.current = setInterval(pollForUpdates, 3000);
      }
      
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
    
    // Soft fade transition (300ms fade out, change page, 300ms fade in)
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
    }, 300); // Shorter duration for gentle fade transition
  };

  // Swipe gesture handlers for page navigation - must be after handlePageChange is defined
  const { onTouchStart, onTouchMove, onTouchEnd, swipeOffset } = useSwipe({
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
  
  // Create swipeHandlers object for spreading onto elements
  const swipeHandlers = { onTouchStart, onTouchMove, onTouchEnd };

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
      <div className="min-h-screen bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3] flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <BookOpen className="absolute inset-0 m-auto w-8 h-8 text-purple-600" />
          </div>
          <p className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent font-bold text-lg">פותחים את הספר...</p>
        </div>
      </div>
    );
  }

  // Show special loading state when illustrations are being generated
  if (generationStatus === 'generating_illustrations' && story) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF3E8] to-[#F5E6D3] flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-8 max-w-md mx-auto">
          {/* Animated Icon */}
          <div className="relative">
            <div className="w-28 h-28 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 rounded-full flex items-center justify-center shadow-lg mx-auto">
              <div className="relative">
                <Palette className="w-12 h-12 text-pink-500 animate-bounce" />
                <Wand2 
                  className="absolute -top-2 -right-4 w-8 h-8 text-purple-600 animate-wiggle"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))' }}
                />
              </div>
            </div>
            
            {/* Floating sparkles */}
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute w-4 h-4 text-orange-400 animate-pulse"
                  style={{
                    top: `${15 + Math.random() * 70}%`,
                    left: `${15 + Math.random() * 70}%`,
                    animationDelay: `${i * 0.2}s`,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              מציירים את האיורים...
            </h2>
            <p className="text-purple-700/70">
              הסיפור של {story.child_name} כבר מוכן!
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs mx-auto space-y-2">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-purple-100">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 transition-all duration-500"
                style={{ width: `${illustrationProgress}%` }}
              />
            </div>
            <p className="text-sm text-purple-600 font-medium">
              {illustrationProgress}% מהאיורים מוכנים
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => setCurrentPage(-1)}
              className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-bold px-8 py-6 text-lg rounded-full shadow-xl"
            >
              <BookOpen className="w-5 h-5 ml-2" />
              התחילו לקרוא עכשיו!
            </Button>
            <p className="text-sm text-purple-500">
              האיורים יופיעו בזמן שתקראו ✨
            </p>
          </div>

          {/* Tip */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-purple-200 max-w-xs mx-auto">
            <p className="text-sm text-purple-700">
              💡 <strong className="text-purple-800">טיפ:</strong> אפשר להתחיל לקרוא! האיורים יופיעו אוטומטית כשהם מוכנים.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!story || story.pages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">הסיפור לא נמצא</p>
          <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500">
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 flex flex-col" dir="rtl">
      <OfflineIndicator isOnline={isOnline} />
      
      {/* Header - Clean toolbar with essentials only */}
      <BookHeader
        onBack={() => navigate("/library")}
        onShare={handleShare}
        onDownload={() => setShowPdfFormatDialog(true)}
        onToggleFontSize={() => setFontSizeIndex((fontSizeIndex + 1) % FONT_SIZES.length)}
        onEdit={showPageActions ? handleEditClick : undefined}
        onAddNikud={showPageActions ? handleAddNikud : undefined}
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
        <div 
          className="relative w-full"
          style={{ 
            transform: `translateX(${swipeOffset}px)`,
            transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
          }}
        >
          {/* Navigation Arrows - Outside BookFrame so they aren't clipped */}
          <NavigationArrows
            onPrev={() => handlePageChange('prev')}
            onNext={() => handlePageChange('next')}
            canGoPrev={currentPage > -1}
            canGoNext={story !== null && currentPage < story.pages.length}
            isFlipping={isFlipping}
          />
          
          <BookFrame isFlipping={isFlipping} flipDirection={flipDirection}>
            
            {isCoverPage ? (
              /* Cover Page - RTL: Illustration on RIGHT, Title on LEFT */
              <div className="min-h-[70vh] md:min-h-[75vh] flex flex-col md:flex-row-reverse">
                {/* Illustration Page - Always on RIGHT for RTL */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 border-b md:border-b-0 md:border-r-2 border-[#D4A574]/30 bg-gradient-to-br from-[#FFFBF5] to-[#F5E6D3]">
                  {story.pages[0]?.illustration_url ? (
                    <div className="w-full max-w-sm mx-auto">
                      <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-[#D4A574] transform hover:scale-[1.02] transition-transform duration-300">
                        <SignedImage
                          src={story.pages[0].illustration_url}
                          storyId={story.id}
                          alt={`עטיפת הסיפור: ${story.child_name} ב${story.topic}`}
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
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-purple-900 leading-tight" style={{ fontFamily: "'Heebo', 'Comic Sans MS', cursive, sans-serif" }}>
                      הסיפור של
                      <br />
                      <span className="text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                        {story.child_name}
                      </span>
                    </h1>
                    
                    {/* Decorative divider */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-16 h-1 bg-gradient-to-r from-transparent to-purple-400 rounded-full" />
                      <span className="text-2xl">✨</span>
                      <div className="w-16 h-1 bg-gradient-to-l from-transparent to-purple-400 rounded-full" />
                    </div>
                    
                    {/* Topic */}
                    <p className="text-lg md:text-xl text-purple-700 max-w-xs mx-auto font-medium">
                      {story.topic}
                    </p>
                  </div>
                  
                  {/* Colorful, prominent button */}
                  <Button 
                    size="lg"
                    onClick={() => handlePageChange('next')}
                    className="mt-10 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-bold px-10 py-7 text-xl rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-white/50"
                  >
                    <BookOpen className="w-6 h-6 ml-3" />
                    פתח את הספר 📖
                  </Button>
                </div>
              </div>
            ) : isEndPage ? (
              /* End Page - Uses last page's illustration */
              <div className="min-h-[70vh] md:min-h-[75vh] flex flex-col items-center justify-center p-8 text-center">
                {story.pages[story.pages.length - 1]?.illustration_url && (
                  <div className="w-full max-w-xs mx-auto mb-6">
                    <div className="rounded-xl overflow-hidden shadow-xl border-4 border-[#D4A574]">
                      <SignedImage
                        src={story.pages[story.pages.length - 1].illustration_url}
                        storyId={story.id}
                        alt={`סיום הסיפור של ${story.child_name}`}
                        className="w-full aspect-[3/4] object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                    ✦ סוף ✦
                  </p>
                  <p className="text-xl text-purple-700">
                    תודה שקראתם!
                  </p>
                  <p className="text-base text-purple-500">
                    הסיפור של {story.child_name}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentPage(-1)}
                    className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 px-6 py-5 rounded-full"
                  >
                    <span className="ml-2"><BookOpen className="w-5 h-5" /></span>
                    קרא שוב
                  </Button>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/library')}
                    className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white px-6 py-5 rounded-full"
                  >
                    <span className="ml-2"><Home className="w-5 h-5" /></span>
                    לספרייה
                  </Button>
                </div>

                {/* Gender Swap Button */}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowGenderSwapDialog(true)}
                  className="mt-4 text-purple-500 hover:text-purple-700 text-sm"
                >
                  <span className="ml-1"><RefreshCw className="w-4 h-4" /></span>
                  התבלבלתם במגדר? לחצו לתיקון מהיר
                </Button>
              </div>
            ) : (
              /* Story Pages - Dual Page Layout with Illustrations */
              <div className={cn(
                "min-h-[70vh] md:min-h-[75vh] flex",
                isMobile ? "flex-col" : "flex-row"
              )}>
                {/* Right Page (Illustration) - First in RTL - Disney Pixar Style */}
                <div className={cn(
                  "flex-1 flex flex-col items-center justify-center p-6 md:p-8 lg:p-10",
                  "bg-gradient-to-br from-[#FFFBF5] to-[#F5E6D3]",
                  isMobile ? "border-b-2" : "border-l-2",
                  "border-[#D4A574]/30"
                )}>
                  {page?.illustration_url ? (
                    <div className="relative w-full max-w-md mx-auto">
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#E8D5C4]">
                        <SignedImage
                          src={page.illustration_url}
                          storyId={story.id}
                          alt={`איור לעמוד ${page.page_number}: ${page.text?.substring(0, 60) || 'איור מהסיפור'}...`}
                          className="w-full aspect-[4/5] object-cover"
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
                
                {/* Left Page (Text) - Second in RTL - Better typography */}
                <div className={cn(
                  "flex-1 flex flex-col justify-center p-8 md:p-10 lg:p-12",
                  "bg-gradient-to-bl from-[#FFFBF5] to-[#FAF3E8]"
                )}>
                  <div className="flex-1 flex items-center justify-center px-4 md:px-6">
                    <p 
                      className={cn(
                        "text-[#3D2914] text-right font-medium transition-all",
                        currentFontSize.size
                      )} 
                      style={{ lineHeight: '1.7' }}
                      dir="rtl"
                    >
                      {page?.text}
                    </p>
                  </div>
                  
                  {/* Discreet page indicator - small gray text at bottom center */}
                  {page?.page_number !== undefined && (
                    <div className="text-center pt-6 mt-auto">
                      <span className="text-xs text-gray-400 font-light">
                        {page.page_number} / {story.pages.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </BookFrame>
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

      {/* Gender Swap Dialog */}
      {storyId && story?.child_gender && (
        <GenderSwapDialog
          open={showGenderSwapDialog}
          onOpenChange={setShowGenderSwapDialog}
          storyId={storyId}
          currentGender={story.child_gender as "male" | "female"}
          onSuccess={fetchStory}
        />
      )}

      {/* PDF Feature Popup - one-time per user */}
      <PdfFeaturePopup userId={user?.id} />
    </div>
  );
};

export default StoryViewer;
