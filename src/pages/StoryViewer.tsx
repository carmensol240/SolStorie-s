import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, BookOpen, Sparkles, Palette, Wand2, Loader2, ImageOff, Star, Send, ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import SeriesNavBar, { SeriesPart } from "@/components/story/SeriesNavBar";
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
import { useFullOfflineStorage } from "@/hooks/use-full-offline-storage";
import { useSettings } from "@/hooks/use-settings";
import { usePdfExport } from "@/hooks/use-pdf-export";
import { useBgMusic } from "@/hooks/use-bg-music";
import { useNikud } from "@/hooks/use-nikud";
// useTextToSpeech removed — read-aloud now only in Accessibility Menu
import { useAccessibility } from "@/hooks/use-accessibility";

import { useAuth } from "@/hooks/use-auth";
import { useStoryEdit } from "@/hooks/use-story-edit";
import { useIsMobile } from "@/hooks/use-mobile";
// useSwipe removed - swipe navigation disabled per user request
// useSignedUrls removed - story-illustrations bucket is public
import { BookFrame, BookPage, BookHeader, NavigationArrows, MagicalBookFrame } from "@/components/story/book-frame";
import { TheaterFrame } from "@/components/story/theater-frame";
import { FileDown } from "lucide-react";
import PdfFeaturePopup from "@/components/story/PdfFeaturePopup";

import "./StoryViewer.css";
// translateTopic removed from cover — topic shown only in library
// solMagicBookCover removed — cover now uses first page illustration
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { usePageRecording } from "@/hooks/use-page-recording";
import PageRecordingControls from "@/components/story/PageRecordingControls";

import castWavingFarewell from "@/assets/cast-waving-farewell.png";
import solSuperheroWelcome from "@/assets/sol-superhero-welcome.jpg";

interface StoryPage {
  id: string;
  page_number: number;
  text: string;
  illustration_url: string | null;
  illustration_prompt?: string | null;
  illustration_url_2?: string | null;
  illustration_prompt_2?: string | null;
}

interface Story {
  id: string;
  slug?: string;
  child_name: string;
  child_gender?: string;
  topic: string;
  language?: string;
  age_range?: string;
  cover_url?: string;
  pages: StoryPage[];
  generation_status?: string;
}

const FONT_SIZES = [
  { label: 'קטן', size: 'text-xl md:text-2xl' },
  { label: 'בינוני', size: 'text-2xl md:text-3xl' },
  { label: 'גדול', size: 'text-3xl md:text-4xl' },
];

// Rainbow gradient used for dedication, closing, and text-only pages
const RAINBOW_BG = 'linear-gradient(135deg, #1a0f3a 0%, #2d1a6e 25%, #4a2d8e 50%, #2d1a6e 75%, #1a0f3a 100%)';

