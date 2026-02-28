import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, BookOpen, Sparkles, Palette, Wand2, RefreshCw, Loader2, ImageOff, Star, Send, ChevronRight, ChevronLeft } from "lucide-react";
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
// useTextToSpeech removed — read-aloud now only in Accessibility Menu
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
import solMagicBookCover from "@/assets/sol-magic-book-cover.png";

import castWavingFarewell from "@/assets/cast-waving-farewell.png";

interface StoryPage {
  id: string;
  page_number: number;
  text: string;
  illustration_url: string | null;
  illustration_prompt?: string | null;
}

interface Story {
  id: string;
  slug?: string;
  child_name: string;
  child_gender?: string;
  topic: string;
  language?: string;
  age_range?: string;
  pages: StoryPage[];
  generation_status?: string;
}

const FONT_SIZES = [
  { label: 'קטן', size: 'text-xl md:text-2xl' },
  { label: 'בינוני', size: 'text-2xl md:text-3xl' },
  { label: 'גדול', size: 'text-3xl md:text-4xl' },
];

// Rainbow gradient used for dedication, closing, and text-only pages
const RAINBOW_BG = 'linear-gradient(135deg, #FFE4E1 0%, #FFDAB9 15%, #FFFACD 30%, #E0FFE0 45%, #E0F0FF 60%, #E8D8FF 75%, #FFE4F0 90%, #FFE4E1 100%)';

