import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, BookOpen, Sparkles, Palette, Wand2, RefreshCw, Loader2, ImageOff, Volume2, Square, X, Star, Send, ChevronRight, ChevronLeft } from "lucide-react";
import { MissingIllustrationPrompt } from "@/components/story/MissingIllustrationPrompt";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DrawingCanvas } from "@/components/ui/drawing-canvas";
import { SignedImage } from "@/components/ui/signed-image";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";
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
// useSwipe removed - swipe navigation disabled per user request
// useSignedUrls removed - story-illustrations bucket is public
import { BookFrame, BookPage, BookHeader, NavigationArrows } from "@/components/story/book-frame";
import { FileDown } from "lucide-react";
import PdfFeaturePopup from "@/components/story/PdfFeaturePopup";

import "./StoryViewer.css";
import { translateTopic } from "@/lib/topic-translations";

interface StoryPage {
  id: string;
  page_number: number;
  text: string;
  illustration_url: string | null;
}

interface Story {
  id: string;
  slug?: string;
  child_name: string;
  child_gender?: string;
  topic: string;
  language?: string;
  pages: StoryPage[];
  generation_status?: string;
}

const FONT_SIZES = [
  { label: 'קטן', size: 'text-xl md:text-2xl' },
  { label: 'בינוני', size: 'text-2xl md:text-3xl' },
  { label: 'גדול', size: 'text-3xl md:text-4xl' },
];