/** Map topic keywords to emoji + themed gradient background for text-only pages */
const getTopicTheme = (topic: string): { emoji: string; bg: string; textColor: string; pageNumColor: string } => {
  const t = topic.toLowerCase();

  // Torah / biblical / history → warm golden/brown
  const torahKeys = ['תנ"ך', 'תורה', 'משה', 'נח', 'אברהם', 'דוד', 'אסתר', 'יונה', 'שמשון', 'יוסף', 'חנוכה', 'יציאת מצרים', 'פסח', 'שבת', 'היסטוריה', 'bible', 'torah'];
  if (torahKeys.some(k => t.includes(k))) return { emoji: '📜', bg: 'linear-gradient(135deg, #8B6914 0%, #D4A843 50%, #A67C2E 100%)', textColor: '#3E2C0A', pageNumColor: 'rgba(62,44,10,0.5)' };

  // Magic / fantasy → purple
  if (t.includes('קסם') || t.includes('magic') || t.includes('חד-קרן') || t.includes('פיות') || t.includes('פנטזיה') || t.includes('fantasy') || t.includes('דרקון'))
    return { emoji: '🦄', bg: 'linear-gradient(135deg, #4a2080 0%, #2d1a6e 50%, #6B3FA0 100%)', textColor: '#F3E8FF', pageNumColor: 'rgba(200,170,255,0.5)' };

  // Nature / animals / forest → green
  if (t.includes('טבע') || t.includes('יער') || t.includes('nature') || t.includes('forest') || t.includes('גן חיות') || t.includes('zoo') || t.includes('חיות') || t.includes('פרחים'))
    return { emoji: '🌳', bg: 'linear-gradient(135deg, #1a4a2d 0%, #2d6e3a 50%, #1a5a30 100%)', textColor: '#E8F5E9', pageNumColor: 'rgba(200,230,200,0.5)' };

  // Sea / adventure / underwater → blue
  if (t.includes('ים') || t.includes('מתחת למים') || t.includes('underwater') || t.includes('הרפתקא') || t.includes('adventure') || t.includes('אוקיינוס') || t.includes('ocean') || t.includes('ספינה'))
    return { emoji: '🐠', bg: 'linear-gradient(135deg, #1a2d6e 0%, #2d4a8e 50%, #1a3570 100%)', textColor: '#E3F2FD', pageNumColor: 'rgba(180,210,255,0.5)' };

  // Space
  if (t.includes('חלל') || t.includes('כוכב') || t.includes('space')) return { emoji: '🚀', bg: 'linear-gradient(135deg, #0f0a2e 0%, #1a1560 50%, #2d1a6e 100%)', textColor: '#E8E0FF', pageNumColor: 'rgba(200,180,255,0.5)' };
  // Sleep / night
  if (t.includes('שינה') || t.includes('לילה') || t.includes('bedtime')) return { emoji: '🌙', bg: 'linear-gradient(135deg, #1a0f3a 0%, #2d1a6e 50%, #3d2080 100%)', textColor: '#E8E0FF', pageNumColor: 'rgba(200,180,255,0.5)' };
  // Friends
  if (t.includes('חבר') || t.includes('friend')) return { emoji: '🤝', bg: 'linear-gradient(135deg, #2d1a6e 0%, #4a2070 50%, #2d1a6e 100%)', textColor: '#F3E8FF', pageNumColor: 'rgba(200,170,255,0.5)' };
  // Superhero
  if (t.includes('גיבור') || t.includes('super') || t.includes('hero')) return { emoji: '🦸', bg: 'linear-gradient(135deg, #1a1040 0%, #2d1a6e 50%, #3a1050 100%)', textColor: '#F3E8FF', pageNumColor: 'rgba(200,170,255,0.5)' };
  // Birthday
  if (t.includes('יום הולדת') || t.includes('birthday')) return { emoji: '🎂', bg: 'linear-gradient(135deg, #6B3FA0 0%, #8B5CF6 50%, #A855F7 100%)', textColor: '#FFF', pageNumColor: 'rgba(255,255,255,0.5)' };
  // Family
  if (t.includes('משפח') || t.includes('family')) return { emoji: '🏠', bg: 'linear-gradient(135deg, #2d1a6e 0%, #3a2070 50%, #2d1a6e 100%)', textColor: '#F3E8FF', pageNumColor: 'rgba(200,170,255,0.5)' };
  // Teeth
  if (t.includes('שיני') || t.includes('שן') || t.includes('teeth') || t.includes('tooth')) return { emoji: '🦷', bg: 'linear-gradient(135deg, #1a1560 0%, #2d1a6e 50%, #1a2060 100%)', textColor: '#E8E0FF', pageNumColor: 'rgba(200,180,255,0.5)' };
  // Fear / dark
  if (t.includes('פחד') || t.includes('חושך') || t.includes('fear') || t.includes('dark')) return { emoji: '💪', bg: 'linear-gradient(135deg, #0f0a2e 0%, #1a0f3a 50%, #2d1a6e 100%)', textColor: '#E8E0FF', pageNumColor: 'rgba(200,180,255,0.5)' };
  // Bath
  if (t.includes('רחצה') || t.includes('אמבט') || t.includes('bath')) return { emoji: '🛁', bg: 'linear-gradient(135deg, #1a2d6e 0%, #2d4a8e 50%, #1a3570 100%)', textColor: '#E3F2FD', pageNumColor: 'rgba(180,210,255,0.5)' };
  // Sharing
  if (t.includes('שיתוף') || t.includes('shar')) return { emoji: '💝', bg: 'linear-gradient(135deg, #3a1060 0%, #2d1a6e 50%, #4a2070 100%)', textColor: '#F3E8FF', pageNumColor: 'rgba(200,170,255,0.5)' };
  // Siblings
  if (t.includes('אח') || t.includes('אחות') || t.includes('sibling')) return { emoji: '👶', bg: 'linear-gradient(135deg, #2d1a6e 0%, #3a2070 50%, #2d1a6e 100%)', textColor: '#F3E8FF', pageNumColor: 'rgba(200,170,255,0.5)' };
  // School
  if (t.includes('גן ילדים') || t.includes('kindergarten') || t.includes('בית ספר')) return { emoji: '🎒', bg: 'linear-gradient(135deg, #1a1560 0%, #2d1a6e 50%, #1a1560 100%)', textColor: '#E8E0FF', pageNumColor: 'rgba(200,180,255,0.5)' };
  // Comfort
  if (t.includes('נוח') || t.includes('מוצץ') || t.includes('pacifier')) return { emoji: '🧸', bg: 'linear-gradient(135deg, #2d1a6e 0%, #3d2080 50%, #2d1a6e 100%)', textColor: '#F3E8FF', pageNumColor: 'rgba(200,170,255,0.5)' };
  // Trip
  if (t.includes('טיול') || t.includes('trip') || t.includes('חופש')) return { emoji: '✈️', bg: 'linear-gradient(135deg, #1a2d6e 0%, #2d4a8e 50%, #1a3570 100%)', textColor: '#E3F2FD', pageNumColor: 'rgba(180,210,255,0.5)' };
  // Grandparents
  if (t.includes('סבא') || t.includes('סבת') || t.includes('grandp')) return { emoji: '👴', bg: 'linear-gradient(135deg, #8B6914 0%, #D4A843 100%)', textColor: '#3E2C0A', pageNumColor: 'rgba(62,44,10,0.5)' };
  // Default → soft purple
  return { emoji: '✨', bg: RAINBOW_BG, textColor: '#F3E8FF', pageNumColor: 'rgba(200,170,255,0.5)' };
};

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
  const [seriesParts, setSeriesParts] = useState<SeriesPart[]>([]);
  const { avatarUrl: childAvatarUrl } = useChildAvatar(story?.child_name);

  const [currentPage, setCurrentPage] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isRegeneratingCover, setIsRegeneratingCover] = useState(false);
  const [coverIsLandscape, setCoverIsLandscape] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(2);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [showNikud, setShowNikud] = useState(true);
  const [generationStatus, setGenerationStatus] = useState<string>('ready');
  const [illustrationProgress, setIllustrationProgress] = useState(0);
  const [userStartedReading, setUserStartedReading] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, number>>({});
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
  const fullOffline = useFullOfflineStorage();
  const { settings } = useSettings();
  const { exportToPdf, generatePdfFile, isExporting } = usePdfExport();
  const { addNikud, isLoading: isAddingNikud } = useNikud();
  const bgMusic = useBgMusic();
  // story-illustrations bucket is public - using direct URLs via getPublicIllustrationUrl
  
  const { user } = useAuth();
  const [editStoryId, setEditStoryId] = useState<string>('');
  const { fetchEditCount, editCount, freeEditsRemaining } = useStoryEdit(editStoryId);
  const hasTrackedStart = useRef(false);
  const { audioSupport } = useAccessibility();
  // useTextToSpeech removed — read-aloud only in Accessibility Menu
  const pageRecording = usePageRecording(resolvedId ?? undefined);

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
          if (updated?.illustration_url || updated?.illustration_url_2) {
            console.log(`[StoryViewer] Realtime: illustration ready for page ${updated.page_number}`);
            setStory(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                pages: prev.pages.map(p =>
                  p.id === updated.id ? { 
                    ...p, 
                    illustration_url: updated.illustration_url || p.illustration_url,
                    illustration_url_2: updated.illustration_url_2 || p.illustration_url_2,
                  } : p
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
        // Try full offline storage first (has illustration blobs)
        // getOfflineStory now searches by both UUID and slug
        const offlineStory = await fullOffline.getOfflineStory(storyId);
        if (offlineStory) {
          console.log('[StoryViewer] Loading story from offline storage:', offlineStory.id);
          const storyObj: Story = {
            id: offlineStory.id,
            slug: offlineStory.meta.slug || undefined,
            child_name: offlineStory.meta.child_name,
            child_gender: offlineStory.meta.child_gender || 'female',
            topic: offlineStory.meta.topic,
            language: 'he',
            age_range: offlineStory.meta.age_range || '3-6',
            cover_url: offlineStory.coverBlob ? URL.createObjectURL(offlineStory.coverBlob) : undefined,
            pages: offlineStory.pages.map(p => ({
              id: p.id,
              page_number: p.page_number,
              text: p.text,
              illustration_url: p.illustration_blob ? URL.createObjectURL(p.illustration_blob) : null,
              illustration_prompt: p.illustration_prompt,
            })),
          };
          setStory(storyObj);
          setResolvedId(offlineStory.id);
          setIsLoading(false);
          return;
        }
        // Fallback to lightweight cache (text only, no images)
        const cached = getCachedStory(storyId);
        if (cached) {
          console.log('[StoryViewer] Loading story from lightweight cache (no images)');
          setStory(cached);
          setIsLoading(false);
          return;
        }
        // Nothing found offline
        console.error('[StoryViewer] Offline: no saved story found for', storyId);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "הסיפור לא זמין אופליין",
          description: "הסיפור לא נשמר לקריאה אופליין. התחברו לאינטרנט או שמרו את הסיפור מראש בספרייה.",
        });
        return;
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

      // Fetch series siblings (same child_name + topic, same user)
      // Skip series grouping for custom/free-text stories
      const storyType = (storyData as any).story_type || 'text';
      if (storyData.user_id && storyType !== 'custom') {
        const { data: siblings } = await supabase
          .from("stories")
          .select("id, slug, topic, created_at, story_type")
          .eq("user_id", storyData.user_id)
          .eq("child_name", storyData.child_name)
          .eq("topic", storyData.topic)
          .neq("story_type", "custom")
          .order("created_at", { ascending: true });
        if (siblings && siblings.length > 1) {
          setSeriesParts(siblings);
        } else {
          setSeriesParts([]);
        }
      } else {
        setSeriesParts([]);
      }

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

  // Scroll to top on every page change — useLayoutEffect ensures it fires before paint
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll('[data-story-scroll]').forEach(el => {
      el.scrollTop = 0;
    });
  }, [currentPage]);

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

  const handleSaveOffline = async () => {
    if (!story || !resolvedId) return;
    try {
      await fullOffline.downloadStory(
        resolvedId,
        {
          id: resolvedId,
          slug: story.slug || null,
          child_name: story.child_name,
          topic: story.topic,
          cover_url: story.cover_url || null,
          created_at: new Date().toISOString(),
          child_gender: story.child_gender || null,
          age_range: story.age_range || null,
        },
        story.pages.map(p => ({
          id: p.id,
          page_number: p.page_number,
          text: p.text,
          illustration_url: p.illustration_url,
          illustration_prompt: p.illustration_prompt || null,
        })),
        story.cover_url || null,
      );
      toast({ title: '✅ הסיפור נשמר לקריאה אופליין!' });
    } catch (e) {
      console.error('Offline save failed:', e);
      toast({ title: 'שגיאה בשמירה', description: 'נסו שוב מאוחר יותר', variant: 'destructive' });
    }
  };

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

  // Regenerate cover
  const handleRegenerateCover = async () => {
    if (!story || !resolvedId || isRegeneratingCover) return;
    setIsRegeneratingCover(true);
    try {
      toast({ title: 'מייצר כריכה חדשה... 🎨', description: 'זה עשוי לקחת עד דקה' });
      const { data, error } = await supabase.functions.invoke('generate-cover', {
        body: { storyId: resolvedId, title: story.topic, topic: story.topic, language: story.language || 'he' },
      });
      if (error) throw error;

      // Always verify from DB to ensure persistence
      const { data: storyData } = await supabase
        .from('stories')
        .select('cover_url')
        .eq('id', resolvedId)
        .maybeSingle();

      const newCoverUrl = storyData?.cover_url || data?.coverUrl;
      if (newCoverUrl) {
        const freshUrl = `${newCoverUrl.split('?')[0]}?v=${Date.now()}`;
        setStory(prev => prev ? { ...prev, cover_url: freshUrl } : prev);
        toast({ title: 'הכריכה חודשה ונשמרה בהצלחה! 🎨✅' });
      } else {
        throw new Error('No cover returned');
      }
    } catch (err) {
      console.error('Cover regeneration error:', err);
      // Even on error, check if DB was updated (function may have saved but timed out)
      try {
        const { data: storyData } = await supabase
          .from('stories')
          .select('cover_url')
          .eq('id', resolvedId)
          .maybeSingle();
        if (storyData?.cover_url && storyData.cover_url !== story.cover_url) {
          const freshUrl = `${storyData.cover_url.split('?')[0]}?v=${Date.now()}`;
          setStory(prev => prev ? { ...prev, cover_url: freshUrl } : prev);
          toast({ title: 'הכריכה חודשה ונשמרה בהצלחה! 🎨✅' });
          return;
        }
      } catch { /* ignore */ }
      toast({ title: 'שגיאה בייצור הכריכה', description: 'נסו שוב מאוחר יותר', variant: 'destructive' });
    } finally {
      setIsRegeneratingCover(false);
    }
  };

  // Build virtual pages — split each DB page into illustration + text
  type VirtualPage = {
    type: 'illustration' | 'text' | 'combined';
    dbPage: StoryPage;
    illustrationUrl: string | null;
    illustrationPrompt: string | null;
    text: string;
  };

  const isToddler = story?.age_range === '0-2';

  // Find the best illustration to use as cover: match illustration_prompt keywords to story.topic
  const coverIllustration = useMemo(() => {
    if (!story || story.pages.length === 0) return null;

    const pagesWithIllustrations = story.pages.filter(p => p.illustration_url);
    if (pagesWithIllustrations.length === 0) return null;

    const topicWords = story.topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (topicWords.length === 0) {
      return pagesWithIllustrations[0];
    }

    let bestPage = pagesWithIllustrations[0];
    let bestScore = 0;

    for (const page of pagesWithIllustrations) {
      const prompt = (page.illustration_prompt || '').toLowerCase();
      let score = 0;
      for (const word of topicWords) {
        if (prompt.includes(word)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestPage = page;
      }
    }

    return bestPage;
  }, [story?.pages, story?.topic]);

  // Generate random star dots for text-only pages (stable across renders)
  const starDots = useMemo(() => Array.from({ length: 25 }, () => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 1.5 + 1.5,
    opacity: Math.random() * 0.4 + 0.2,
  })), []);

  const virtualPages: VirtualPage[] = useMemo(() => {
    if (!story || story.pages.length === 0) return [];
    const result: VirtualPage[] = [];

    if (isToddler) {
      for (const page of story.pages) {
        const hasText = page.text && page.text.trim().length > 0;
        const hasIllustration = !!page.illustration_url;
        const isCoverIllust = coverIllustration && page.id === coverIllustration.id;

        if (hasIllustration || hasText) {
          result.push({
            type: 'combined',
            dbPage: page,
            illustrationUrl: isCoverIllust ? null : page.illustration_url,
            illustrationPrompt: page.illustration_prompt || null,
            text: page.text,
          });
        }
      }
    } else {
      // Ages 3+: one virtual page per DB page — no duplication
      for (const page of story.pages) {
        const hasText = page.text && page.text.trim().length > 0;
        const hasIllustration = !!page.illustration_url;
        const isCoverIllust = coverIllustration && page.id === coverIllustration.id;

        if (hasIllustration && !isCoverIllust) {
          // Page with illustration → show text as overlay on the image
          result.push({
            type: 'illustration',
            dbPage: page,
            illustrationUrl: page.illustration_url,
            illustrationPrompt: page.illustration_prompt || null,
            text: page.text,
          });
        } else if (hasText) {
          // Text-only page (or cover illustration page — show text without the image)
          result.push({
            type: 'text',
            dbPage: page,
            illustrationUrl: null,
            illustrationPrompt: null,
            text: page.text,
          });
        }
      }
    }

    return result;
  }, [story?.pages, isToddler, coverIllustration]);

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
  // -1 = cover (merged with dedication), 0..N-1 = virtual pages, N = closing, N+1 = end/feedback
  const totalVirtualPages = virtualPages.length;
  const isCoverPage = currentPage === -1;
  const isClosingPage = currentPage === totalVirtualPages;
  const isEndPage = currentPage >= totalVirtualPages + 1;
  const isContentPage = currentPage >= 0 && currentPage < totalVirtualPages;

  const currentVirtual = isContentPage ? virtualPages[currentPage] : null;
  // For editing/nikud, get the underlying DB page
  const page = currentVirtual ? currentVirtual.dbPage : null;
  const currentFontSize = FONT_SIZES[fontSizeIndex];
  const showPageActions = isContentPage && page !== null;

  // Reset all scroll positions (window + inner scrollable containers)
  const resetScroll = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Reset any inner overflow-y-auto containers within the viewer
    document.querySelectorAll('[data-story-scroll]').forEach(el => {
      el.scrollTop = 0;
    });
  };

  // Page navigation with simple fade transition
  // Page 0 (first virtual page) is skipped — cover merges with it
  const handlePageNav = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
    
    const maxPage = totalVirtualPages + 1;
    
    if (direction === 'next' && currentPage >= maxPage) return;
    if (direction === 'prev' && currentPage <= -1) return;
    
    setIsFlipping(true);
    
    // Reset scroll IMMEDIATELY before the page change
    resetScroll();
    
    setTimeout(() => {
      if (direction === 'next' && currentPage < maxPage) {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        
        if (newPage >= maxPage) {
          trackStoryCompleted(story.id);
        }
      } else if (direction === 'prev' && currentPage > -1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
      }
      setIsFlipping(false);
    }, 300);
  };

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-[#1a0a1a] via-[#2a1030] to-[#1a0a1a] flex flex-col overflow-hidden" dir="rtl">
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
        isMusicPlaying={bgMusic.isPlaying}
        onToggleMusic={bgMusic.toggle}
        onSaveOffline={handleSaveOffline}
        isSavedOffline={resolvedId ? fullOffline.savedStoryIds.has(resolvedId) : false}
        isDownloadingOffline={fullOffline.downloadingId === resolvedId}
        onRegenerateCover={handleRegenerateCover}
        isRegeneratingCover={isRegeneratingCover}
      />

      {/* Series navigation bar */}
      {seriesParts.length > 1 && resolvedId && (
        <SeriesNavBar
          parts={seriesParts}
          currentStoryId={resolvedId}
          onNavigate={(id) => navigate(`/story/${id}`)}
        />
      )}

      {/* Portrait overlay removed - vertical layout */}

      {/* Book Container - Vertical Single Page */}
      <main className="flex-1 flex flex-col min-h-0 px-4 md:px-12 lg:px-20 py-2">
        <div className="relative w-full max-w-2xl mx-auto flex-1 min-h-0 flex flex-col">
          <MagicalBookFrame className="flex-1 min-h-0">
            {/* Page content with fade transition */}
            <div className={cn(
              "relative w-full h-full overflow-hidden",
              "transition-opacity duration-300",
              isFlipping ? "opacity-0" : "opacity-100",
            )}>
            
            {isCoverPage ? (
              /* Cover Page — illustration is the hero, minimal overlay */
              (() => {
                return (
                  <div className="relative flex flex-col h-full">
                    {/* Full background — best matching illustration as cover, fallback to cover_url or default */}
                    <img
                      src={coverIllustration?.illustration_url 
                        ? (getPublicIllustrationUrl(coverIllustration.illustration_url) || story.cover_url || solSuperheroWelcome)
                        : (story.cover_url || solSuperheroWelcome)}
                      alt="כריכת הסיפור"
                      className={cn(
                        "absolute inset-0 w-full h-full",
                        coverIsLandscape ? "object-contain bg-black/40" : "object-cover"
                      )}
                      loading="eager"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setCoverIsLandscape(img.naturalWidth > img.naturalHeight);
                      }}
                    />
                    {/* Subtle bottom gradient only — let the illustration breathe */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Spacer to push content to bottom */}
                    <div className="flex-1" />

                    {/* Bottom section — dedication + CTA + logo */}
                    <div className="relative z-10 flex flex-col items-center pb-6 px-6 gap-2 text-center">
                      <p className="text-sm md:text-base text-white/90 font-medium drop-shadow-md" dir="rtl">
                        הספר הזה נוצר במיוחד עבורך, {story.child_name} 💜
                      </p>

                      <Button
                        size="lg"
                        onClick={() => handlePageNav('next')}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold px-6 py-3 text-sm md:text-base rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-white/50 mt-1"
                      >
                        <BookOpen className="w-4 h-4 ml-2" />
                        פִּתְחוּ אֶת הַסֵּפֶר 📖
                      </Button>
                      <span className="text-base font-black logo-3d-bubble mt-1"><span className="logo-rainbow">SolStorie's™</span></span>
                    </div>
                  </div>
                );
              })()

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
                  {/* Next part in series or back to library */}
                  <div className="flex flex-col items-center gap-2 pt-4">
                    {(() => {
                      const idx = seriesParts.findIndex(p => p.id === resolvedId);
                      if (idx >= 0 && idx < seriesParts.length - 1) {
                        const next = seriesParts[idx + 1];
                        return (
                          <Button
                            onClick={() => navigate(`/story/${next.slug || next.id}`)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-full shadow-xl text-base gap-2 animate-pulse"
                          >
                            <BookOpen className="w-5 h-5" />
                            המשיכו לחלק {idx + 2} →
                          </Button>
                        );
                      }
                      return null;
                    })()}
                    <Button
                      onClick={() => navigate('/library')}
                      variant="ghost"
                      className="text-white/80 hover:text-white hover:bg-white/10 font-medium px-6 py-3 rounded-full text-sm gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      חזרה לספרייה
                    </Button>
                  </div>
                </div>
              </div>

            ) : isEndPage ? (
              /* End Page - Feedback & actions */
              <div className="flex flex-col h-full bg-[#FFFBF5]">
                <div data-story-scroll className="flex-1 paper-texture overflow-y-auto p-5 md:p-8 text-center flex flex-col items-center justify-center gap-3">
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
                  <div className="pt-2">
                    <span className="text-xl font-black logo-3d-bubble mt-3"><span className="logo-rainbow">SolStorie's™</span></span>
                  </div>
                </div>
              </div>

            ) : currentVirtual ? (
              /* Story Content Pages */
              <div className="h-full w-full relative animate-fade-in">
                {currentVirtual.type === 'combined' ? (
                  /* Combined page (ages 0-2) — fullscreen illustration + text overlay */
                  <>
                    {currentVirtual.illustrationUrl ? (
                      <img
                        key={`${currentVirtual.illustrationUrl}-${failedImages[currentVirtual.illustrationUrl] || 0}`}
                        src={`${getPublicIllustrationUrl(currentVirtual.illustrationUrl) || ''}${failedImages[currentVirtual.illustrationUrl] ? `?retry=${failedImages[currentVirtual.illustrationUrl]}` : ''}`}
                        alt="איור"
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="eager"
                        onError={() => {
                          const key = currentVirtual.illustrationUrl!;
                          const attempts = failedImages[key] || 0;
                          if (attempts < 3) {
                            setTimeout(() => setFailedImages(prev => ({ ...prev, [key]: attempts + 1 })), 2000);
                          } else {
                            console.error('Illustration failed to load after 3 retries:', key);
                          }
                        }}
                      />
                    ) : currentVirtual.dbPage.illustration_prompt ? (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#F5E6D3] to-[#FAF3E8]">
                        <div className="relative z-10 text-center space-y-4">
                          <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 via-pink-300 to-orange-300 animate-spin" style={{ animationDuration: '3s' }} />
                            <div className="absolute inset-1 rounded-full bg-white/90 flex items-center justify-center">
                              <span className="text-3xl">🎨</span>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-[#6B4423]" dir="rtl">מכינים איור קסום...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 w-full h-full" style={{ background: getTopicTheme(story.topic).bg }} />
                    )}
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-[1]" />
                    {/* Text overlay at the bottom */}
                    {currentVirtual.text && currentVirtual.text.trim() && (
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6" dir="rtl">
                        <div className="max-w-lg mx-auto text-center">
                          <p className={cn(
                            "font-semibold whitespace-pre-line text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]",
                            currentFontSize.size,
                          )} style={{
                            lineHeight: '1.8',
                            padding: '12px 16px',
                          }}>
                            {showNikud ? currentVirtual.text : currentVirtual.text.replace(/[\u0591-\u05C7]/g, '')}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center z-10">
                      <span className="text-xs text-white/40 font-light">{currentVirtual.dbPage.page_number} / {story.pages.length}</span>
                    </div>
                    {/* Recording controls — combined page */}
                    <div className="absolute top-3 left-3 z-20">
                      <PageRecordingControls
                        pageNumber={currentVirtual.dbPage.page_number}
                        isRecording={pageRecording.recordingPage === currentVirtual.dbPage.page_number}
                        hasPendingBlob={pageRecording.pendingBlob?.page === currentVirtual.dbPage.page_number}
                        hasSaved={pageRecording.hasSavedRecording(currentVirtual.dbPage.page_number)}
                        isPlaying={pageRecording.playingPage === currentVirtual.dbPage.page_number}
                        onStartRecording={() => pageRecording.startRecording(currentVirtual.dbPage.page_number)}
                        onStopRecording={pageRecording.stopRecording}
                        onSave={pageRecording.saveRecording}
                        onDiscard={pageRecording.discardPending}
                        onPlay={() => pageRecording.playRecording(currentVirtual.dbPage.page_number)}
                        onStopPlaying={pageRecording.stopPlaying}
                        light
                      />
                    </div>
                  </>
                ) : currentVirtual.type === 'illustration' ? (
                  /* Illustration page — fullscreen image with gradient + text */
                  <>
                    {currentVirtual.illustrationUrl ? (
                      <img
                        key={`${currentVirtual.illustrationUrl}-${failedImages[currentVirtual.illustrationUrl] || 0}`}
                        src={`${getPublicIllustrationUrl(currentVirtual.illustrationUrl) || ''}${failedImages[currentVirtual.illustrationUrl] ? `?retry=${failedImages[currentVirtual.illustrationUrl]}` : ''}`}
                        alt="איור"
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="eager"
                        onError={() => {
                          const key = currentVirtual.illustrationUrl!;
                          const attempts = failedImages[key] || 0;
                          if (attempts < 3) {
                            setTimeout(() => setFailedImages(prev => ({ ...prev, [key]: attempts + 1 })), 2000);
                          } else {
                            console.error('Illustration failed to load after 3 retries:', key);
                          }
                        }}
                      />
                    ) : currentVirtual.dbPage.illustration_prompt ? (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#F5E6D3] to-[#FAF3E8]">
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-purple-200 animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }} />
                          <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-pink-200 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
                          <div className="absolute bottom-1/4 left-1/3 w-28 h-28 rounded-full bg-orange-200 animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }} />
                        </div>
                        <div className="relative z-10 text-center space-y-4">
                          <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 via-pink-300 to-orange-300 animate-spin" style={{ animationDuration: '3s' }} />
                            <div className="absolute inset-1 rounded-full bg-white/90 flex items-center justify-center">
                              <span className="text-3xl">🎨</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-[#6B4423]" dir="rtl">מכינים איור קסום...</p>
                            <p className="text-xs text-[#8B7355]/70" dir="rtl">רק עוד רגע ✨</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const theme = getTopicTheme(story.topic);
                        return (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ background: theme.bg }}>
                            <span className="text-7xl opacity-40">{theme.emoji}</span>
                          </div>
                        );
                      })()
                    )}
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-[1]" />
                    {/* Text overlay at bottom */}
                    {currentVirtual.text && currentVirtual.text.trim() && (
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6" dir="rtl">
                        <div className="max-w-lg mx-auto text-center">
                          <p className={cn(
                            "font-semibold whitespace-pre-line text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]",
                            currentFontSize.size,
                          )} style={{ lineHeight: '1.8', padding: '12px 16px' }}>
                            {showNikud ? currentVirtual.text : currentVirtual.text.replace(/[\u0591-\u05C7]/g, '')}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Page number on illustration page */}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center z-10">
                      <span className="text-xs text-white/40 font-light">{Math.ceil((currentPage + 1) / 2)} / {story.pages.length}</span>
                    </div>
                    {/* Recording controls — illustration page */}
                    <div className="absolute top-3 left-3 z-20">
                      <PageRecordingControls
                        pageNumber={currentVirtual.dbPage.page_number}
                        isRecording={pageRecording.recordingPage === currentVirtual.dbPage.page_number}
                        hasPendingBlob={pageRecording.pendingBlob?.page === currentVirtual.dbPage.page_number}
                        hasSaved={pageRecording.hasSavedRecording(currentVirtual.dbPage.page_number)}
                        isPlaying={pageRecording.playingPage === currentVirtual.dbPage.page_number}
                        onStartRecording={() => pageRecording.startRecording(currentVirtual.dbPage.page_number)}
                        onStopRecording={pageRecording.stopRecording}
                        onSave={pageRecording.saveRecording}
                        onDiscard={pageRecording.discardPending}
                        onPlay={() => pageRecording.playRecording(currentVirtual.dbPage.page_number)}
                        onStopPlaying={pageRecording.stopPlaying}
                        light
                      />
                    </div>
                  </>
                ) : (
                  /* Text page — dark starry night background, centered white text */
                  (() => {
                    const rawText = currentVirtual.text;
                    const displayText = showNikud ? rawText : rawText.replace(/[\u0591-\u05C7]/g, '');
                      return (
                      <div data-story-scroll className="absolute inset-0 w-full h-full overflow-y-auto flex flex-col items-center" style={{ background: '#0d0a1f' }}>
                        {/* Starry dots */}
                        {starDots.map((s, i) => (
                          <span key={i} className="absolute rounded-full" style={{ top: s.top, left: s.left, width: `${s.size}px`, height: `${s.size}px`, backgroundColor: '#fff', opacity: s.opacity, pointerEvents: 'none' }} />
                        ))}
                        {/* Recording controls — text page */}
                        <div className="absolute top-3 left-3 z-20">
                          <PageRecordingControls
                            pageNumber={currentVirtual.dbPage.page_number}
                            isRecording={pageRecording.recordingPage === currentVirtual.dbPage.page_number}
                            hasPendingBlob={pageRecording.pendingBlob?.page === currentVirtual.dbPage.page_number}
                            hasSaved={pageRecording.hasSavedRecording(currentVirtual.dbPage.page_number)}
                            isPlaying={pageRecording.playingPage === currentVirtual.dbPage.page_number}
                            onStartRecording={() => pageRecording.startRecording(currentVirtual.dbPage.page_number)}
                            onStopRecording={pageRecording.stopRecording}
                            onSave={pageRecording.saveRecording}
                            onDiscard={pageRecording.discardPending}
                            onPlay={() => pageRecording.playRecording(currentVirtual.dbPage.page_number)}
                            onStopPlaying={pageRecording.stopPlaying}
                          />
                        </div>
                        <div className="flex-1" />
                        <div className="max-w-lg mx-auto w-full px-6 md:px-10 py-6 shrink-0">
                          <p className={cn(
                            "text-center font-semibold whitespace-pre-line",
                            currentFontSize.size,
                          )} style={{
                            lineHeight: '2',
                            color: '#FFFFFF',
                          }} dir="rtl">
                            {displayText}
                          </p>
                        </div>
                        <div className="flex-1" />
                        <div className="pb-4 shrink-0">
                          <span className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.25)' }}>{Math.ceil((currentPage + 1) / 2)} / {story.pages.length}</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            ) : null}
          </div>
          </MagicalBookFrame>

          {/* Navigation Arrows - bottom corners, kid-friendly */}
          <div className="flex items-center justify-between px-4 py-2 shrink-0">
            {/* Next (RTL: left arrow = next) */}
            <button
              onClick={() => handlePageNav('next')}
              disabled={currentPage >= totalVirtualPages + 1 || isFlipping}
              className="nav-arrow-btn"
              aria-label="עמוד הבא"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            {/* Page indicator */}
            <div className="dot-indicator">
              <span className="text-xs text-gray-400">
                {isCoverPage ? '' : isClosingPage ? 'סיום' : isEndPage ? 'סוף' : `${Math.ceil((currentPage + 1) / 2)} / ${story.pages.length}`}
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