/** Get age-based default font size index (0=small, 1=medium, 2=large) */
const getAgeFontIndex = (ageRange?: string): number => {
  if (!ageRange) return 1;
  const max = parseInt(ageRange.split('-').pop() || '6', 10);
  if (max >= 7) return 2; // 7-8: large font for early readers
  if (max >= 3) return 1; // 3-6: medium
  return 1; // 0-2: medium (parent reads)
};

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
  // isReadAloudDismissed removed — read-aloud only in Accessibility Menu
  // Portrait overlay removed - using vertical layout now
  
  // End-page feedback state
  const [endFeedbackRating, setEndFeedbackRating] = useState(0);
  const [endFeedbackHover, setEndFeedbackHover] = useState(0);
  const [endFeedbackMessage, setEndFeedbackMessage] = useState("");
  const [endFeedbackSent, setEndFeedbackSent] = useState(false);
  const [endFeedbackSending, setEndFeedbackSending] = useState(false);
  const { trackStoryStarted, trackStoryCompleted, trackPageViewed, trackFeatureUsed } = useAnalytics();
  const { isOnline, cacheStory, getCachedStory } = useOfflineStorage();
  const { settings } = useSettings();
  const { exportToPdf, generatePdfFile, isExporting } = usePdfExport();
  const { addNikud, isLoading: isAddingNikud } = useNikud();
  // story-illustrations bucket is public - using direct URLs via getPublicIllustrationUrl
  
  const { user } = useAuth();
  const [editStoryId, setEditStoryId] = useState<string>('');
  const { fetchEditCount, editCount, freeEditsRemaining } = useStoryEdit(editStoryId);
  const hasTrackedStart = useRef(false);
  const { audioSupport } = useAccessibility();
  // useTextToSpeech removed — read-aloud only in Accessibility Menu

  // No orientation lock needed - vertical portrait layout

  // Set age-appropriate font size on story load
  useEffect(() => {
    if (story?.age_range) {
      setFontSizeIndex(getAgeFontIndex(story.age_range));
    }
  }, [story?.age_range]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Realtime subscription for progressive illustration loading
  useEffect(() => {
    if (!resolvedId) return;

    const channel = supabase
      .channel(`story-pages-${resolvedId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'story_pages',
          filter: `story_id=eq.${resolvedId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated?.illustration_url) {
            console.log(`[StoryViewer] Realtime: illustration ready for page ${updated.page_number}`);
            setStory(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                pages: prev.pages.map(p =>
                  p.id === updated.id ? { ...p, illustration_url: updated.illustration_url } : p
                ),
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedId]);

  useEffect(() => {
    if (storyId) {
      window.scrollTo(0, 0);
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
    if (story && currentPage >= 1) {
      trackPageViewed(story.id, currentPage);
      
      // Pre-fetch next image for smooth transitions using public URLs
      const nextStoryIdx = currentPage; // currentPage is 1-indexed for story pages
      if (nextStoryIdx < story.pages.length) {
        const nextPage = story.pages[nextStoryIdx];
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
          const pagesExpecting = pagesData.filter(p => p.illustration_prompt);
          const pagesWithIllustrations = pagesExpecting.filter(p => p.illustration_url).length;
          const total = pagesExpecting.length || 1;
          const progress = Math.round((pagesWithIllustrations / total) * 100);
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

        // If found and has slug, update URL silently without re-fetching
        if (storyData?.slug && storyId !== storyData.slug) {
          window.history.replaceState(null, '', `/story/${storyData.slug}`);
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
        // Retry for up to 20s to handle DB write delays after generation
        if (elapsed < 20000) {
          const delay = retryCount < 6 ? 500 : 2000;
          console.log(`Story not found, retrying in ${delay}ms (attempt ${retryCount + 1}, elapsed ${Math.round(elapsed/1000)}s)...`);
          setTimeout(() => fetchStory(retryCount + 1), delay);
          return; // Keep isLoading = true (spinner stays)
        }
        
        console.error("Story not found after 20s of retries:", storyId);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "הסיפור לא נמצא",
          description: "ייתכן שהסיפור עדיין נוצר. נסו לרענן את הדף.",
        });
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
      setEditStoryId(resolvedStoryId);

      const { data: pagesData, error: pagesError } = await supabase
        .from("story_pages")
        .select("*")
        .eq("story_id", resolvedStoryId)
        .order("page_number", { ascending: true });

      if (pagesError) throw pagesError;

      // If no pages yet, retry with same time-based logic
      if (!pagesData || pagesData.length === 0) {
        const elapsed = Date.now() - fetchStartTimeRef.current;
        if (elapsed < 20000) {
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
        child_gender: (storyData as any).child_gender || 'female',
        topic: storyData.topic,
        language: (storyData as any).language || 'he',
        age_range: (storyData as any).age_range || '3-6',
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
      // On error, retry if under 20s
      if (elapsed < 20000) {
        console.log(`Fetch error, retrying in 1s (elapsed ${Math.round(elapsed/1000)}s)...`);
        setTimeout(() => fetchStory(retryCount + 1), 1000);
        return;
      }
      setIsLoading(false);
      setGenerationStatus('ready'); // Reset to prevent stuck state
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הסיפור",
      });
    }
  };

  // Safety: if isLoading is still true after 25s, force reset
  useEffect(() => {
    if (!isLoading) return;
    const safetyTimer = setTimeout(() => {
      console.warn('[StoryViewer] Safety timeout: forcing isLoading=false after 25s');
      setIsLoading(false);
      setGenerationStatus('ready');
    }, 25000);
    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  // Page change is now handled by handleSpreadChange defined later
  // Keep this for legacy compatibility but it's no longer the primary navigation
  const handlePageChange = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
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
    if (!story || isExporting) return;

    try {
      toast({ title: 'מכין PDF לשיתוף...' });
      const pdfFile = await generatePdfFile(story, 'portrait');

      if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          title: `✨ הסיפור של ${story.child_name} ✨`,
          text: `📚 הסיפור של ${story.child_name} – נוצר באהבה באפליקציית SolStorie's™`,
          files: [pdfFile],
        });
      } else {
        // Fallback: download the PDF directly
        const url = URL.createObjectURL(pdfFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfFile.name;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'ה-PDF הורד! 📋', description: 'כעת ניתן לשתף אותו בוואטסאפ או בכל מקום אחר' });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error sharing story PDF:', error);
      toast({ title: 'שגיאה בשיתוף', description: 'נסו שוב מאוחר יותר', variant: 'destructive' });
    }
  };

  const handleDrawingOpen = () => {
    trackFeatureUsed('drawing', story?.id);
    setIsDrawingMode(true);
  };

  const handleEditClick = async () => {
    if (resolvedId) await fetchEditCount(resolvedId);
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

  // Auto-start reading when illustrations are still generating (progressive loading)
  useEffect(() => {
    if (generationStatus === 'generating_illustrations' && story && !userStartedReading) {
      setUserStartedReading(true);
    }
  }, [generationStatus, story, userStartedReading]);

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

  // Virtual page indexing:
  // -1 = cover, 0 = dedication, 1..n = story pages (story.pages[currentPage-1]), n+1 = closing rainbow, n+2 = end/feedback
  const totalStoryPages = story.pages.length;
  const isCoverPage = currentPage === -1;
  const isDedicationPage = currentPage === 0;
  const isClosingPage = currentPage === totalStoryPages + 1;
  const isEndPage = currentPage >= totalStoryPages + 2;
  const isContentPage = currentPage >= 1 && currentPage <= totalStoryPages;
  
  const page = isContentPage ? story.pages[currentPage - 1] : null;
  const currentFontSize = FONT_SIZES[fontSizeIndex];
  const showPageActions = isContentPage && page !== null;

  // Determine layout variant for content pages (repeating pattern of 2)
  // 0 = illustration + text, 1 = text-only
  const contentPageOffset = isContentPage ? (currentPage - 1) % 2 : -1;

  // Page navigation with simple fade transition
  const handlePageNav = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
    
    const maxPage = totalStoryPages + 2;
    
    if (direction === 'next' && currentPage >= maxPage) return;
    if (direction === 'prev' && currentPage <= -1) return;
    
    setIsFlipping(true);
    
    setTimeout(() => {
      if (direction === 'next' && currentPage < maxPage) {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        window.scrollTo(0, 0);
        
        if (newPage >= maxPage) {
          trackStoryCompleted(story.id);
        }
      } else if (direction === 'prev' && currentPage > -1) {
        setCurrentPage(currentPage - 1);
        window.scrollTo(0, 0);
      }
      setIsFlipping(false);
    }, 300);
  };

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 flex flex-col overflow-hidden" dir="rtl">
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

      {/* Read Aloud button removed per user request */}


      {/* Portrait overlay removed - vertical layout */}

      {/* Book Container - Vertical Single Page */}
      <main className="flex-1 flex flex-col min-h-0 px-4 md:px-12 lg:px-20 py-2">
        <div className="book-container relative w-full max-w-2xl mx-auto flex-1 min-h-0 flex flex-col">
          {/* Spine edge shadows */}
          <div className="book-spine-edge left rounded-l-xl" />
          <div className="book-spine-edge right rounded-r-xl" />

          {/* Page content with 3D flip animation */}
          <div className={cn(
            "relative flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden",
            "shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(168,85,247,0.15)]",
            "transition-opacity duration-300",
            isFlipping ? "opacity-0" : "opacity-100",
          )}>
            
            {isCoverPage ? (
              /* Cover Page - Sol with magical book as full background */
              <div className="relative flex flex-col h-full">
                {/* Full background image */}
                <img
                  src={solMagicBookCover}
                  alt="סול עם הספר הקסום"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Content overlay at bottom */}
                <div className="relative z-10 mt-auto flex flex-col items-center text-center px-6 pb-8 pt-4">
                  <div className="space-y-2">
                    <h1 className="text-xl md:text-3xl font-black text-white leading-tight drop-shadow-lg" style={{ fontFamily: "'Heebo', 'Comic Sans MS', cursive, sans-serif" }}>
                      הַסִּפּוּר שֶׁל
                      <br />
                      <span className="text-2xl md:text-4xl bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                        {story.child_name}
                      </span>
                    </h1>
                    
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-0.5 bg-gradient-to-r from-transparent to-pink-300 rounded-full" />
                      <span className="text-lg">✨</span>
                      <div className="w-10 h-0.5 bg-gradient-to-l from-transparent to-pink-300 rounded-full" />
                    </div>
                    
                    <p className="text-sm md:text-base text-white/90 max-w-sm mx-auto font-medium leading-relaxed drop-shadow-md">
                      {translateTopic(story.topic, story.language)}
                    </p>
                  </div>
                  
                  <Button 
                    size="lg"
                    onClick={() => handlePageNav('next')}
                    className="mt-4 shrink-0 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold px-6 py-3 text-sm md:text-base rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-white/50"
                  >
                    <BookOpen className="w-4 h-4 ml-2" />
                    פִּתְחוּ אֶת הַסֵּפֶר 📖
                  </Button>
                  
                  <span className="mt-3 text-lg font-black logo-3d-bubble"><span className="logo-rainbow">SolStorie's™</span></span>
                </div>
              </div>

            ) : isDedicationPage ? (
              /* Dedication Page — Rainbow background with personalized dedication */
              <div className="relative flex-1 flex flex-col items-center justify-start pt-12 text-center h-full px-8 py-12" style={{ background: RAINBOW_BG }}>
                <div className="space-y-6 max-w-md mx-auto">
                  <span className="text-5xl">🦄</span>
                  <div className="space-y-3">
                    <p className="text-lg md:text-xl text-[#6B4423] font-medium" dir="rtl">
                      הספר מוקדש באהבה ל-
                    </p>
                    <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent" dir="rtl">
                      {story.child_name}
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-pink-400 rounded-full" />
                      <span className="text-base">💛</span>
                      <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-pink-400 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
                  <span className="text-base font-black logo-3d-bubble"><span className="logo-rainbow">SolStorie's™</span></span>
                </div>
              </div>

            ) : isClosingPage ? (
              /* Closing Page - Full cast waving background */
              <div className="relative flex-1 flex flex-col items-center justify-end text-center h-full">
                {/* Full background image */}
                <img
                  src={castWavingFarewell}
                  alt="הקאסט נפרד לשלום"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Content overlay */}
                <div className="relative z-10 space-y-3 pb-8 px-6">
                  <p className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">✦ סוֹף ✦</p>
                  <p className="text-lg text-white/90 font-medium drop-shadow-md" dir="rtl">
                    נִתְרָאֶה בַּסִּפּוּר הַבָּא!
                  </p>
                  <div className="pt-2">
                    <span className="text-base font-black logo-3d-bubble"><span className="logo-rainbow">SolStorie's™</span></span>
                  </div>
                </div>
              </div>

            ) : isEndPage ? (
              /* End Page - Feedback & actions */
              <div className="flex flex-col h-full bg-[#FFFBF5]">
                <div className="flex-1 paper-texture overflow-y-auto p-5 md:p-8 text-center flex flex-col items-center justify-center gap-3">
                  <div className="space-y-2">
                    <p className="text-2xl md:text-3xl font-bold text-purple-800">✨ נהננו? ✨</p>
                    <p className="text-sm text-purple-500">הסיפור של {story.child_name}</p>
                  </div>

                  <div className="flex flex-row gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(-1)}
                      className="border-2 border-purple-400 text-purple-700 hover:bg-purple-50 px-4 py-3 rounded-full text-sm">
                      <span className="ml-1"><BookOpen className="w-4 h-4" /></span>
                      קרא שוב
                    </Button>
                    <Button size="sm" onClick={() => navigate('/library')}
                      className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-4 py-3 rounded-full text-sm">
                      <span className="ml-1"><Home className="w-4 h-4" /></span>
                      לספרייה
                    </Button>
                  </div>

                  {/* Feedback Box */}
                  {!endFeedbackSent ? (
                    <div className="w-full max-w-xs bg-white rounded-xl p-3 shadow-lg border border-purple-100 space-y-2 mt-2 mx-auto" dir="rtl">
                      <h3 className="text-center text-sm font-bold text-purple-800">✨ שתפו אותנו בקסם שלכם</h3>
                      <div className="flex justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setEndFeedbackRating(s)}
                            onMouseEnter={() => setEndFeedbackHover(s)} onMouseLeave={() => setEndFeedbackHover(0)}
                            className="p-0.5 transition-transform hover:scale-110" aria-label={`דירוג ${s} כוכבים`}>
                            <Star className={`w-6 h-6 ${s <= (endFeedbackHover || endFeedbackRating) ? 'fill-amber-400 text-amber-400' : 'text-purple-200'} transition-colors`} />
                          </button>
                        ))}
                      </div>
                      <Textarea value={endFeedbackMessage} onChange={(e) => setEndFeedbackMessage(e.target.value)}
                        placeholder="ספרו לנו מה אהבתם 💬" className="text-xs min-h-[40px] resize-none" dir="rtl" />
                      <Button onClick={handleEndFeedbackSubmit} disabled={endFeedbackRating === 0 || endFeedbackSending}
                        size="sm" className="w-full gap-1 text-xs bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                        <Send className="w-3 h-3" />
                        {endFeedbackSending ? "שולח..." : "שליחה"}
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full max-w-xs bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 shadow-lg border border-purple-100 text-center mt-2 mx-auto" dir="rtl">
                      <p className="text-base font-bold text-purple-800">תודה רבה! 💛</p>
                      <p className="text-xs text-purple-600 mt-1">המשוב שלכם עוזר לנו ליצור סיפורים טובים יותר</p>
                    </div>
                  )}
                </div>
              </div>

            ) : page ? (
              /* Story Content Pages - Alternating layout */
              <div className={cn("h-full flex flex-col")}>
                {page.illustration_url ? (
                  /* Illustration page: illustration top, text below */
                  <>
                    <div className="relative w-full shrink-0 overflow-hidden bg-[#F5E6D3] flex items-center justify-center" style={{ height: isMobile ? '45vh' : '55vh' }}>
                      <img
                        src={getPublicIllustrationUrl(page.illustration_url) || ''}
                        alt={`איור עמוד ${currentPage}`}
                        className="w-full h-full object-contain"
                        loading="eager"
                      />
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto paper-texture px-6 py-4 md:px-8 md:py-6">
                      <div className="max-w-lg mx-auto w-full">
                        <p className={cn(
                          "text-[#3D2914] text-right font-medium transition-all whitespace-pre-line",
                          currentFontSize.size
                        )} style={{ lineHeight: '2.2' }} dir="rtl">
                          {showNikud ? page.text : page.text.replace(/[\u0591-\u05C7]/g, '')}
                        </p>
                      </div>
                      <div className="flex items-center justify-center pt-3 pb-1">
                        <span className="text-xs text-[#B8A08C] font-light">{currentPage} / {totalStoryPages}</span>
                      </div>
                    </div>
                  </>
                ) : page.illustration_prompt && !page.illustration_url ? (
                  /* Illustration generating — skeleton placeholder */
                  <>
                    <div className="relative w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#FFFBF5] via-[#F5E6D3] to-[#FAF3E8] flex items-center justify-center animate-pulse" style={{ height: isMobile ? '45vh' : '55vh' }}>
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 flex items-center justify-center animate-pulse">
                          <span className="text-3xl">🎨</span>
                        </div>
                        <p className="text-sm text-[#8B7355] font-medium">האיור נוצר...</p>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto paper-texture px-6 py-4 md:px-8 md:py-6">
                      <div className="max-w-lg mx-auto w-full">
                        <p className={cn(
                          "text-[#3D2914] text-right font-medium transition-all whitespace-pre-line",
                          currentFontSize.size
                        )} style={{ lineHeight: '2.2' }} dir="rtl">
                          {showNikud ? page.text : page.text.replace(/[\u0591-\u05C7]/g, '')}
                        </p>
                      </div>
                      <div className="flex items-center justify-center pt-3 pb-1">
                        <span className="text-xs text-[#B8A08C] font-light">{currentPage} / {totalStoryPages}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Text-only page — rainbow background + SolStorie's™ */
                  <div className="flex-1 flex flex-col min-h-0 w-full" style={{ background: RAINBOW_BG }}>
                    <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 md:px-12 md:py-10 flex flex-col">
                      <div className="max-w-lg mx-auto w-full">
                        <p className={cn(
                          "text-[#3D2914] text-right font-medium transition-all whitespace-pre-line",
                          currentFontSize.size
                        )} style={{ lineHeight: '2.2' }} dir="rtl">
                          {showNikud ? page.text : page.text.replace(/[\u0591-\u05C7]/g, '')}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-2 pt-4 pb-1 shrink-0">
                        <span className="text-xs text-[#B8A08C] font-light tracking-wide">{currentPage} / {totalStoryPages}</span>
                        <span className="text-sm font-black logo-3d-bubble opacity-60"><span className="logo-rainbow">SolStorie's™</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Navigation Arrows - bottom corners, kid-friendly */}
          <div className="flex items-center justify-between px-4 py-2 shrink-0">
            {/* Next (RTL: left arrow = next) */}
            <button
              onClick={() => handlePageNav('next')}
              disabled={currentPage >= totalStoryPages + 2 || isFlipping}
              className="nav-arrow-btn"
              aria-label="עמוד הבא"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            {/* Page indicator */}
            <div className="dot-indicator">
              <span className="text-xs text-gray-400">
                {isCoverPage ? '' : isDedicationPage ? 'הקדשה' : isClosingPage ? 'סיום' : isEndPage ? 'סוף' : `${currentPage} / ${totalStoryPages}`}
              </span>
            </div>

            {/* Prev (RTL: right arrow = prev) */}
            <button
              onClick={() => handlePageNav('prev')}
              disabled={currentPage <= -1 || isFlipping}
              className="nav-arrow-btn"
              aria-label="עמוד קודם"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>

      {/* Drawing Canvas */}
      <DrawingCanvas isOpen={isDrawingMode} onClose={() => setIsDrawingMode(false)} />

      {/* Edit Page Dialog */}
      {page && resolvedId && (
        <EditPageDialog
          open={isEditingPage}
          onOpenChange={setIsEditingPage}
          pageId={page.id}
          storyId={resolvedId}
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
