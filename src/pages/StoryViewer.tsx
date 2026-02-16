import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, BookOpen, Sparkles, Palette, Wand2, RefreshCw, Loader2, ImageOff, Volume2, Square } from "lucide-react";
import { MissingIllustrationPrompt } from "@/components/story/MissingIllustrationPrompt";
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
  AlertDialogAction,
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
import { useStoryEdit } from "@/hooks/use-story-edit";
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
  language?: string;
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
  const [showNikud, setShowNikud] = useState(true);
  const [generationStatus, setGenerationStatus] = useState<string>('ready');
  const [illustrationProgress, setIllustrationProgress] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const [retryingPageId, setRetryingPageId] = useState<string | null>(null);
  const [showPromptInput, setShowPromptInput] = useState<string | null>(null); // pageId or null
  const [customPromptText, setCustomPromptText] = useState('');
  
  const [showDedicationDialog, setShowDedicationDialog] = useState(false);
  const [isCreatingDigitalBook, setIsCreatingDigitalBook] = useState(false);
  const [showPdfFormatDialog, setShowPdfFormatDialog] = useState(false);
  const [showGenderSwapDialog, setShowGenderSwapDialog] = useState(false);
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);
  
  const { trackStoryStarted, trackStoryCompleted, trackPageViewed, trackFeatureUsed } = useAnalytics();
  const { isOnline, cacheStory, getCachedStory } = useOfflineStorage();
  const { settings } = useSettings();
  const { exportToPdf, isExporting } = usePdfExport();
  const { addNikud, isLoading: isAddingNikud } = useNikud();
  const { getSignedUrl } = useSignedUrls();
  
  const { user } = useAuth();
  const { fetchEditCount, editCount, freeEditsRemaining } = useStoryEdit(storyId || '');
  const hasTrackedStart = useRef(false);
  const { audioSupport } = useAccessibility();
  const { startReading, stopReading, isReading, isLoading: isTtsLoading } = useTextToSpeech();

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
        language: (storyData as any).language || 'he',
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

  // Page change is now handled by handleSpreadChange defined later
  // Keep this for legacy compatibility but it's no longer the primary navigation
  const handlePageChange = (direction: 'next' | 'prev') => {
    // This will be overridden by spread navigation in the render
    if (isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);
    setTimeout(() => {
      if (direction === 'next') {
        setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev') {
        setCurrentPage(prev => prev - 1);
      }
      setIsFlipping(false);
    }, 300);
  };

  // Swipe gesture handlers for spread navigation
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
    onSwipeLeft: () => {
      // In RTL, swipe left = next spread
      handlePageChange('next');
    },
    onSwipeRight: () => {
      // In RTL, swipe right = prev spread
      handlePageChange('prev');
    },
    threshold: 50,
  });
  
  // Create swipeHandlers object for spreading onto elements
  const swipeHandlers = { onTouchStart, onTouchMove, onTouchEnd };

  const handleShare = async () => {
    if (!story) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publicUrl = `${supabaseUrl}/functions/v1/og-story-meta?storyId=${story.id}`;
      const title = `✨ ${story.topic} ✨`;
      const text = `📚 הסיפור של ${story.child_name} – נוצר באהבה באפליקציית SolStorie's™`;

      if (navigator.share) {
        await navigator.share({ title, text, url: publicUrl });
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}\n${publicUrl}`);
        toast({ title: 'הקישור הועתק! 📋', description: 'כעת ניתן להדביק אותו בוואטסאפ או בכל מקום אחר' });
      }
    } catch (error: any) {
      // User cancelled share dialog - not an error
      if (error?.name === 'AbortError') return;
      console.error('Error sharing story:', error);
      // Fallback to clipboard
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const publicUrl = `${supabaseUrl}/functions/v1/og-story-meta?storyId=${story.id}`;
        await navigator.clipboard.writeText(publicUrl);
        toast({ title: 'הקישור הועתק! 📋', description: 'כעת ניתן להדביק אותו בוואטסאפ' });
      } catch {
        toast({ title: 'שגיאה בשיתוף', description: 'נסו שוב מאוחר יותר', variant: 'destructive' });
      }
    }
  };

  const handleDrawingOpen = () => {
    trackFeatureUsed('drawing', story?.id);
    setIsDrawingMode(true);
  };

  const handleEditClick = () => {
    if (storyId) fetchEditCount(storyId);
    setShowEditConfirmDialog(true);
  };

  const handleEditConfirmed = () => {
    setShowEditConfirmDialog(false);
    setIsEditingPage(true);
  };

  const handleEditSave = async (newText: string, editedPageId?: string) => {
    const targetId = editedPageId || page?.id;
    setStory((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === targetId ? { ...p, text: newText } : p
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

  const handleRetryIllustration = async (pageId: string, customPrompt?: string) => {
    if (!storyId || retryingPageId) return;
    
    setRetryingPageId(pageId);
    try {
      const { data, error } = await supabase.functions.invoke('retry-illustration', {
        body: { storyId, pageId, customPrompt: customPrompt || undefined },
      });

      if (error) throw error;

      if (data?.illustrationUrl) {
        setStory(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map(p => 
              p.id === pageId ? { ...p, illustration_url: data.illustrationUrl } : p
            ),
          };
        });
        setShowPromptInput(null);
        setCustomPromptText('');
        toast({ title: "האיור נוצר בהצלחה! 🎨" });
      } else {
        throw new Error("No illustration returned");
      }
    } catch (error) {
      console.error("Retry illustration error:", error);
      toast({
        variant: "destructive",
        title: "שגיאה ביצירת האיור",
        description: "נסו שוב מאוחר יותר",
      });
    } finally {
      setRetryingPageId(null);
    }
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
  const isEndPage = currentPage >= Math.ceil(story.pages.length / 2);
  
  // Build spreads: group pages into pairs, each spread has 1 illustration + 2 text blocks
  const spreads: { illustration: string | null; illustrationPageId: string | null; pages: StoryPage[] }[] = [];
  for (let i = 0; i < story.pages.length; i += 2) {
    const firstPage = story.pages[i];
    const secondPage = story.pages[i + 1] || null;
    // The illustration comes from the first page of each pair (odd page_number)
    const illustrationUrl = firstPage?.illustration_url || secondPage?.illustration_url || null;
    const illustrationPageId = firstPage?.illustration_url ? firstPage.id : (secondPage?.illustration_url ? secondPage.id : firstPage?.id || null);
    const pagesInSpread = secondPage ? [firstPage, secondPage] : [firstPage];
    spreads.push({ illustration: illustrationUrl, illustrationPageId, pages: pagesInSpread });
  }
  
  const currentSpread = (!isCoverPage && !isEndPage && currentPage >= 0) ? spreads[currentPage] : null;
  const page = currentSpread?.pages[0] || null; // For edit/nikud actions, use first page
  const currentFontSize = FONT_SIZES[fontSizeIndex];
  const showPageActions = !isCoverPage && !isEndPage && currentSpread !== null;
  
  // Calculate page numbers for display
  const spreadStartPage = currentPage >= 0 ? currentPage * 2 + 1 : 0;
  const spreadEndPage = currentSpread ? spreadStartPage + currentSpread.pages.length - 1 : 0;

  // Override navigation for spread-based stepping
  const handleSpreadChange = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
    
    const maxSpread = spreads.length;
    
    if (direction === 'next' && currentPage >= maxSpread) return;
    if (direction === 'prev' && currentPage <= -1) return;
    
    setFlipDirection(direction);
    setIsFlipping(true);
    
    setTimeout(() => {
      if (direction === 'next' && currentPage < maxSpread) {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        
        if (newPage >= maxSpread) {
          trackStoryCompleted(story.id);
        }
      } else if (direction === 'prev' && currentPage > -1) {
        setCurrentPage(currentPage - 1);
      }
      setIsFlipping(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 flex flex-col" dir="rtl">
      <OfflineIndicator isOnline={isOnline} />
      
      {/* Header */}
      <BookHeader
        onBack={() => navigate("/library")}
        onShare={handleShare}
        onDownload={() => setShowPdfFormatDialog(true)}
        onToggleFontSize={() => setFontSizeIndex((fontSizeIndex + 1) % FONT_SIZES.length)}
        onEdit={showPageActions ? handleEditClick : undefined}
        onAddNikud={showPageActions ? handleAddNikud : undefined}
        onReport={handleReportIssue}
        onToggleNikud={() => setShowNikud(prev => !prev)}
        showNikud={showNikud}
        fontSizeLabel={currentFontSize.label}
        isExporting={isExporting}
        isAddingNikud={isAddingNikud}
        showPageActions={showPageActions}
      />

      {/* Read Aloud Button - accessibility feature */}
      {(audioSupport || story?.language === 'en') && showPageActions && currentSpread && (
        <div className="fixed bottom-24 left-4 z-50">
          <Button
            size="icon"
            onClick={() => {
              if (isReading) {
                stopReading();
              } else {
                const allText = currentSpread.pages.map(p => p.text).join('\n');
                startReading(allText, story?.language || 'he');
              }
            }}
            disabled={isTtsLoading}
            className={cn(
              "h-12 w-12 rounded-full shadow-lg border-0 transition-all",
              isReading
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-green-500 hover:bg-green-600",
              isTtsLoading && "opacity-70"
            )}
            aria-label={isReading ? "עצור הקראה" : "הקרא בקול"}
          >
            {isTtsLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : isReading ? (
              <Square className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </Button>
        </div>
      )}


      {/* Book Container with Swipe Support */}
      <main 
        className="flex-1 flex items-center justify-center px-4 py-6 md:px-8 md:py-8 lg:px-16 touch-pan-y"
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchMove={swipeHandlers.onTouchMove}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        <div className="relative w-full">
          {/* Navigation Arrows */}
          <NavigationArrows
            onPrev={() => handleSpreadChange('prev')}
            onNext={() => handleSpreadChange('next')}
            canGoPrev={currentPage > -1}
            canGoNext={currentPage < spreads.length}
            isFlipping={isFlipping}
          />
          
          <BookFrame isFlipping={isFlipping} flipDirection={flipDirection}>
            
            {isCoverPage ? (
              /* Cover Page - RTL: Illustration on RIGHT, Title on LEFT */
              <div className="min-h-[70vh] md:min-h-[75vh] flex flex-col md:flex-row-reverse">
                {/* Illustration Page */}
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
                      <MissingIllustrationPrompt
                        pageId={story.pages[0].id}
                        isRetrying={retryingPageId === story.pages[0].id}
                        isGenerating={generationStatus !== 'ready'}
                        showPromptInput={showPromptInput === story.pages[0].id}
                        customPromptText={customPromptText}
                        onTogglePrompt={() => {
                          setShowPromptInput(showPromptInput === story.pages[0].id ? null : story.pages[0].id);
                          setCustomPromptText('');
                        }}
                        onPromptChange={setCustomPromptText}
                        onSubmit={handleRetryIllustration}
                      />
                    </div>
                  )}
                </div>
                
                {/* Title Page */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center bg-gradient-to-bl from-[#FFFBF5] to-[#FAF3E8]">
                  <div className="space-y-5">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-purple-900 leading-tight" style={{ fontFamily: "'Heebo', 'Comic Sans MS', cursive, sans-serif" }}>
                      הסיפור של
                      <br />
                      <span className="text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                        {story.child_name}
                      </span>
                    </h1>
                    
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-16 h-1 bg-gradient-to-r from-transparent to-purple-400 rounded-full" />
                      <span className="text-2xl">✨</span>
                      <div className="w-16 h-1 bg-gradient-to-l from-transparent to-purple-400 rounded-full" />
                    </div>
                    
                    <p className="text-lg md:text-xl text-purple-700 max-w-xs mx-auto font-medium">
                      {story.topic}
                    </p>
                  </div>
                  
                  <Button 
                    size="lg"
                    onClick={() => handleSpreadChange('next')}
                    className="mt-10 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-bold px-10 py-7 text-xl rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-white/50"
                  >
                    <BookOpen className="w-6 h-6 ml-3" />
                    פתח את הספר 📖
                  </Button>
                </div>
              </div>
            ) : isEndPage ? (
              /* End Page */
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
            ) : currentSpread ? (
              /* SPREAD LAYOUT: One illustration + Two text blocks */
              <div className={cn(
                "min-h-[70vh] md:min-h-[75vh] flex",
                isMobile ? "flex-col" : "flex-row-reverse"
              )}>
                {/* Illustration Side (Right in RTL desktop, Top in mobile) */}
                <div className={cn(
                  "flex flex-col items-center justify-center",
                  isMobile ? "p-4" : "flex-1 p-6 md:p-8 lg:p-10",
                  "bg-gradient-to-br from-[#FFFBF5] to-[#F5E6D3]",
                  !isMobile && "border-l-2 border-[#D4A574]/30 relative"
                )}>
                  {/* Gutter shadow effect for book spine feel (desktop only) */}
                  {!isMobile && (
                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/[0.07] via-black/[0.03] to-transparent pointer-events-none z-10" />
                  )}
                  
                  {currentSpread.illustration ? (
                    <div className="relative w-full max-w-md mx-auto">
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#E8D5C4]">
                        <SignedImage
                          src={currentSpread.illustration}
                          storyId={story.id}
                          alt={`איור לעמודים ${spreadStartPage}-${spreadEndPage}`}
                          className={cn(
                            "w-full object-cover",
                            isMobile ? "aspect-[16/10]" : "aspect-[4/5]"
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-md mx-auto">
                      <MissingIllustrationPrompt
                        pageId={currentSpread.illustrationPageId!}
                        isRetrying={retryingPageId === currentSpread.illustrationPageId}
                        isGenerating={generationStatus !== 'ready'}
                        showPromptInput={showPromptInput === currentSpread.illustrationPageId}
                        customPromptText={customPromptText}
                        onTogglePrompt={() => {
                          setShowPromptInput(showPromptInput === currentSpread.illustrationPageId ? null : currentSpread.illustrationPageId);
                          setCustomPromptText('');
                        }}
                        onPromptChange={setCustomPromptText}
                        onSubmit={handleRetryIllustration}
                        aspectClass={isMobile ? "aspect-[16/10]" : "aspect-[4/5]"}
                      />
                    </div>
                  )}
                </div>
                
                {/* Text Side (Left in RTL desktop, Bottom in mobile) - Two text blocks stacked */}
                <div className={cn(
                  "flex flex-col justify-center relative",
                  isMobile ? "p-5" : "flex-1 p-8 md:p-10 lg:p-12",
                  "bg-gradient-to-bl from-[#FFFBF5] to-[#FAF3E8]"
                )}>
                  {/* Gutter shadow on right side for book spine feel (desktop only) */}
                  {!isMobile && (
                    <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/[0.07] via-black/[0.03] to-transparent pointer-events-none z-10" />
                  )}
                  
                  <div className="flex-1 flex flex-col justify-center gap-6 md:gap-8">
                    {currentSpread.pages.map((spreadPage, idx) => (
                      <div key={spreadPage.id} className="relative">
                        {/* Subtle separator between the two text blocks */}
                        {idx > 0 && (
                          <div className="flex items-center justify-center mb-4 md:mb-6">
                            <div className="w-12 h-px bg-[#D4A574]/40" />
                            <span className="mx-3 text-[#D4A574]/60 text-xs">✦</span>
                            <div className="w-12 h-px bg-[#D4A574]/40" />
                          </div>
                        )}
                        <p 
                          className={cn(
                            "text-[#3D2914] text-right font-medium transition-all whitespace-pre-line",
                            currentFontSize.size
                          )} 
                          style={{ lineHeight: '1.8' }}
                          dir="rtl"
                        >
                          {showNikud ? spreadPage.text : spreadPage.text.replace(/[\u0591-\u05C7]/g, '')}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Read Aloud removed per brand requirements */}

                  {/* Page indicator */}
                  <div className="flex items-center justify-center pt-4 mt-auto">
                    <span className="text-xs text-gray-400 font-light">
                      {spreadStartPage}{spreadEndPage > spreadStartPage ? `-${spreadEndPage}` : ''} / {story.pages.length}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
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
          allPages={story.pages.map(p => ({
            id: p.id,
            page_number: p.page_number,
            text: p.text,
            illustration_url: p.illustration_url,
          }))}
        />
      )}

      {/* Edit Confirmation Dialog - shown before opening editor */}
      <AlertDialog open={showEditConfirmDialog} onOpenChange={setShowEditConfirmDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>אישור עריכה</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-relaxed">
              ה-AI שלנו לפעמים טועה, ולכן אנחנו מעניקים עריכות חינם בכל חבילה!
              {freeEditsRemaining > 0 ? (
                <span className="block mt-2 font-medium text-green-600">
                  נותרו לך {freeEditsRemaining} עריכות בחינם בחבילה
                </span>
              ) : (
                <span className="block mt-2 font-medium text-foreground">
                  העריכות בחינם נוצלו. כל עריכה עולה 1 קרדיט
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditConfirmed}>
              {freeEditsRemaining > 0 ? 'ערוך בחינם' : 'המשך לעריכה'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
