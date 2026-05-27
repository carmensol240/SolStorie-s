import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Palette, Wand2, Loader2, ImageOff, Star, Send, ChevronRight, ChevronLeft, ArrowRight, Link2, Printer, Eye } from "lucide-react";
import SeriesNavBar, { SeriesPart } from "@/components/story/SeriesNavBar";
import { MissingIllustrationPrompt } from "@/components/story/MissingIllustrationPrompt";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";
import { DrawingCanvas } from "@/components/ui/drawing-canvas";
import { SignedImage } from "@/components/ui/signed-image";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";

import OfflineIndicator from "@/components/ui/offline-indicator";

const TESTER_EMAIL = 'carmit1901+test@gmail.com';
const ORIGINAL_TESTER = 'carmit1901@gmail.com';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAnalytics } from "@/hooks/use-analytics";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useFullOfflineStorage } from "@/hooks/use-full-offline-storage";
import { useSettings } from "@/hooks/use-settings";
import { usePdfExport } from "@/hooks/use-pdf-export";
import { useBgMusic } from "@/hooks/use-bg-music";
import { useNikud } from "@/hooks/use-nikud";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useAccessibility } from "@/hooks/use-accessibility";

import { useAuth } from "@/hooks/use-auth";
import { useColoringCredits } from "@/hooks/use-coloring-credits";
import { useStoryEdit } from "@/hooks/use-story-edit";
import { useIsMobile } from "@/hooks/use-mobile";
// useSwipe removed - swipe navigation disabled per user request
// useSignedUrls removed - story-illustrations bucket is public
import { BookFrame, BookPage, BookHeader, NavigationArrows, MagicalBookFrame } from "@/components/story/book-frame";
import { TheaterFrame } from "@/components/story/theater-frame";
import PdfFeaturePopup from "@/components/story/PdfFeaturePopup";
import PrintPdfOfferModal from "@/components/story/PrintPdfOfferModal";
import PrintBookPreviewModal from "@/components/story/PrintBookPreviewModal";
import InstallAppPrompt from "@/components/story/InstallAppPrompt";
import DemoLockModal from "@/components/story/DemoLockModal";

import "./StoryViewer.css";
import { translateTopic } from "@/lib/topic-translations";
// solMagicBookCover removed — cover now uses first page illustration
import { useChildAvatar } from "@/hooks/use-child-avatar";
import { usePageRecording } from "@/hooks/use-page-recording";
import PageRecordingControls from "@/components/story/PageRecordingControls";
import { OnlineColoringCanvas } from "@/components/story/OnlineColoringCanvas";

import castWavingFarewell from "@/assets/cast-waving-farewell.png";


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

const LEARNING_PRONUNCIATION: Record<string, string> = {
  'letter-alef': 'אָלֶף', 'letter-bet': 'בֵּית', 'letter-gimel': 'גִּימֶל',
  'letter-dalet': 'דָּלֶת', 'letter-he': 'הֵא', 'letter-vav': 'וָו',
  'letter-zayin': 'זַיִן', 'letter-chet': 'חֵית', 'letter-tet': 'טֵית',
  'letter-yod': 'יוֹד', 'letter-kaf': 'כָּף', 'letter-lamed': 'לָמֶד',
  'letter-mem': 'מֵם', 'letter-nun': 'נוּן', 'letter-samekh': 'סָמֶך',
  'letter-ayin': 'עַיִן', 'letter-pe': 'פֵּא', 'letter-tsadi': 'צָדִי',
  'letter-qof': 'קוֹף', 'letter-resh': 'רֵישׁ', 'letter-shin': 'שִׁין',
  'letter-tav': 'תָּו',
  'number-1': 'אֶחָד', 'number-2': 'שְׁנַיִם', 'number-3': 'שָׁלוֹשׁ',
  'number-4': 'אַרְבַּע', 'number-5': 'חָמֵשׁ', 'number-6': 'שֵׁשׁ',
  'number-7': 'שֶׁבַע', 'number-8': 'שְׁמוֹנֶה', 'number-9': 'תֵּשַׁע',
  'number-10': 'עֶשֶׂר',
  'color-red': 'אָדֹם', 'color-blue': 'כָּחֹל', 'color-yellow': 'צָהֹב',
  'color-green': 'יָרֹק', 'color-orange': 'כָּתֹם', 'color-purple': 'סָגֹל',
  'color-pink': 'וָרֹד', 'color-white': 'לָבָן', 'color-black': 'שָׁחֹר',
  'shape-circle': 'עִיגּוּל', 'shape-square': 'רִיבּוּעַ',
  'shape-triangle': 'מְשֻׁלָּשׁ', 'shape-rectangle': 'מַלְבֵּן',
  'shape-heart': 'לֵב', 'shape-star': 'כּוֹכָב',
};

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
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [seriesParts, setSeriesParts] = useState<SeriesPart[]>([]);
  const { avatarUrl: childAvatarUrl } = useChildAvatar(story?.child_name);