const StoryViewer = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(2);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [showNikud, setShowNikud] = useState(true);
  const [generationStatus, setGenerationStatus] = useState<string>('ready');
  const [illustrationProgress, setIllustrationProgress] = useState(0);
  const [userStartedReading, setUserStartedReading] = useState(false);
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
  const [isReadAloudDismissed, setIsReadAloudDismissed] = useState(false);
  
  // End-page feedback state
  const [endFeedbackRating, setEndFeedbackRating] = useState(0);
  const [endFeedbackHover, setEndFeedbackHover] = useState(0);
  const [endFeedbackMessage, setEndFeedbackMessage] = useState("");
  const [endFeedbackSent, setEndFeedbackSent] = useState(false);
  const [endFeedbackSending, setEndFeedbackSending] = useState(false);
  const { trackStoryStarted, trackStoryCompleted, trackPageViewed, trackFeatureUsed } = useAnalytics();
  const { isOnline, cacheStory, getCachedStory } = useOfflineStorage();
  const { settings } = useSettings();
  const { exportToPdf, isExporting } = usePdfExport();
  const { addNikud, isLoading: isAddingNikud } = useNikud();
  // story-illustrations bucket is public - using direct URLs via getPublicIllustrationUrl
  
  const { user } = useAuth();
  const { fetchEditCount, editCount, freeEditsRemaining } = useStoryEdit(storyId || '');
  const hasTrackedStart = useRef(false);
  const { audioSupport } = useAccessibility();
  const { startReading, stopReading, isReading, isLoading: isTtsLoading } = useTextToSpeech();

  // Lock orientation to landscape on mobile
  useEffect(() => {
    const lockLandscape = async () => {
      try {
        const orientation = screen?.orientation;
        if (orientation && typeof orientation.lock === 'function') {
          await orientation.lock('landscape');
          console.log('[StoryViewer] Orientation locked to landscape');
        }
      } catch (e) {
        // Orientation lock not supported or denied - that's OK
        console.log('[StoryViewer] Orientation lock not available:', (e as Error).message);
      }
    };
    lockLandscape();

    return () => {
      try {
        const orientation = screen?.orientation;
        if (orientation && typeof orientation.unlock === 'function') {
          orientation.unlock();
        }
      } catch (e) {
        // Ignore
      }
    };
  }, []);

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
      
      // Pre-fetch next image for smooth transitions using public URLs
      if (currentPage < story.pages.length - 1) {
        const nextPage = story.pages[currentPage + 1];
        if (nextPage?.illustration_url) {
          const publicUrl = getPublicIllustrationUrl(nextPage.illustration_url);
          if (publicUrl) {
            const img = new Image();
            img.src = publicUrl;
          }
        }
      }
    }
  }, [currentPage, story?.id]);

  // Poll for illustration updates when status is generating_illustrations
  const pollForUpdates = useCallback(async () => {
    if (!resolvedId) return;

    try {
      // Check story status
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select("generation_status")
        .eq("id", resolvedId)
        .maybeSingle();

      if (storyError || !storyData) return;

      const status = (storyData as any).generation_status || 'ready';
      setGenerationStatus(status);

      // If still generating, check pages for updates
      if (status === 'generating_illustrations') {
        const { data: pagesData } = await supabase
          .from("story_pages")
          .select("*")
          .eq("story_id", resolvedId)
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
          .eq("story_id", resolvedId)
          .order("page_number", { ascending: true });

        if (pagesData) {
          setStory(prev => prev ? { ...prev, pages: pagesData, generation_status: 'ready' } : null);
          setIllustrationProgress(100);
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, [resolvedId]);

  // Sound effects disabled - silent reading experience

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const fetchStartTimeRef = useRef<number>(Date.now());

  const fetchStory = async (retryCount = 0) => {
    try {
      // Track when we first started fetching
      if (retryCount === 0) {
        fetchStartTimeRef.current = Date.now();
      }

      if (!isOnline && storyId) {
        const cached = getCachedStory(storyId);
        if (cached) {
          setStory(cached);
          setIsLoading(false);
          return;
        }
      }

      console.log(`Fetching story ${storyId}, attempt ${retryCount + 1}`);

      let storyData: any = null;

      if (storyId && isUUID(storyId)) {
        // Lookup by UUID
        const { data, error: storyError } = await supabase
          .from("stories")
          .select("*")
          .eq("id", storyId)
          .maybeSingle();
        if (storyError) throw storyError;
        storyData = data;

        // If found and has slug, redirect to slug URL
        if (storyData?.slug) {
          navigate(`/story/${storyData.slug}`, { replace: true });
          return;
        }
      } else {
        // Lookup by slug
        const { data, error: storyError } = await supabase
          .from("stories")
          .select("*")
          .eq("slug", storyId)
          .maybeSingle();
        if (storyError) throw storyError;
        storyData = data;
      }
      
      if (!storyData) {
        const elapsed = Date.now() - fetchStartTimeRef.current;
        // Retry up to 6 times with 500ms intervals (total ~3s), then slower retries up to 10s
        if (elapsed < 10000) {
          const delay = retryCount < 6 ? 500 : 1500;
          console.log(`Story not found, retrying in ${delay}ms (attempt ${retryCount + 1}, elapsed ${Math.round(elapsed/1000)}s)...`);
          setTimeout(() => fetchStory(retryCount + 1), delay);
          return; // Keep isLoading = true
        }
        
        console.error("Story not found after 10s of retries:", storyId);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "הסיפור לא נמצא. ייתכן שהסיפור עדיין נוצר - נסו לרענן את הדף.",
        });
        navigate("/library");
        return;
      }

      // Verify the resolved ID matches what we expect
      console.log(`[StoryViewer] Story found - ID: ${storyData.id}, slug: ${storyData.slug}`);

      // Check generation status
      const status = (storyData as any).generation_status || 'ready';
      setGenerationStatus(status);

      // If coming from story creation, skip the illustration loading screen
      const justCreated = sessionStorage.getItem("just_created_story");
      if (justCreated) {
        sessionStorage.removeItem("just_created_story");
        setUserStartedReading(true);
      }

      const resolvedStoryId = storyData.id;
      setResolvedId(resolvedStoryId);

      const { data: pagesData, error: pagesError } = await supabase
        .from("story_pages")
        .select("*")
        .eq("story_id", resolvedStoryId)
        .order("page_number", { ascending: true });

      if (pagesError) throw pagesError;

      // If no pages yet, retry with same time-based logic
      if (!pagesData || pagesData.length === 0) {
        const elapsed = Date.now() - fetchStartTimeRef.current;
        if (elapsed < 10000) {
          const delay = retryCount < 6 ? 500 : 2000;
          console.log(`No pages found, retrying in ${delay}ms (attempt ${retryCount + 1}, elapsed ${Math.round(elapsed/1000)}s)...`);
          setTimeout(() => fetchStory(retryCount + 1), delay);
          return; // Keep isLoading = true
        }
      }

      const storyObj: Story = {
        id: storyData.id,
        slug: storyData.slug || undefined,
        child_name: storyData.child_name,
        child_gender: (storyData as any).child_gender || 'male',
        topic: storyData.topic,
        language: (storyData as any).language || 'he',
        pages: pagesData || [],
        generation_status: status,
      };
      
      setStory(storyObj);

      // Calculate initial progress and preload all illustrations
      if (pagesData && pagesData.length > 0) {
        const pagesWithIllustrations = pagesData.filter(p => p.illustration_url).length;
        const progress = Math.round((pagesWithIllustrations / pagesData.length) * 100);
        setIllustrationProgress(progress);

        // Preload all illustration images in background
        pagesData.forEach(p => {
          if (p.illustration_url) {
            const url = getPublicIllustrationUrl(p.illustration_url);
            if (url) {
              const img = new Image();
              img.src = url;
            }
          }
        });
      }

      // Start polling if illustrations are still generating
      if (status === 'generating_illustrations' && !pollingIntervalRef.current) {
        console.log("Starting polling for illustration updates...");
        pollingStartTimeRef.current = Date.now();
        pollingIntervalRef.current = setInterval(pollForUpdates, 3000);
      }
      
      if (resolvedStoryId) {
        cacheStory(resolvedStoryId, storyObj);
      }

      // Only set loading false after data is fully ready
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching story:", error);
      const elapsed = Date.now() - fetchStartTimeRef.current;
      // On error, retry if under 10s
      if (elapsed < 10000) {
        console.log(`Fetch error, retrying in 1s (elapsed ${Math.round(elapsed/1000)}s)...`);
        setTimeout(() => fetchStory(retryCount + 1), 1000);
        return;
      }
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הסיפור",
      });
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

  // Keyboard navigation for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePageChange('next');
      } else if (e.key === 'ArrowRight') {
        handlePageChange('prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipping, currentPage, story]);

  // Swipe navigation disabled - using arrow buttons only

  // Click-based area navigation disabled - using arrow buttons only

  const handleShare = async () => {
    if (!story) return;

    try {
      const slug = (story as any).slug || story.id;
      const publicUrl = `https://soulstory.co.il/story/${slug}`;
      const title = `✨ ${translateTopic(story.topic, story.language)} ✨`;
      const text = `📚 הסיפור של ${story.child_name} – נוצר באהבה באפליקציית SolStorie's™`;

      const ua = navigator.userAgent.toLowerCase();
      const isWhatsAppBrowser = ua.includes('whatsapp');
      const isMobileDevice = /android|iphone|ipad/.test(ua);

      if (navigator.share && !isWhatsAppBrowser) {
        await navigator.share({ title, text, url: publicUrl });
      } else if (isMobileDevice || isWhatsAppBrowser) {
        // Deep-link into WhatsApp with a pre-filled message (works inside in-app browser too)
        const waText = encodeURIComponent(`${title}\n${text}\n${publicUrl}`);
        window.open(`https://wa.me/?text=${waText}`, '_blank');
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}\n${publicUrl}`);
        toast({ title: 'הקישור הועתק! 📋', description: 'כעת ניתן להדביק אותו בוואטסאפ או בכל מקום אחר' });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error sharing story:', error);
      try {
        const slug = (story as any).slug || story.id;
        const publicUrl = `https://soulstory.co.il/story/${slug}`;
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

  const handleEndFeedbackSubmit = async () => {
    if (endFeedbackRating === 0) return;
    setEndFeedbackSending(true);
    try {
      let displayName: string | null = null;
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        displayName = profile?.display_name || null;
      }
      await supabase.from("user_feedback").insert({
        rating: endFeedbackRating,
        message: endFeedbackMessage.trim() || null,
        page_url: `story/${storyId}`,
        user_id: user?.id || null,
        display_name: displayName,
        is_approved: false,
      } as any);
      setEndFeedbackSent(true);
      toast({ title: 'תודה רבה! 💛' });
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setEndFeedbackSending(false);
    }
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
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <BookOpen className="absolute inset-0 m-auto w-8 h-8 text-purple-600" />
          </div>
          <p className="text-purple-700 font-bold text-lg">פותחים את הספר...</p>
        </div>
      </div>
    );
  }

  // Show special loading state when illustrations are being generated
  if (generationStatus === 'generating_illustrations' && !userStartedReading && story) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-8 max-w-md mx-auto">
          {/* Animated Icon */}
          <div className="relative">
            <div className="w-28 h-28 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 rounded-full flex items-center justify-center shadow-lg mx-auto">
              <div className="relative">
                <Palette className="w-12 h-12 text-purple-500 animate-bounce" />
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
              onClick={() => { setUserStartedReading(true); setCurrentPage(-1); }}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold px-8 py-6 text-lg rounded-full shadow-xl"
            >
              <BookOpen className="w-5 h-5 ml-2" />
              התחילו לקרוא עכשיו!
            </Button>
          </div>

          {/* Tip */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-purple-100 max-w-xs mx-auto mt-6">
            <p className="text-sm text-purple-700">
              💡 <strong className="text-purple-900">טיפ:</strong> זה זמן מעולה להתכרבל יחד. הסיפור כבר מחכה לכם בפנים! (האיורים ימשיכו להיטען אוטומטית)
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!story || story.pages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl font-bold text-purple-700">הסיפור לא נמצא</p>
          <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
            <Home className="w-4 h-4 ml-2" />
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  const isCoverPage = currentPage === -1;
  const isEndPage = currentPage >= story.pages.length;
  
  // 1:1 layout: each page displayed individually (no spreads/pairing)
  const page = (!isCoverPage && !isEndPage && currentPage >= 0) ? story.pages[currentPage] : null;
  const currentFontSize = FONT_SIZES[fontSizeIndex];
  const showPageActions = !isCoverPage && !isEndPage && page !== null;

  // Simple page-by-page navigation
  const handlePageNav = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
    
    const maxPage = story.pages.length; // end page index
    
    if (direction === 'next' && currentPage >= maxPage) return;
    if (direction === 'prev' && currentPage <= -1) return;
    
    setFlipDirection(direction);
    setIsFlipping(true);
    
    setTimeout(() => {
      if (direction === 'next' && currentPage < maxPage) {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        
        if (newPage >= maxPage) {
          trackStoryCompleted(story.id);
        }
      } else if (direction === 'prev' && currentPage > -1) {
        setCurrentPage(currentPage - 1);
      }
      setIsFlipping(false);
    }, 300);
  };

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 flex flex-col story-viewer-landscape overflow-hidden" dir="rtl">
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

      {/* Read Aloud Floating Button - accessibility feature */}
      {(audioSupport || story?.language === 'en') && showPageActions && page && !isReadAloudDismissed && (
        <div className="fixed bottom-24 left-4 z-50">
          {/* Dismiss X button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              stopReading();
              setIsReadAloudDismissed(true);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center hover:bg-gray-700 z-10 shadow-md"
            aria-label="הסתר כפתור הקראה"
          >
            <X className="w-3 h-3" />
          </button>
          <Button
            size="icon"
            onClick={() => {
              if (isReading) {
                stopReading();
              } else {
                startReading(page.text, story?.language || 'he');
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


      {/* Book Container */}
      <main 
        className="flex-1 flex flex-col min-h-0"
      >
        <div className={cn(
          "relative w-full flex-1 transition-opacity duration-300 ease-in-out overflow-hidden min-h-0",
          isFlipping && "opacity-0"
        )}>
            
            {isCoverPage ? (
              /* Cover Page - Horizontal open book layout */
              <div className="open-book-spread relative">
                {/* Left page - Illustration */}
                <div className="open-book-page-left bg-[#FFFBF5]">
                  {story.pages[0]?.illustration_url ? (
                    <img
                      src={getPublicIllustrationUrl(story.pages[0].illustration_url) || ''}
                      alt={`עטיפת הסיפור: ${story.child_name} ב${story.topic}`}
                      className="w-full h-full object-cover absolute inset-0"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
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
                        aspectClass="w-full h-full"
                      />
                    </div>
                  )}
                  <div className="page-curl-corner bottom-left" />
                </div>
                
                {/* Right page - Title (RTL: this is the right side) */}
                <div className="open-book-page-right p-4 md:p-8 lg:p-10 text-center bg-[#FFFBF5] overflow-y-auto">
                  <div className="page-curl-corner bottom-right" />
                  <div className="space-y-4">
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-[#3D2914] leading-tight" style={{ fontFamily: "'Heebo', 'Comic Sans MS', cursive, sans-serif" }}>
                      הסיפור של
                      <br />
                      <span className="text-3xl md:text-5xl lg:text-6xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                        {story.child_name}
                      </span>
                    </h1>
                    
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-1 bg-gradient-to-r from-transparent to-pink-400 rounded-full" />
                      <span className="text-xl">✨</span>
                      <div className="w-12 h-1 bg-gradient-to-l from-transparent to-pink-400 rounded-full" />
                    </div>
                    
                    <p className="text-base md:text-lg text-[#6B4423] max-w-xs mx-auto font-medium">
                      {translateTopic(story.topic, story.language)}
                    </p>
                  </div>
                  
                  <Button 
                    size="lg"
                    onClick={() => handlePageNav('next')}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold px-6 py-4 md:px-8 md:py-5 text-base md:text-lg rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-white/50"
                  >
                    <BookOpen className="w-5 h-5 ml-2" />
                    פתח את הספר 📖
                  </Button>
                </div>
              </div>
            ) : isEndPage ? (
              /* End Page - Horizontal open book */
              <div className="open-book-spread relative bg-[#FFFBF5]">
                {/* Left page - Last illustration */}
                <div className="open-book-page-left bg-[#FFFBF5]">
                  {story.pages[story.pages.length - 1]?.illustration_url ? (
                    <img
                      src={getPublicIllustrationUrl(story.pages[story.pages.length - 1].illustration_url) || ''}
                      alt={`סיום הסיפור של ${story.child_name}`}
                      className="w-full h-full object-cover absolute inset-0"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                      <Sparkles className="w-16 h-16 text-purple-300" />
                    </div>
                  )}
                  <div className="page-curl-corner bottom-left" />
                </div>
                
                {/* Right page - End content */}
                <div className="open-book-page-right p-6 md:p-8 text-center bg-[#FFFBF5] overflow-y-auto">
                  <div className="page-curl-corner bottom-right" />
                  <div className="space-y-3">
                    <p className="text-2xl md:text-3xl font-bold text-purple-800">
                      ✦ סוף ✦
                    </p>
                    <p className="text-lg text-purple-600">
                      תודה שקראתם!
                    </p>
                    <p className="text-sm text-purple-500">
                      הסיפור של {story.child_name}
                    </p>
                  </div>

                  <div className="flex flex-row gap-2 mt-4 justify-center">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(-1)}
                      className="border-2 border-purple-400 text-purple-700 hover:bg-purple-50 px-4 py-3 rounded-full text-sm"
                    >
                      <span className="ml-1"><BookOpen className="w-4 h-4" /></span>
                      קרא שוב
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => navigate('/library')}
                      className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-4 py-3 rounded-full text-sm"
                    >
                      <span className="ml-1"><Home className="w-4 h-4" /></span>
                      לספרייה
                    </Button>
                  </div>

                  {/* Feedback Box - compact for landscape */}
                  {!endFeedbackSent ? (
                    <div className="w-full max-w-xs bg-white rounded-xl p-3 shadow-lg border border-purple-100 space-y-2 mt-4 mx-auto" dir="rtl">
                      <h3 className="text-center text-sm font-bold text-purple-800">
                        ✨ שתפו אותנו בקסם שלכם
                      </h3>
                      <div className="flex justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setEndFeedbackRating(s)}
                            onMouseEnter={() => setEndFeedbackHover(s)}
                            onMouseLeave={() => setEndFeedbackHover(0)}
                            className="p-0.5 transition-transform hover:scale-110"
                            aria-label={`דירוג ${s} כוכבים`}
                          >
                            <Star className={`w-6 h-6 ${s <= (endFeedbackHover || endFeedbackRating) ? 'fill-amber-400 text-amber-400' : 'text-purple-200'} transition-colors`} />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={endFeedbackMessage}
                        onChange={(e) => setEndFeedbackMessage(e.target.value)}
                        placeholder="ספרו לנו מה אהבתם 💬"
                        className="text-xs min-h-[40px] resize-none"
                        dir="rtl"
                      />
                      <Button
                        onClick={handleEndFeedbackSubmit}
                        disabled={endFeedbackRating === 0 || endFeedbackSending}
                        size="sm"
                        className="w-full gap-1 text-xs bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                      >
                        <Send className="w-3 h-3" />
                        {endFeedbackSending ? "שולח..." : "שליחה"}
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full max-w-xs bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 shadow-lg border border-purple-100 text-center mt-4 mx-auto" dir="rtl">
                      <p className="text-base font-bold text-purple-800">תודה רבה! 💛</p>
                      <p className="text-xs text-purple-600 mt-1">המשוב שלכם עוזר לנו ליצור סיפורים טובים יותר</p>
                    </div>
                  )}
                </div>
              </div>
            ) : page ? (
              /* SINGLE PAGE LAYOUT: Horizontal open book - 1 page per spread */
              <div className="open-book-spread relative">
                {/* Left page - Illustration */}
                <div className="open-book-page-left bg-[#FFFBF5]">
                  {page.illustration_url ? (
                    <>
                      <div className="absolute inset-0 shimmer-loading" />
                      <img
                        src={getPublicIllustrationUrl(page.illustration_url) || ''}
                        alt={`איור עמוד ${currentPage + 1}`}
                        className="w-full h-full object-cover absolute inset-0 z-[1]"
                        loading="eager"
                      />
                    </>
                  ) : generationStatus === 'generating_illustrations' ? (
                    <div className="absolute inset-0 shimmer-loading flex items-center justify-center">
                      <div className="text-center text-purple-400">
                        <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin opacity-60" />
                        <p className="text-sm">מצייר...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#F5E6D3]/50">
                      <MissingIllustrationPrompt
                        pageId={page.id}
                        isRetrying={retryingPageId === page.id}
                        isGenerating={false}
                        showPromptInput={showPromptInput === page.id}
                        customPromptText={customPromptText}
                        onTogglePrompt={() => {
                          setShowPromptInput(showPromptInput === page.id ? null : page.id);
                          setCustomPromptText('');
                        }}
                        onPromptChange={setCustomPromptText}
                        onSubmit={handleRetryIllustration}
                        aspectClass="w-full h-full"
                      />
                    </div>
                  )}
                  <div className="page-curl-corner bottom-left" />
                </div>
                
                {/* Right page - Text (RTL) */}
                <div className="open-book-page-right relative px-4 py-3 md:px-8 md:py-6 lg:px-12 lg:py-8 bg-[#FFFBF5]">
                  <div className="page-curl-corner bottom-right" />
                  
                  {/* RTL Prev button — right edge */}
                  <button
                    onClick={() => handlePageNav('prev')}
                    disabled={currentPage <= 0 || isFlipping}
                    aria-label="עמוד קודם"
                    className={cn(
                      "absolute right-1.5 top-1/2 -translate-y-1/2 z-10",
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      "bg-purple-100/80 hover:bg-purple-200 border border-purple-200",
                      "text-purple-600 transition-all duration-200",
                      "disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* RTL Next button — left edge */}
                  <button
                    onClick={() => handlePageNav('next')}
                    disabled={currentPage >= story.pages.length - 1 || isFlipping}
                    aria-label="עמוד הבא"
                    className={cn(
                      "absolute left-1.5 top-1/2 -translate-y-1/2 z-10",
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      "bg-purple-100/80 hover:bg-purple-200 border border-purple-200",
                      "text-purple-600 transition-all duration-200",
                      "disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Single page text */}
                  <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full overflow-y-auto min-h-0 pt-2">
                    <p 
                      className={cn(
                        "text-[#3D2914] text-right font-medium transition-all whitespace-pre-line",
                        currentFontSize.size
                      )} 
                      style={{ lineHeight: '1.9' }}
                      dir="rtl"
                    >
                      {showNikud ? page.text : page.text.replace(/[\u0591-\u05C7]/g, '')}
                    </p>
                  </div>
                  
                  {/* Bottom navigation arrows + page indicator */}
                  <div className="flex items-center justify-center gap-4 pt-2 mt-auto">
                    <button
                      onClick={() => handlePageNav('next')}
                      disabled={currentPage >= story.pages.length - 1 || isFlipping}
                      aria-label="עמוד הבא"
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-100/60 hover:bg-purple-200 text-purple-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400 font-light">
                      {currentPage + 1} / {story.pages.length}
                    </span>
                    <button
                      onClick={() => handlePageNav('prev')}
                      disabled={currentPage <= 0 || isFlipping}
                      aria-label="עמוד קודם"
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-100/60 hover:bg-purple-200 text-purple-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
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
              {isCoverPage ? 'עטיפה' : isEndPage ? 'סוף' : `${currentPage + 1} / ${story.pages.length}`}
            </span>
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
              className="h-20 flex flex-col gap-1 border-2 hover:border-purple-400 hover:bg-purple-50"
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
              className="h-20 flex flex-col gap-1 border-2 hover:border-purple-400 hover:bg-purple-50"
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