const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isRegeneratingCover, setIsRegeneratingCover] = useState(false);
  const [coverIsLandscape, setCoverIsLandscape] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(2);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [showNikud, setShowNikud] = useState(true);
  const [generationStatus, setGenerationStatus] = useState<string>('ready');
  const [illustrationProgress, setIllustrationProgress] = useState(0);
  const [userStartedReading, setUserStartedReading] = useState(false);
  const [justCreatedStory, setJustCreatedStory] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, number>>({});
  const [imageLoadedMap, setImageLoadedMap] = useState<Record<string, boolean>>({});
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const preloadedIllustrationsRef = useRef<Set<string>>(new Set());
  const [retryingPageId, setRetryingPageId] = useState<string | null>(null);
  const [showPromptInput, setShowPromptInput] = useState<string | null>(null); // pageId or null
  const [customPromptText, setCustomPromptText] = useState('');
  
  const [showDedicationDialog, setShowDedicationDialog] = useState(false);
  const [isCreatingDigitalBook, setIsCreatingDigitalBook] = useState(false);
  const [showGenderSwapDialog, setShowGenderSwapDialog] = useState(false);
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);
  const [showBuyToPrintDialog, setShowBuyToPrintDialog] = useState(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [showPrintPdfOffer, setShowPrintPdfOffer] = useState(false);
  const [hasPurchasedPackage, setHasPurchasedPackage] = useState(false);
  const [isSubscriberUser, setIsSubscriberUser] = useState(false);
  const [hasStoryCredits, setHasStoryCredits] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSingleStoryUnlock, setIsSingleStoryUnlock] = useState(false);
  const [demoLockOpen, setDemoLockOpen] = useState(false);
  const [demoPaywallOpen, setDemoPaywallOpen] = useState(false);
  // Tracks whether all 3 entitlement checks (purchases, subscriber, admin) have completed at least once.
  const [purchaseChecked, setPurchaseChecked] = useState(false);
  const [subscriberChecked, setSubscriberChecked] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const purchaseChecksReady = purchaseChecked && subscriberChecked && adminChecked;
  const [pendingPaywallOpen, setPendingPaywallOpen] = useState(false);

  // Re-open paywall popup when returning from /upgrade via close button
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('paywall') === '1') {
      setPendingPaywallOpen(true);
      params.delete('paywall');
      const qs = params.toString();
      navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  // isReadAloudDismissed removed — read-aloud only in Accessibility Menu
  // Portrait overlay removed - using vertical layout now
  
  // End-page feedback state
  const [endFeedbackRating, setEndFeedbackRating] = useState(0);
  const [endFeedbackHover, setEndFeedbackHover] = useState(0);
  const [endFeedbackMessage, setEndFeedbackMessage] = useState("");
  const [endFeedbackSent, setEndFeedbackSent] = useState(false);
  const [endFeedbackSending, setEndFeedbackSending] = useState(false);
  const [coloringLoading, setColoringLoading] = useState(false);
  const [coloringPickerOpen, setColoringPickerOpen] = useState(false);
  const [selectedColoringUrl, setSelectedColoringUrl] = useState<string | null>(null);
  const [coloringAction, setColoringAction] = useState<'pick' | 'choose-action'>('pick');
  const [coloringMode, setColoringMode] = useState<'print' | 'online' | null>(null);
  const [onlineColoringOpen, setOnlineColoringOpen] = useState(false);
  const [onlineColoringImageUrl, setOnlineColoringImageUrl] = useState<string | null>(null);
  const [cachedColoringUrl, setCachedColoringUrl] = useState<string | null>(null);
  const [cachedIllustrationUrl, setCachedIllustrationUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const { coloringCredits } = useColoringCredits();


  const getIllustrationComparisonKey = useCallback((url: string | null) => {
    if (!url) return null;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const parsed = new URL(url);
        const bucketMarker = "/storage/v1/object/public/story-illustrations/";
        const bucketIndex = parsed.pathname.indexOf(bucketMarker);
        if (bucketIndex >= 0) {
          return decodeURIComponent(parsed.pathname.slice(bucketIndex + bucketMarker.length));
        }
        return decodeURIComponent(`${parsed.pathname}${parsed.search}`);
      } catch {
        return url;
      }
    }

    return decodeURIComponent(url.replace(/^\/+/, ""));
  }, []);

  const getMatchingCachedColoringUrl = useCallback(() => {
    const selectedKey = getIllustrationComparisonKey(selectedColoringUrl);
    const cachedKey = getIllustrationComparisonKey(cachedIllustrationUrl);

    if (!selectedKey || !cachedKey || selectedKey !== cachedKey) {
      return null;
    }

    return cachedColoringUrl;
  }, [cachedColoringUrl, cachedIllustrationUrl, getIllustrationComparisonKey, selectedColoringUrl]);

  const preloadStoryCachedColoring = useCallback(async (mode: 'print' | 'online' | null) => {
    if (!story || coloringLoading) return;

    const illustrations = story.pages?.filter(p => p.illustration_url).map(p => p.illustration_url!) || [];
    if (illustrations.length === 0) {
      toast({ title: "אין איורים זמינים ליצירת דף צביעה", variant: "destructive" });
      return;
    }

    setColoringMode(mode);

    if (user && story.id) {
      const { data: cached } = await supabase
        .from("story_coloring_pages" as any)
        .select("*")
        .eq("story_id", story.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cached) {
        const cachedIllustration = getPublicIllustrationUrl((cached as any).illustration_url);
        const publicUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://qvdwmkxviaqcgmjotsxe.supabase.co'}/storage/v1/object/public/story-illustrations/${(cached as any).coloring_image_path}`;
        setCachedColoringUrl(publicUrl);
        setCachedIllustrationUrl(cachedIllustration);
        setSelectedColoringUrl(cachedIllustration);
        setColoringAction('choose-action');
        setColoringPickerOpen(true);
        return;
      }
    }

    setSelectedColoringUrl(null);
    setCachedColoringUrl(null);
    setCachedIllustrationUrl(null);
    setColoringAction('pick');
    setColoringPickerOpen(true);
  }, [coloringLoading, story, toast, user]);


  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    // Keep object-cover for all images — no white margins
  }, []);

  const preloadIllustration = useCallback((illustrationUrl: string | null) => {
    const publicUrl = getPublicIllustrationUrl(illustrationUrl);
    if (!publicUrl || preloadedIllustrationsRef.current.has(publicUrl)) return;

    preloadedIllustrationsRef.current.add(publicUrl);
    const img = new Image();
    img.src = publicUrl;
  }, []);

  const { trackStoryStarted, trackStoryCompleted, trackPageViewed, trackFeatureUsed } = useAnalytics();
  const { isOnline, cacheStory, getCachedStory } = useOfflineStorage();
  const fullOffline = useFullOfflineStorage();
  const { settings } = useSettings();
  const { exportToPdf, generatePdfFile, isExporting } = usePdfExport();
  const { addNikud, isLoading: isAddingNikud } = useNikud();
  const bgMusic = useBgMusic();
  // story-illustrations bucket is public - using direct URLs via getPublicIllustrationUrl
  
  const [editStoryId, setEditStoryId] = useState<string>('');
  const { fetchEditCount, editCount, freeEditsRemaining } = useStoryEdit(editStoryId);
  const hasTrackedStart = useRef(false);
  const { audioSupport } = useAccessibility();
  const { startReading } = useTextToSpeech();
  const pageRecording = usePageRecording(resolvedId ?? undefined);

  // No orientation lock needed - vertical portrait layout

  // Check if user has purchased a story package (controls "print to book" button behavior)
  const refetchPurchaseStatus = useCallback(async () => {
    if (!user?.id) { setHasPurchasedPackage(false); setPurchaseChecked(true); return; }
    const { data, error } = await supabase
      .from('purchases')
      .select('id, package_name')
      .eq('user_id', user.id)
      .in('status', ['completed', 'test_completed'])
      .limit(50);
    if (!error) {
      // A "package" purchase unlocks all stories. Single-story purchases
      // (package_name contains "single_story") must NOT bypass the demo paywall
      // for other stories — they only unlock the specific story via story_unlocks.
      const hasPackage = (data ?? []).some((row: any) => {
        const name: string = row?.package_name ?? '';
        return !name.includes('single_story');
      });
      setHasPurchasedPackage(hasPackage);
    }
    setPurchaseChecked(true);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) { setHasPurchasedPackage(false); return; }
    refetchPurchaseStatus();
  }, [user?.id, refetchPurchaseStatus]);

  // Listen for purchase completion (fired by Upgrade page) — unlocks features without a refresh
  useEffect(() => {
    const handler = () => {
      refetchPurchaseStatus();
      setDemoLockOpen(false);
      setDemoPaywallOpen(false);
    };
    window.addEventListener('purchase-completed', handler);
    return () => window.removeEventListener('purchase-completed', handler);
  }, [refetchPurchaseStatus]);

  // Check subscriber flag (subscribers are not demo-locked even without purchase rows)
  useEffect(() => {
    if (!user?.id) {
      setIsSubscriberUser(false);
      setHasStoryCredits(false);
      setSubscriberChecked(true);
      return;
    }
    let cancelled = false;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_subscriber, story_credits')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled) {
        setIsSubscriberUser(!!data?.is_subscriber);
        setHasStoryCredits((data?.story_credits ?? 0) > 0);
        setSubscriberChecked(true);
      }
    };
    fetchProfile();
    const onPurchase = () => { fetchProfile(); };
    window.addEventListener('purchase-completed', onPurchase);
    return () => {
      cancelled = true;
      window.removeEventListener('purchase-completed', onPurchase);
    };
  }, [user?.id]);

  // Check if this specific story was unlocked via a one-time single purchase
  useEffect(() => {
    if (!user?.id || !story?.id) { setIsSingleStoryUnlock(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('story_unlocks' as any)
        .select('unlock_type')
        .eq('user_id', user.id)
        .eq('story_id', story.id)
        .eq('unlock_type', 'single')
        .maybeSingle();
      if (!cancelled) setIsSingleStoryUnlock(!!data);
    })();
    return () => { cancelled = true; };
  }, [user?.id, story?.id]);

  // Check admin role (admins are not demo-locked)
  useEffect(() => {
    if (!user?.id) { setIsAdminUser(false); setAdminChecked(true); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!cancelled) { setIsAdminUser(!!data); setAdminChecked(true); }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Demo user = logged in, no completed purchase, not subscriber, not admin, not tester.
  // For demo users, save/share/download/coloring/recording actions are blocked.
  const emailLower = user?.email?.toLowerCase();
  const isTesterAccount = emailLower === TESTER_EMAIL;
  // For the tester account, a localStorage flag toggles between 'demo' and 'admin'. Default = 'demo'.
  const testerMode = isTesterAccount
    ? (typeof window !== 'undefined' ? (localStorage.getItem('tester_mode') ?? 'demo') : 'demo')
    : null;
  const isForcedDemo = testerMode === 'demo';
  const isTester = emailLower === ORIGINAL_TESTER || testerMode === 'admin';
  const isDemoUser = !!user && (
    isForcedDemo ||
    (!hasPurchasedPackage && !isSubscriberUser && !isAdminUser && !isTester && !hasStoryCredits)
  );
  const guardDemo = useCallback((fn: () => void) => {
    return () => {
      if (isDemoUser) {
        setDemoLockOpen(true);
        return;
      }
      fn();
    };
  }, [isDemoUser]);

  // Open paywall popup (from ?paywall=1) only after entitlement checks complete
  // AND the user is actually a demo user. Avoids the brief "flash" for paid users.
  useEffect(() => {
    if (!pendingPaywallOpen) return;
    if (!purchaseChecksReady) return;
    if (isDemoUser) {
      setDemoLockOpen(true);
    }
    setPendingPaywallOpen(false);
  }, [pendingPaywallOpen, purchaseChecksReady, isDemoUser]);

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

  // Show "print PDF" offer when a free/demo user finishes the story (once per story)
  useEffect(() => {
    if (!story?.id || !purchaseChecksReady || !isDemoUser) return;
    const total = (story.pages?.length ?? 0);
    if (total === 0) return;
    if (currentPage < total) return;
    const key = `print_pdf_offer_shown_${story.id}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => {
      setShowPrintPdfOffer(true);
      localStorage.setItem(key, "1");
    }, 600);
    return () => clearTimeout(t);
  }, [currentPage, isDemoUser, story?.id, story?.pages?.length, purchaseChecksReady]);

  // Restore last-viewed page after returning from purchase (or any in-tab navigation)
  const didRestorePageRef = useRef(false);
  useEffect(() => {
    if (didRestorePageRef.current) return;
    if (!story) return;
    // Wait for entitlement checks so we can clamp demo users to their allowed range.
    if (!purchaseChecksReady) return;
    try {
      const saved = sessionStorage.getItem(`storyReturnPage:${location.pathname}`);
      if (saved != null) {
        let n = Number(saved);
        if (Number.isFinite(n) && n > 0) {
          // Demo users may not land on a locked page after returning from /upgrade.
          if (isDemoUser) {
            const maxAllowedIndex = DEMO_PAGE_LIMIT - 1;
            n = Math.min(n, maxAllowedIndex);
          }
          setCurrentPage(n);
        }
      }
    } catch {}
    didRestorePageRef.current = true;
  }, [story, location.pathname, purchaseChecksReady, isDemoUser]);

  // Persist current page so we can restore it after a paywall round-trip
  useEffect(() => {
    try {
      sessionStorage.setItem(`storyReturnPage:${location.pathname}`, String(currentPage));
    } catch {}
  }, [currentPage, location.pathname]);

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
        // Fallback: try public RPC (handles shared links for non-owners / logged-out viewers)
        try {
          const { data: publicData } = await supabase.rpc("get_public_story", {
            p_story_id: storyId as string,
          });
          if (publicData) {
            const pd: any = publicData;
            const resolvedStoryId = pd.id;
            setResolvedId(resolvedStoryId);
            setEditStoryId(resolvedStoryId);
            setGenerationStatus('ready');

            if (pd.slug && storyId !== pd.slug) {
              window.history.replaceState(null, '', `/story/${pd.slug}`);
            }

            const storyObj: Story = {
              id: pd.id,
              slug: pd.slug || undefined,
              child_name: pd.child_name,
              child_gender: pd.child_gender || 'female',
              topic: pd.topic,
              language: pd.language || 'he',
              age_range: pd.age_range || '3-6',
              cover_url: pd.cover_url || undefined,
              pages: (pd.pages || []).map((p: any) => ({
                id: `${pd.id}-${p.page_number}`,
                page_number: p.page_number,
                text: p.text,
                illustration_url: p.illustration_url ?? null,
              })),
              generation_status: 'ready',
            };
            setStory(storyObj);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[StoryViewer] get_public_story RPC fallback failed', e);
        }

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
        setJustCreatedStory(true);
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
              preloadIllustration(p.illustration_url);
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
      const pdfFile = await generatePdfFile(story);

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

  const handleShareWhatsApp = () => {
    if (!story) return;

    const text = `✨ ${story.child_name} קיבל סיפור מותאם אישית ב-SolStorie's! רוצים גם? 👉 soulstory.co.il`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');

    try { trackFeatureUsed('share_whatsapp', story.id); } catch {}
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

      // Fire-and-forget email notification to admin
      supabase.functions.invoke('send-feedback-notification', {
        body: {
          storyName: story?.topic || '',
          childName: story?.child_name || '',
          rating: endFeedbackRating,
          message: endFeedbackMessage.trim() || '',
          userEmail: user?.email || '',
        },
      }).catch(err => console.error('Feedback email error:', err));
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
  const isLearningTopic = story?.topic?.startsWith('אות ') || story?.topic?.startsWith('מספר ') || story?.topic?.startsWith('צבע ') || story?.topic?.startsWith('צורת ');

  // Cover page removed — all ages start at page 0

  const HEBREW_TO_TOPIC_ID: Record<string, string> = {
    'אות א׳': 'letter-alef', 'אות ב׳': 'letter-bet', 'אות ג׳': 'letter-gimel',
    'אות ד׳': 'letter-dalet', 'אות ה׳': 'letter-he', 'אות ו׳': 'letter-vav',
    'אות ז׳': 'letter-zayin', 'אות ח׳': 'letter-chet', 'אות ט׳': 'letter-tet',
    'אות י׳': 'letter-yod', 'אות כ׳': 'letter-kaf', 'אות ל׳': 'letter-lamed',
    'אות מ׳': 'letter-mem', 'אות נ׳': 'letter-nun', 'אות ס׳': 'letter-samekh',
    'אות ע׳': 'letter-ayin', 'אות פ׳': 'letter-pe', 'אות צ׳': 'letter-tsadi',
    'אות ק׳': 'letter-qof', 'אות ר׳': 'letter-resh', 'אות ש׳': 'letter-shin',
    'אות ת׳': 'letter-tav',
    'מספר 1': 'number-1', 'מספר 2': 'number-2', 'מספר 3': 'number-3',
    'מספר 4': 'number-4', 'מספר 5': 'number-5', 'מספר 6': 'number-6',
    'מספר 7': 'number-7', 'מספר 8': 'number-8', 'מספר 9': 'number-9',
    'מספר 10': 'number-10',
    'צבע אדום': 'color-red', 'צבע כחול': 'color-blue', 'צבע צהוב': 'color-yellow',
    'צבע ירוק': 'color-green', 'צבע כתום': 'color-orange', 'צבע סגול': 'color-purple',
    'צבע ורוד': 'color-pink', 'צבע לבן': 'color-white', 'צבע שחור': 'color-black',
    'צורת עיגול': 'shape-circle', 'צורת ריבוע': 'shape-square',
    'צורת משולש': 'shape-triangle', 'צורת מלבן': 'shape-rectangle',
    'צורת לב': 'shape-heart', 'צורת כוכב': 'shape-star',
  };
  const topicPrefix = story?.topic?.split(' – ')[0] || story?.topic || '';
  const resolvedTopicId = HEBREW_TO_TOPIC_ID[topicPrefix];
  const learningPronunciation = resolvedTopicId ? LEARNING_PRONUNCIATION[resolvedTopicId] : null;


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

        if (hasIllustration || hasText) {
          result.push({
            type: 'combined',
            dbPage: page,
            illustrationUrl: page.illustration_url,
            illustrationPrompt: page.illustration_prompt || null,
            text: page.text,
          });
        }
      }
    } else {
      // Ages 3+: separate illustration and text into distinct pages
      // Pattern: illustration-only page → text-only page(s) → illustration-only → ...
      for (const page of story.pages) {
        const hasText = page.text && page.text.trim().length > 0;
        const hasIllustration = !!page.illustration_url;

        // Illustration page — full screen, NO text
        if (hasIllustration) {
          result.push({
            type: 'illustration',
            dbPage: page,
            illustrationUrl: page.illustration_url,
            illustrationPrompt: page.illustration_prompt || null,
            text: '', // empty — no text on illustration pages
          });
        }

        // Text page — always separate
        if (hasText) {
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
  }, [story?.pages, isToddler]);

  useEffect(() => {
    const nextPageIndex = Math.max(currentPage + 1, 0);

    for (let i = nextPageIndex; i < virtualPages.length; i += 1) {
      const nextIllustrationUrl = virtualPages[i]?.illustrationUrl ?? null;
      if (nextIllustrationUrl) {
        preloadIllustration(nextIllustrationUrl);
        break;
      }
    }
  }, [currentPage, virtualPages, preloadIllustration]);

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
  // 0..N-1 = virtual pages, N = end/feedback
  const totalVirtualPages = virtualPages.length;
  const isEndPage = currentPage >= totalVirtualPages;
  const isContentPage = currentPage >= 0 && currentPage < totalVirtualPages;

  const currentVirtual = isContentPage ? virtualPages[currentPage] : null;

  // Demo paywall: limit demo users to first 4 DB pages (free preview)
  const DEMO_PAGE_LIMIT = 4;
  const isLockedVirtualPage = (index: number) => {
    if (!isDemoUser) return false;
    const vp = virtualPages[index];
    if (!vp) return false;
    return (vp.dbPage?.page_number ?? 0) > DEMO_PAGE_LIMIT;
  };
  const isCurrentPageLocked = isContentPage && isLockedVirtualPage(currentPage);
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
    
    const maxPage = totalVirtualPages;
    
    if (direction === 'next' && currentPage >= maxPage) return;
    if (direction === 'prev' && currentPage <= 0) return;

    // Demo paywall: block forward navigation past the free preview limit
    if (direction === 'next' && isLockedVirtualPage(currentPage + 1)) {
      setDemoPaywallOpen(true);
      return;
    }
    
    setSlideDirection(direction);
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
      } else if (direction === 'prev' && currentPage > 0) {
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
        onShare={guardDemo(handleShare)}
            onDownload={guardDemo(() => story && exportToPdf(story))}
        onShareWhatsApp={guardDemo(handleShareWhatsApp)}
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
        onSaveOffline={guardDemo(handleSaveOffline)}
        isSavedOffline={resolvedId ? fullOffline.savedStoryIds.has(resolvedId) : false}
        isDownloadingOffline={fullOffline.downloadingId === resolvedId}
        onRegenerateCover={handleRegenerateCover}
        isRegeneratingCover={isRegeneratingCover}
        onColoring={guardDemo(() => preloadStoryCachedColoring(null))}
      />

      {/* Series navigation bar removed */}

      {/* Portrait overlay removed - vertical layout */}

      {/* Book Container - Vertical Single Page */}
      <main className="flex-1 flex flex-col min-h-0 px-4 md:px-12 lg:px-20 py-2">
        <div className="relative w-full max-w-2xl mx-auto flex-1 min-h-0 flex flex-col">
          <MagicalBookFrame className="flex-1 min-h-0">
            {/* Page content with fade transition */}
            <div className={cn(
              "relative w-full h-full overflow-hidden",
              "transition-opacity duration-300 ease-in-out",
              isFlipping ? "opacity-0" : "opacity-100",
            )}>
            
            {isEndPage ? (
              /* End Page - Feedback & actions */
              <div className="flex flex-col h-full bg-[#FFFBF5] relative">
                {/* Back arrow - top right */}
                <button
                  onClick={() => navigate('/library')}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-purple-50 transition-colors"
                  aria-label="חזרה לספרייה"
                >
                  <ChevronRight className="w-5 h-5 text-purple-500" />
                </button>

                <div data-story-scroll className="flex-1 paper-texture overflow-y-auto p-5 md:p-8 text-center flex flex-col items-center justify-start gap-4 pt-12">
                  {/* Cast image at top */}
                  <img
                    src={castWavingFarewell}
                    alt="הדמויות נפרדות לשלום"
                    className="w-full max-w-sm rounded-2xl object-cover shadow-md"
                    style={{ height: '180px' }}
                  />

                  {/* Title */}
                  <p className="text-2xl md:text-3xl font-bold text-purple-800">קסום, לא? ✨</p>

                  {/* Feedback Box - moved up */}
                  {!endFeedbackSent ? (
                    <div className="w-full max-w-xs bg-white rounded-xl p-4 shadow-lg border border-purple-100 space-y-3 mx-auto" dir="rtl">
                      <h3 className="text-center text-sm font-bold text-purple-800">✨ שתפו אותנו בקסם שלכם</h3>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setEndFeedbackRating(s)}
                            onMouseEnter={() => setEndFeedbackHover(s)} onMouseLeave={() => setEndFeedbackHover(0)}
                            className="p-1 transition-transform hover:scale-125" aria-label={`דירוג ${s} כוכבים`}>
                            <Star className={`w-8 h-8 transition-all duration-300 ${s <= (endFeedbackHover || endFeedbackRating) ? 'fill-amber-400 text-amber-400 scale-110' : 'text-purple-200 animate-pulse-glow-soft'}`}
                              style={{ animationDelay: `${s * 0.15}s` }} />
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
                    <div className="w-full max-w-xs bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 shadow-lg border border-purple-100 text-center mx-auto" dir="rtl">
                      <p className="text-base font-bold text-purple-800">תודה רבה! 💛</p>
                      <p className="text-xs text-purple-600 mt-1">המשוב שלכם עוזר לנו ליצור סיפורים טובים יותר</p>
                    </div>
                  )}

                  {/* Two separate coloring buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto pt-2">
                    <Button
                      onClick={guardDemo(() => preloadStoryCachedColoring('print'))}
                      disabled={coloringLoading}
                      className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white px-4 py-3 rounded-full text-sm gap-1"
                    >
                      {coloringLoading && coloringMode === 'print' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> מכין...</>
                      ) : (
                        <>🖨️ הדפסה</>
                      )}
                    </Button>
                    <Button
                      onClick={guardDemo(() => preloadStoryCachedColoring('online'))}
                      disabled={coloringLoading}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-3 rounded-full text-sm gap-1"
                    >
                      {coloringLoading && coloringMode === 'online' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> מכין...</>
                      ) : (
                        <>🎨 צביעה אונליין</>
                      )}
                    </Button>
                  </div>

                  {/* Upgrade CTA — only when story was unlocked via a single purchase */}
                  {isSingleStoryUnlock && !hasPurchasedPackage && (
                    <button
                      onClick={() => navigate(`/upgrade?firstStory=${story?.id ?? ''}&from=single_upgrade`)}
                      className="mt-2 w-full max-w-xs mx-auto bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white font-black text-sm px-4 py-3 rounded-full shadow-lg hover:scale-[1.02] transition-transform"
                    >
                      שדרג לחבילה מלאה וחסוך! ✨
                    </button>
                  )}

                  {/* Footer message */}
                  <p className="text-sm text-purple-600 pt-2">נתראה בסיפור הבא 💜</p>

                </div>
              </div>

            ) : currentVirtual ? (
              /* Story Content Pages */
              <div className="h-full w-full relative animate-fade-in">
                {currentVirtual.type === 'combined' ? (
                  /* Combined page (ages 0-2) — fullscreen illustration + text overlay */
                  <>
                    {currentVirtual.illustrationUrl ? (
                      <>
                        {!imageLoadedMap[currentVirtual.illustrationUrl] && (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#F5E6D3] to-[#FAF3E8] z-[1]">
                            <div className="relative z-10 text-center space-y-3">
                              <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 via-pink-300 to-orange-300 animate-spin" style={{ animationDuration: '3s' }} />
                                <div className="absolute inset-1 rounded-full bg-white/90 flex items-center justify-center">
                                  <span className="text-2xl">✨</span>
                                </div>
                              </div>
                              <p className="text-xs text-[#8B7355] font-serif">טוען איור...</p>
                            </div>
                          </div>
                        )}
                        <img
                          key={`${currentVirtual.illustrationUrl}-${failedImages[currentVirtual.illustrationUrl] || 0}`}
                          src={`${getPublicIllustrationUrl(currentVirtual.illustrationUrl) || ''}${failedImages[currentVirtual.illustrationUrl] ? `?retry=${failedImages[currentVirtual.illustrationUrl]}` : ''}`}
                          alt="איור"
                          className={cn("absolute inset-0 w-full h-full transition-opacity duration-500 object-cover", imageLoadedMap[currentVirtual.illustrationUrl] ? "opacity-100" : "opacity-0")}
                          style={{ transform: 'scale(1.02)' }}
                          loading="eager"
                          onLoad={(e) => {
                            handleImageLoad(e);
                            setImageLoadedMap(prev => ({ ...prev, [currentVirtual.illustrationUrl!]: true }));
                          }}
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
                      </>
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
                    {/* Dedication overlay on first page */}
                    {currentPage === 0 && story && (
                      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
                        <div className="text-center text-white drop-shadow-lg flex flex-col items-center gap-1" dir="rtl">
                          <span className="text-base md:text-lg font-bold">הספר הזה נוצר במיוחד עבורך</span>
                          <span className="text-2xl md:text-3xl font-black">{story.child_name} 💙</span>
                        </div>
                      </div>
                    )}
                    {/* Text overlay at the bottom */}
                    {currentVirtual.text && currentVirtual.text.trim() && currentVirtual.dbPage.page_number !== 1 && (
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
                        onStartRecording={guardDemo(() => pageRecording.startRecording(currentVirtual.dbPage.page_number))}
                        onStopRecording={pageRecording.stopRecording}
                        onSave={guardDemo(pageRecording.saveRecording)}
                        onDiscard={pageRecording.discardPending}
                        onPlay={guardDemo(() => pageRecording.playRecording(currentVirtual.dbPage.page_number))}
                        onStopPlaying={pageRecording.stopPlaying}
                        light
                      />
                    </div>
                  </>
                ) : currentVirtual.type === 'illustration' ? (
                  /* Illustration-only page — fullscreen image, no text */
                  <>
                    {currentVirtual.illustrationUrl ? (
                      <>
                        {!imageLoadedMap[currentVirtual.illustrationUrl] && (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#F5E6D3] to-[#FAF3E8] z-[1]">
                            <div className="relative z-10 text-center space-y-3">
                              <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 via-pink-300 to-orange-300 animate-spin" style={{ animationDuration: '3s' }} />
                                <div className="absolute inset-1 rounded-full bg-white/90 flex items-center justify-center">
                                  <span className="text-2xl">✨</span>
                                </div>
                              </div>
                              <p className="text-xs text-[#8B7355] font-serif">טוען איור...</p>
                            </div>
                          </div>
                        )}
                        <img
                          key={`${currentVirtual.illustrationUrl}-${failedImages[currentVirtual.illustrationUrl] || 0}`}
                          src={`${getPublicIllustrationUrl(currentVirtual.illustrationUrl) || ''}${failedImages[currentVirtual.illustrationUrl] ? `?retry=${failedImages[currentVirtual.illustrationUrl]}` : ''}`}
                          alt="איור"
                           className={cn("absolute inset-0 w-full h-full transition-opacity duration-500 object-cover", imageLoadedMap[currentVirtual.illustrationUrl] ? "opacity-100" : "opacity-0")}
                           style={{ transform: 'scale(1.02)' }}
                          loading="eager"
                          onLoad={(e) => {
                            handleImageLoad(e);
                            setImageLoadedMap(prev => ({ ...prev, [currentVirtual.illustrationUrl!]: true }));
                          }}
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
                      </>
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
                    {/* Dedication overlay on first illustration page */}
                    {currentPage === 0 && story && (
                      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
                        <div className="text-center text-white drop-shadow-lg flex flex-col items-center gap-1" dir="rtl">
                          <span className="text-base md:text-lg font-bold">הספר הזה נוצר במיוחד עבורך</span>
                          <span className="text-2xl md:text-3xl font-black">{story.child_name} 💙</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center z-10">
                      <span className="text-xs text-white/40 font-light">{currentPage + 1} / {virtualPages.length}</span>
                    </div>
                    <div className="absolute top-3 left-3 z-20">
                      <PageRecordingControls
                        pageNumber={currentVirtual.dbPage.page_number}
                        isRecording={pageRecording.recordingPage === currentVirtual.dbPage.page_number}
                        hasPendingBlob={pageRecording.pendingBlob?.page === currentVirtual.dbPage.page_number}
                        hasSaved={pageRecording.hasSavedRecording(currentVirtual.dbPage.page_number)}
                        isPlaying={pageRecording.playingPage === currentVirtual.dbPage.page_number}
                        onStartRecording={guardDemo(() => pageRecording.startRecording(currentVirtual.dbPage.page_number))}
                        onStopRecording={pageRecording.stopRecording}
                        onSave={guardDemo(pageRecording.saveRecording)}
                        onDiscard={pageRecording.discardPending}
                        onPlay={guardDemo(() => pageRecording.playRecording(currentVirtual.dbPage.page_number))}
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
                            onStartRecording={guardDemo(() => pageRecording.startRecording(currentVirtual.dbPage.page_number))}
                            onStopRecording={pageRecording.stopRecording}
                            onSave={guardDemo(pageRecording.saveRecording)}
                            onDiscard={pageRecording.discardPending}
                            onPlay={guardDemo(() => pageRecording.playRecording(currentVirtual.dbPage.page_number))}
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

          {/* Watermark — non-clickable, shown only on illustration/cover pages */}
          {!isEndPage && currentVirtual && currentVirtual.type !== 'text' && (
            <div
              className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 opacity-30 pointer-events-none select-none"
              aria-hidden="true"
            >
              <span className="text-[11px] font-black logo-3d-bubble">
                <span className="logo-rainbow">SolStorie's™</span>
              </span>
            </div>
          )}

          {/* Bottom nav arrows */}
          <div className="absolute bottom-2 left-0 right-0 z-40 flex items-center justify-between px-4">
            <button
              onClick={() => handlePageNav('next')}
              disabled={currentPage >= totalVirtualPages || isFlipping}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/50 text-white/80 hover:text-white backdrop-blur-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="עמוד הבא"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => handlePageNav('prev')}
              disabled={currentPage <= -1 || isFlipping}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/50 text-white/80 hover:text-white backdrop-blur-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="עמוד קודם"
            >
              <ChevronRight className="w-5 h-5" />
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

      {/* Buy package to print PDF dialog */}
      <AlertDialog open={showBuyToPrintDialog} onOpenChange={setShowBuyToPrintDialog}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">✨ הפוך את הסיפור לספר אמיתי!</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-relaxed">
              הסיפור של {story?.child_name} מוכן ומחכה להיהפך לספר מודפס שישמח אותו שנים קדימה. כדי להוריד את הסיפור כקובץ PDF מוכן להדפסה, בחרו חבילת סיפורים שתתאים לכם.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>אולי אחר כך</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowBuyToPrintDialog(false);
                navigate('/upgrade');
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            >
              🎁 לרכישת חבילה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print book preview modal */}
      {story && (
        <PrintBookPreviewModal
          open={showPrintPreviewModal}
          onOpenChange={setShowPrintPreviewModal}
          childName={story.child_name}
          storyTitle={translateTopic(story.topic, story.language)}
          coverUrl={story.cover_url}
          pages={(story.pages || []).slice(0, 4).map(p => ({ illustration_url: p.illustration_url || null, text: p.text || '' }))}
          onDownload={() => {
            setShowPrintPreviewModal(false);
            if (hasPurchasedPackage) {
              exportToPdf(story);
            } else {
              setShowBuyToPrintDialog(true);
            }
          }}
        />
      )}

      {/* Demo lock modal — shown when demo users try to save/share/download/color/record */}
      <DemoLockModal open={demoLockOpen} onOpenChange={setDemoLockOpen} storyId={storyId} />
      <DemoLockModal
        open={demoPaywallOpen}
        onOpenChange={setDemoPaywallOpen}
        title="✨ רוצים לקרוא את הסיפור המלא?"
        description="רוצים להמשיך לקרוא את הסיפור? ב־29.90₪ בלבד וקבלו קרדיט לסיפור נוסף חינם! 🎁"
        storyId={storyId}
      />

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

      {/* Print PDF offer for free users on last page */}
      <PrintPdfOfferModal
        open={showPrintPdfOffer}
        onOpenChange={setShowPrintPdfOffer}
        coverUrl={story?.cover_url || null}
        childName={story?.child_name}
        storyTitle={story?.child_name ? `הסיפור של ${story.child_name}` : undefined}
        onPurchase={() => {
          setShowPrintPdfOffer(false);
          navigate(`/upgrade?firstStory=${storyId || ""}`);
        }}
      />

      {/* Install App Prompt - shown only after reaching last page */}
      <InstallAppPrompt justCreatedFirstStory={justCreatedStory && isEndPage} />

      {/* Coloring Picker Dialog — global so it works from header icon too */}
      <Dialog open={coloringPickerOpen} onOpenChange={(open) => {
        setColoringPickerOpen(open);
        if (!open) { setColoringAction('pick'); setColoringMode(null); }
      }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              {coloringAction === 'pick' ? '🎨 בחרו איור לדף צביעה' : '🎨 מה תרצו לעשות?'}
            </DialogTitle>
          </DialogHeader>

          {coloringAction === 'pick' ? (
            <>
              <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto p-1">
                {story?.pages?.filter(p => p.illustration_url).map((page, idx) => {
                  const url = getPublicIllustrationUrl(page.illustration_url!);
                  const isSelected = selectedColoringUrl === page.illustration_url;
                  return (
                    <button
                      key={page.id || idx}
                      onClick={() => setSelectedColoringUrl(page.illustration_url!)}
                      className={cn(
                        "relative rounded-lg overflow-hidden border-2 transition-all aspect-square",
                        isSelected ? "border-purple-500 ring-2 ring-purple-300 scale-105" : "border-transparent hover:border-purple-200"
                      )}
                    >
                      <img src={url!} alt={`עמוד ${page.page_number}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                        עמוד {page.page_number}
                      </span>
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                          <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">✓</div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={async () => {
                  if (!selectedColoringUrl || !story) return;
                  if (!coloringMode) {
                    setColoringAction('choose-action');
                    return;
                  }
                  setColoringPickerOpen(false);
                  setColoringLoading(true);
                  try {
                    const response = await supabase.functions.invoke("generate-coloring-page", {
                      body: { illustration_url: getPublicIllustrationUrl(selectedColoringUrl), story_id: story.id },
                    });
                    if (response.error) throw response.error;
                    if ((response.data as any)?.upsell) {
                      sonnerToast.error("נגמרו קרדיטי הצביעה 🎨", {
                        action: { label: "לרכישה", onClick: () => navigate("/upgrade") },
                      });
                      return;
                    }
                    const coloringUrl = (response.data as any)?.image;
                    if (!coloringUrl) throw new Error("No coloring URL returned");
                    if (coloringMode === 'online') {
                      setOnlineColoringImageUrl(coloringUrl);
                      setOnlineColoringOpen(true);
                    } else {
                      window.open(coloringUrl, '_blank');
                    }
                  } catch (err: any) {
                    console.error("Coloring error:", err);
                    toast({ title: "שגיאה ביצירת דף צביעה", description: err.message, variant: "destructive" });
                  } finally {
                    setColoringLoading(false);
                  }
                }}
                disabled={!selectedColoringUrl || coloringLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {coloringLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> מכין דף צביעה...</> : 'המשך →'}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              {cachedColoringUrl && (
                <div className="rounded-lg overflow-hidden border border-purple-200 mb-2">
                  <img src={cachedColoringUrl} alt="דף צביעה" className="w-full max-h-48 object-contain bg-white" />
                </div>
              )}

              <Button
                onClick={async () => {
                  if (!story || !selectedColoringUrl) return;
                  const triggerDownload = async (url: string) => {
                    try {
                      const res = await fetch(url);
                      const blob = await res.blob();
                      // Trim white margins before downloading
                      const trimmedBlob = await new Promise<Blob>((resolve) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => {
                          const c = document.createElement('canvas');
                          c.width = img.naturalWidth;
                          c.height = img.naturalHeight;
                          const ctx = c.getContext('2d')!;
                          ctx.drawImage(img, 0, 0);
                          const data = ctx.getImageData(0, 0, c.width, c.height).data;
                          const w = c.width, h = c.height;
                          const WHITE = 245;
                          let top = 0, bottom = h - 1, left = 0, right = w - 1;
                          scan_top: for (let y = 0; y < h; y++) {
                            for (let x = 0; x < w; x++) {
                              const i = (y * w + x) * 4;
                              if (data[i] < WHITE || data[i+1] < WHITE || data[i+2] < WHITE) { top = y; break scan_top; }
                            }
                          }
                          scan_bottom: for (let y = h - 1; y >= top; y--) {
                            for (let x = 0; x < w; x++) {
                              const i = (y * w + x) * 4;
                              if (data[i] < WHITE || data[i+1] < WHITE || data[i+2] < WHITE) { bottom = y; break scan_bottom; }
                            }
                          }
                          scan_left: for (let x = 0; x < w; x++) {
                            for (let y = top; y <= bottom; y++) {
                              const i = (y * w + x) * 4;
                              if (data[i] < WHITE || data[i+1] < WHITE || data[i+2] < WHITE) { left = x; break scan_left; }
                            }
                          }
                          scan_right: for (let x = w - 1; x >= left; x--) {
                            for (let y = top; y <= bottom; y++) {
                              const i = (y * w + x) * 4;
                              if (data[i] < WHITE || data[i+1] < WHITE || data[i+2] < WHITE) { right = x; break scan_right; }
                            }
                          }
                          const pad = 4;
                          top = Math.max(0, top - pad); left = Math.max(0, left - pad);
                          bottom = Math.min(h - 1, bottom + pad); right = Math.min(w - 1, right + pad);
                          const tw = right - left + 1, th = bottom - top + 1;
                          const trimmed = document.createElement('canvas');
                          trimmed.width = tw; trimmed.height = th;
                          const tCtx = trimmed.getContext('2d')!;
                          tCtx.drawImage(img, left, top, tw, th, 0, 0, tw, th);
                          trimmed.toBlob((b) => resolve(b || blob), 'image/png');
                        };
                        img.onerror = () => resolve(blob);
                        img.src = URL.createObjectURL(blob);
                      });
                      const blobUrl = URL.createObjectURL(trimmedBlob);
                      const link = document.createElement('a');
                      link.href = blobUrl;
                      link.download = `coloring-page-${story.id}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(blobUrl);
                    } catch {
                      window.open(url, '_blank');
                    }
                  };
                  const urlToUse = getMatchingCachedColoringUrl();
                  if (urlToUse) {
                    await triggerDownload(urlToUse);
                    setColoringPickerOpen(false);
                  } else {
                    setColoringLoading(true);
                    try {
                      const response = await supabase.functions.invoke("generate-coloring-page", {
                        body: { illustration_url: getPublicIllustrationUrl(selectedColoringUrl), story_id: story.id },
                      });
                      if (response.error) throw response.error;
                      if ((response.data as any)?.upsell) {
                        sonnerToast.error("נגמרו קרדיטי הצביעה 🎨", {
                          action: { label: "לרכישה", onClick: () => navigate("/upgrade") },
                        });
                        return;
                      }
                      const coloringUrl = (response.data as any)?.image;
                      if (!coloringUrl) throw new Error("No coloring URL returned");
                      setCachedColoringUrl(coloringUrl);
                      setCachedIllustrationUrl(getPublicIllustrationUrl(selectedColoringUrl));
                      await triggerDownload(coloringUrl);
                      setColoringPickerOpen(false);
                    } catch (err: any) {
                      console.error("Coloring error:", err);
                      toast({ title: "שגיאה ביצירת דף צביעה", description: err.message, variant: "destructive" });
                    } finally {
                      setColoringLoading(false);
                    }
                  }
                }}
                disabled={coloringLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-3"
              >
                {coloringLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> מכין דף צביעה...</> : '🖨️ הדפיסו דף צביעה'}
              </Button>

              <Button
                onClick={async () => {
                  if (!story || !selectedColoringUrl) return;
                  const urlToUse = getMatchingCachedColoringUrl();
                  if (urlToUse) {
                    setOnlineColoringImageUrl(urlToUse);
                    setOnlineColoringOpen(true);
                    setColoringPickerOpen(false);
                  } else {
                    setColoringPickerOpen(false);
                    setColoringLoading(true);
                    try {
                      const response = await supabase.functions.invoke("generate-coloring-page", {
                        body: { illustration_url: getPublicIllustrationUrl(selectedColoringUrl), story_id: story.id },
                      });
                      if (response.error) throw response.error;
                      if ((response.data as any)?.upsell) {
                        sonnerToast.error("נגמרו קרדיטי הצביעה 🎨", {
                          action: { label: "לרכישה", onClick: () => navigate("/upgrade") },
                        });
                        return;
                      }
                      const coloringUrl = (response.data as any)?.image;
                      if (!coloringUrl) throw new Error("No coloring URL returned");
                      setCachedColoringUrl(coloringUrl);
                      setCachedIllustrationUrl(getPublicIllustrationUrl(selectedColoringUrl));
                      setOnlineColoringImageUrl(coloringUrl);
                      setOnlineColoringOpen(true);
                    } catch (err: any) {
                      console.error("Coloring error:", err);
                      toast({ title: "שגיאה ביצירת דף צביעה", description: err.message, variant: "destructive" });
                    } finally {
                      setColoringLoading(false);
                    }
                  }
                }}
                variant="outline"
                disabled={coloringLoading}
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 py-3"
              >
                {coloringLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> מכין דף צביעה...</> : '🎨 צביעה אונליין'}
              </Button>

              <button
                onClick={() => {
                  setSelectedColoringUrl(null);
                  setCachedColoringUrl(null);
                  setCachedIllustrationUrl(null);
                  setColoringAction('pick');
                }}
                className="w-full text-xs text-purple-400 hover:text-purple-600 transition-colors"
              >
                ← בחרו איור אחר
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Online Coloring Canvas */}
      <OnlineColoringCanvas
        isOpen={onlineColoringOpen}
        onClose={() => setOnlineColoringOpen(false)}
        backgroundImage={onlineColoringImageUrl || ''}
        childName={story?.child_name}
        storyTitle={story?.topic}
      />

    </div>
  );
};

export default StoryViewer;
