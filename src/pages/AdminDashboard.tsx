import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, ShoppingCart, BookOpen, TrendingUp, ArrowRight, AlertTriangle, EyeOff, Eye, Trash2, Palette, Image, Ticket, ChevronDown, ChevronUp, Activity, Copy, Mail, CalendarPlus, RefreshCw, Clock, Search, RotateCcw, XCircle, Unlock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfDay } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ServiceHealthSection from "@/components/admin/ServiceHealthSection";

interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
  story_credits: number | null;
  coloring_credits: number | null;
  editing_credits: number | null;
  is_subscriber: boolean;
  user_role: string;
  email?: string;
}

interface PurchaseRow {
  id: string;
  user_id: string;
  package_name: string;
  credits_purchased: number;
  amount_ils: number;
  status: string | null;
  created_at: string | null;
}

interface StoryRow {
  id: string;
  child_name: string;
  topic: string;
  created_at: string;
  user_id: string | null;
  generation_status: string | null;
}

interface ErrorLogRow {
  id: string;
  user_id: string | null;
  error_type: string;
  error_message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface IllustrationLogRow {
  id: string;
  story_id: string;
  page_number: number;
  model_used: string;
  fallback_reason: string | null;
  had_face_reference: boolean;
  duration_ms: number | null;
  created_at: string;
}

interface CouponRow {
  id: string;
  code: string;
  coupon_type: string;
  free_stories: number | null;
  discount_percent: number | null;
  current_uses: number | null;
  max_uses: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface CouponRedemptionRow {
  id: string;
  coupon_id: string;
  user_id: string;
  redeemed_at: string | null;
}

interface FeedbackRow {
  id: string;
  user_id: string | null;
  rating: number | null;
  message: string | null;
  display_name: string | null;
  page_url: string | null;
  created_at: string;
  is_approved: boolean | null;
}

interface CoverLogRow {
  id: string;
  story_id: string;
  selected_illustration_prompt: string | null;
  had_face_reference: boolean;
  cast_character: string | null;
  topic_setting: string | null;
  story_context: string | null;
  cover_path: string;
  duration_ms: number | null;
  created_at: string;
}

const ADMIN_EMAILS = ["carmit1901@gmail.com", "carmit1901+test@gmail.com"];

const EXCLUDED_IDS = [
  "c9dcaa57-43de-471e-8b09-a195074d1855",
  "49cd7676-ab96-496b-9287-61a9d67d3e68",
];

const errorTypeLabels: Record<string, string> = {
  illustration_timeout: "Timeout איורים",
  illustration_fal_error: "כשל Fal.ai",
  illustration_general_error: "שגיאת איורים כללית",
  story_generation_error: "כשל יצירת סיפור",
  story_parse_error: "שגיאת פענוח AI",
  story_insert_error: "שגיאת שמירת סיפור",
  story_general_error: "שגיאה כללית בסיפור",
};

const errorCategoryMap: Record<string, string> = {
  illustration_timeout: "איורים",
  illustration_fal_error: "איורים",
  illustration_general_error: "איורים",
  story_generation_error: "יצירת סיפור",
  story_parse_error: "יצירת סיפור",
  story_insert_error: "יצירת סיפור",
  story_general_error: "יצירת סיפור",
};

const getErrorExplanation = (e: ErrorLogRow): string => {
  if (e.error_message?.includes("402") || e.error_message?.includes("quota") || e.error_message?.includes("credits")) {
    return "נגמרו קרדיטי AI — יש להוסיף יתרה בהגדרות";
  }
  if (e.error_type?.includes("timeout")) return "תם הזמן לייצור האיור — עומס במערכת";
  if (e.error_type?.includes("fal_error")) return "שירות האיורים החיצוני החזיר שגיאה";
  if (e.error_type?.includes("parse")) return "ה-AI החזיר תשובה שלא ניתן לפענח";
  if (e.error_type?.includes("insert")) return "נכשלה שמירת הסיפור בבסיס הנתונים";
  return errorTypeLabels[e.error_type] || e.error_type;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLogRow[]>([]);
  const [illustrationLogs, setIllustrationLogs] = useState<IllustrationLogRow[]>([]);
  const [coverLogs, setCoverLogs] = useState<CoverLogRow[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [couponRedemptions, setCouponRedemptions] = useState<CouponRedemptionRow[]>([]);
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [feedbackStories, setFeedbackStories] = useState<Record<string, { child_name: string; topic: string }>>({});
  const [feedbackEmails, setFeedbackEmails] = useState<Record<string, string>>({});
  const [storyUnlocks, setStoryUnlocks] = useState<{ user_id: string; story_id: string }[]>([]);
  const [unlockDialogUserId, setUnlockDialogUserId] = useState<string | null>(null);
  const [unlockingStoryId, setUnlockingStoryId] = useState<string | null>(null);
  const [dialogStories, setDialogStories] = useState<StoryRow[]>([]);
  const [dialogStoriesLoading, setDialogStoriesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const { toast } = useToast();
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>("all");
  const [errorDaysFilter, setErrorDaysFilter] = useState<string>("7");
  const [errorCategoryFilter, setErrorCategoryFilter] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Search states per tab
  const [usersSearch, setUsersSearch] = useState("");
  const [storiesSearch, setStoriesSearch] = useState("");
  const [purchasesSearch, setPurchasesSearch] = useState("");
  const [errorsSearch, setErrorsSearch] = useState("");

  // Recycle bin state — persisted in localStorage
  const TRASH_KEY = "admin_trash";
  const [trashedItems, setTrashedItems] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(TRASH_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const trashItem = useCallback((tab: string, id: string) => {
    setTrashedItems(prev => {
      const next = { ...prev, [tab]: [...(prev[tab] || []), id] };
      localStorage.setItem(TRASH_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const restoreItem = useCallback((tab: string, id: string) => {
    setTrashedItems(prev => {
      const next = { ...prev, [tab]: (prev[tab] || []).filter(i => i !== id) };
      if (next[tab]?.length === 0) delete next[tab];
      localStorage.setItem(TRASH_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const permanentDeleteItem = useCallback((tab: string, id: string) => {
    restoreItem(tab, id); // Just removes from trash view
  }, [restoreItem]);

  const isTrashed = useCallback((tab: string, id: string) => {
    return (trashedItems[tab] || []).includes(id);
  }, [trashedItems]);

  // Ref to hold profiles for realtime callback
  const profilesRef = useRef<ProfileRow[]>([]);
  useEffect(() => { profilesRef.current = profiles; }, [profiles]);

  // "Mark as reviewed" — store cutoff timestamps per tab in localStorage
  const REVIEWED_KEY = "admin_reviewed_";
  const [reviewedCutoffs, setReviewedCutoffs] = useState<Record<string, string>>(() => {
    const saved: Record<string, string> = {};
    ["users", "purchases", "stories", "errors", "illustrations", "covers"].forEach(tab => {
      const val = localStorage.getItem(REVIEWED_KEY + tab);
      if (val) saved[tab] = val;
    });
    return saved;
  });
  const [showReviewed, setShowReviewed] = useState<Record<string, boolean>>({ users: false, purchases: false, stories: false, errors: false, illustrations: false, covers: false });
  const [confirmClearTab, setConfirmClearTab] = useState<string | null>(null);

  const markAsReviewed = useCallback((tab: string) => {
    const now = new Date().toISOString();
    localStorage.setItem(REVIEWED_KEY + tab, now);
    setReviewedCutoffs(prev => ({ ...prev, [tab]: now }));
    toast({ title: "סומן כנצפה ✓", description: "פריטים ישנים יוסתרו. ניתן להציגם בלחיצה על 'הצג נצפים'" });
    setConfirmClearTab(null);
  }, [toast]);

  const clearReviewed = useCallback((tab: string) => {
    localStorage.removeItem(REVIEWED_KEY + tab);
    setReviewedCutoffs(prev => {
      const next = { ...prev };
      delete next[tab];
      return next;
    });
  }, []);

  const handleUnlockStory = useCallback(async (userId: string, storyId: string) => {
    console.log("[ADMIN] Unlocking story:", { userId, storyId });
    setUnlockingStoryId(storyId);
    const { error } = await supabase.from("story_unlocks").insert({
      user_id: userId,
      story_id: storyId,
      unlock_type: "admin_manual",
      amount_paid: 0,
    });
    setUnlockingStoryId(null);
    if (error) {
      console.error("[ADMIN] Unlock failed:", error);
      if ((error as any).code === "23505") {
        toast({ title: "הסיפור כבר פתוח", description: "המשתמש כבר קיבל גישה לסיפור זה" });
      } else {
        toast({ title: "שגיאה בפתיחת הסיפור", description: error.message, variant: "destructive" });
      }
      return;
    }
    setStoryUnlocks(prev => [...prev, { user_id: userId, story_id: storyId }]);
    toast({ title: "הסיפור נפתח ✓", description: "המשתמש יקבל גישה מיידית" });
  }, [toast]);

  // Fetch the target user's stories + unlocks directly whenever the unlock
  // dialog opens — the cached `stories` state is limited to 500 rows and
  // filtered, so it may not contain the specific story we need to unlock.
  useEffect(() => {
    if (!unlockDialogUserId) {
      setDialogStories([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setDialogStoriesLoading(true);
      const [storiesRes, unlocksRes] = await Promise.all([
        supabase
          .from("stories")
          .select("id, child_name, topic, created_at, user_id, generation_status")
          .eq("user_id", unlockDialogUserId)
          .order("created_at", { ascending: false }),
        supabase
          .from("story_unlocks")
          .select("user_id, story_id")
          .eq("user_id", unlockDialogUserId),
      ]);
      if (cancelled) return;
      setDialogStories((storiesRes.data as StoryRow[]) || []);
      if (unlocksRes.data) {
        setStoryUnlocks(prev => {
          const next = prev.filter(u => u.user_id !== unlockDialogUserId);
          return [...next, ...(unlocksRes.data as { user_id: string; story_id: string }[])];
        });
      }
      setDialogStoriesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [unlockDialogUserId]);

  const filterByReviewed = <T extends { created_at: string | null }>(items: T[], tab: string): T[] => {
    const cutoff = reviewedCutoffs[tab];
    if (!cutoff || showReviewed[tab]) return items;
    return items.filter(item => item.created_at && new Date(item.created_at) > new Date(cutoff));
  };

  // Wait for auth to be ready before checking
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setAuthReady(true);
    });
    supabase.auth.getSession().then(() => setAuthReady(true));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) { navigate("/auth"); return; }

    const checkAdmin = async () => {
      if (!user.email || !ADMIN_EMAILS.includes(user.email)) { navigate("/"); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [user, navigate, authReady]);

  const fetchAllData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);

    const [profilesRes, purchasesRes, storiesRes, emailsRes, couponsRes, redemptionsRes, errorsRes, illustrationsRes, coversRes, fbRes, unlocksRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name, email, created_at, story_credits, coloring_credits, editing_credits, is_subscriber, user_role").not("id", "in", `(${EXCLUDED_IDS.join(",")})`).order("created_at", { ascending: false }).limit(500),
      // Do NOT exclude admin/test users from purchases — they need to be
      // visible in the dashboard so admins can verify that the Grow / PayPal
      // flow actually produced a row. Filtering by EXCLUDED_IDS here was
      // hiding every recorded purchase and making the counter read 0.
      supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("stories").select("id, child_name, topic, created_at, user_id, generation_status").not("user_id", "in", `(${EXCLUDED_IDS.join(",")})`).order("created_at", { ascending: false }).limit(500),
      supabase.rpc("get_admin_user_emails"),
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("coupon_redemptions").select("*"),
      supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("illustration_logs").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("cover_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_feedback").select("id, user_id, rating, message, display_name, page_url, created_at, is_approved").order("created_at", { ascending: false }).limit(200),
      supabase.from("story_unlocks").select("user_id, story_id").limit(2000),
    ]);

    const emailMap = new Map<string, string>();
    if (emailsRes.data) {
      (emailsRes.data as { user_id: string; email: string }[]).forEach(e => emailMap.set(e.user_id, e.email));
    } else if (emailsRes.error) {
      console.warn('[AdminDashboard] get_admin_user_emails RPC failed:', emailsRes.error);
    }
    const adminUserIds = [...emailMap.entries()].filter(([, email]) => ADMIN_EMAILS.includes(email)).map(([id]) => id);

    if (profilesRes.data) {
      setProfiles(profilesRes.data
        .filter(p => !ADMIN_EMAILS.includes(emailMap.get(p.id) || (p as any).email || ""))
        .map(p => ({ ...p, email: emailMap.get(p.id) || (p as any).email || undefined })) as ProfileRow[]);
    }

    const filterAdmin = <T extends { user_id?: string | null }>(data: T[] | null): T[] => {
      if (!data) return [];
      if (adminUserIds.length === 0) return data;
      return data.filter(item => !item.user_id || !adminUserIds.includes(item.user_id));
    };

    // Keep ALL purchases visible — including those made by admin/test accounts
    // — so the dashboard reflects what actually landed in the DB.
    setPurchases((purchasesRes.data ?? []) as PurchaseRow[]);
    setStories(filterAdmin(storiesRes.data));
    if (unlocksRes.data) setStoryUnlocks(unlocksRes.data as { user_id: string; story_id: string }[]);
    setCoupons((couponsRes.data as CouponRow[]) || []);
    setCouponRedemptions((redemptionsRes.data as CouponRedemptionRow[]) || []);
    if (errorsRes.data) setErrorLogs(errorsRes.data as ErrorLogRow[]);
    if (illustrationsRes.data) setIllustrationLogs(illustrationsRes.data as IllustrationLogRow[]);
    if (coversRes.data) setCoverLogs(coversRes.data as CoverLogRow[]);

    if (fbRes.data) {
      const fbData = fbRes.data as FeedbackRow[];
      setFeedbacks(fbData);
      const storyIds = fbData.map(f => f.page_url?.match(/story\/([a-f0-9-]{36})/)?.[1]).filter((id): id is string => !!id);
      const uniqueStoryIds = [...new Set(storyIds)];
      if (uniqueStoryIds.length > 0) {
        const { data: storiesData } = await supabase.from("stories").select("id, child_name, topic").in("id", uniqueStoryIds);
        if (storiesData) {
          const map: Record<string, { child_name: string; topic: string }> = {};
          storiesData.forEach(s => { map[s.id] = { child_name: s.child_name, topic: s.topic }; });
          setFeedbackStories(map);
        }
      }
      const fbEmailMap: Record<string, string> = {};
      emailMap.forEach((email, uid) => { fbEmailMap[uid] = email; });
      setFeedbackEmails(fbEmailMap);
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, [isAdmin]);

  // Initial fetch + auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAdmin) return;
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, fetchAllData]);

  // Realtime subscription for new purchases
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('admin-purchases-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'purchases' },
        (payload) => {
          const newPurchase = payload.new as PurchaseRow;
          // Play notification chime
          try {
            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 880;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
          } catch (e) { console.warn('Audio notification failed', e); }

          // Show toast
          const profile = profilesRef.current.find(p => p.id === newPurchase.user_id);
          const userName = profile?.display_name || profile?.email || 'משתמש';
          sonnerToast.success('💰 רכישה חדשה!', {
            description: `${userName} רכש ${newPurchase.package_name} — ₪${Number(newPurchase.amount_ils).toLocaleString()}`,
            duration: 10000,
          });

          // Refresh data
          fetchAllData();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, fetchAllData]);

  const todayStart = startOfDay(new Date());
  const weekAgo = subDays(new Date(), 7);
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  const totalRevenue = purchases.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount_ils), 0);
  const errorsToday = errorLogs.filter(e => new Date(e.created_at) >= todayStart).length;
  const registeredThisWeek = profiles.filter(p => new Date(p.created_at) >= weekAgo).length;
  const storiesToday = stories.filter(s => new Date(s.created_at) >= todayStart).length;
  const storiesThisWeek = stories.filter(s => new Date(s.created_at) >= weekAgo).length;
  const failedStories = stories.filter(s => s.generation_status && s.generation_status !== "ready").length;
  const activeUsersToday = new Set(stories.filter(s => new Date(s.created_at) >= todayStart && s.user_id).map(s => s.user_id!)).size;

  // Filtered error logs
  const filteredErrors = useMemo(() => {
    let filtered = errorLogs;
    if (errorTypeFilter !== "all") filtered = filtered.filter(e => e.error_type === errorTypeFilter);
    if (errorCategoryFilter !== "all") filtered = filtered.filter(e => (errorCategoryMap[e.error_type] || "אחר") === errorCategoryFilter);
    if (errorDaysFilter !== "all") {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(errorDaysFilter));
      filtered = filtered.filter(e => new Date(e.created_at) >= daysAgo);
    }
    if (errorsSearch) {
      const q = errorsSearch.toLowerCase();
      filtered = filtered.filter(e => {
        const profile = profiles.find(p => p.id === e.user_id);
        return e.error_message.toLowerCase().includes(q) || e.error_type.toLowerCase().includes(q) || (profile?.email || "").toLowerCase().includes(q);
      });
    }
    return filtered;
  }, [errorLogs, errorTypeFilter, errorCategoryFilter, errorDaysFilter, errorsSearch, profiles]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let items = filterByReviewed(profiles, "users").filter(p => !isTrashed("users", p.id));
    if (usersSearch) {
      const q = usersSearch.toLowerCase();
      items = items.filter(p => (p.display_name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q));
    }
    return items;
  }, [profiles, usersSearch, reviewedCutoffs, showReviewed, trashedItems]);

  // Filtered stories
  const filteredStories = useMemo(() => {
    let items = filterByReviewed(stories, "stories").filter(s => !isTrashed("stories", s.id));
    if (storiesSearch) {
      const q = storiesSearch.toLowerCase();
      items = items.filter(s => {
        const profile = profiles.find(p => p.id === s.user_id);
        return s.topic.toLowerCase().includes(q) || s.child_name.toLowerCase().includes(q) || (profile?.display_name || "").toLowerCase().includes(q) || (profile?.email || "").toLowerCase().includes(q);
      });
    }
    return items;
  }, [stories, storiesSearch, profiles, reviewedCutoffs, showReviewed, trashedItems]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    let items = filterByReviewed(purchases, "purchases").filter(p => !isTrashed("purchases", p.id));
    if (purchasesSearch) {
      const q = purchasesSearch.toLowerCase();
      items = items.filter(p => {
        const profile = profiles.find(pr => pr.id === p.user_id);
        return p.package_name.toLowerCase().includes(q) || (profile?.display_name || "").toLowerCase().includes(q) || (profile?.email || "").toLowerCase().includes(q);
      });
    }
    return items;
  }, [purchases, purchasesSearch, profiles, reviewedCutoffs, showReviewed, trashedItems]);

  // 30-day registration chart data
  const chartData = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = profiles.filter(p => { const d = new Date(p.created_at); return d >= day && d < nextDay; }).length;
      days.push({ date: format(day, "dd/MM"), count });
    }
    return days;
  }, [profiles]);

  if (isAdmin === null) {
    return <div className="flex items-center justify-center min-h-screen">טוען...</div>;
  }

  const chartConfig = { count: { label: "נרשמו", color: "hsl(var(--primary))" } };
  const formatDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yyyy HH:mm") : "—";

  const purchaseStatusBadge = (status: string | null) => {
    if (status === "completed") return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">הצלחה</Badge>;
    if (status === "failed") return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">נכשל</Badge>;
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">ממתין</Badge>;
  };

  const packageLabels: Record<string, string> = {
    basic: "בסיסי (3 סיפורים)",
    popular: "פופולרי (10 סיפורים)",
    premium: "משתלם (15 סיפורים)",
    educator: "אנשי חינוך (20 סיפורים)",
    edit_kit: "חבילת עריכות (5)",
    coloring_kit: "חבילת צביעה (5)",
    toolkit_yearly: "ארגז כלים שנתי",
  };

  return (
    <div className="min-h-screen bg-background p-3 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">לוח בקרה למנהל</h1>
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              עודכן: {format(lastUpdated, "HH:mm:ss")}
            </span>
            <Button variant="ghost" size="sm" onClick={fetchAllData} className="gap-1 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              רענן
            </Button>
          </div>
        </div>

        {/* Service Health */}
        <ServiceHealthSection errorLogs={errorLogs} illustrationLogs={illustrationLogs} />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          <StatCard title="משתמשים" value={profiles.length} icon={<Users className="h-4 w-4" />} />
          <StatCard title="נרשמו השבוע" value={registeredThisWeek} icon={<CalendarPlus className="h-4 w-4" />} />
          <StatCard title="פעילים היום" value={activeUsersToday} icon={<Activity className="h-4 w-4" />} color="green" />
          <StatCard title="סיפורים היום" value={storiesToday} icon={<BookOpen className="h-4 w-4" />} color="green" />
          <StatCard title="רכישות" value={purchases.filter(p => p.status === "completed" || p.status === "test_completed").length} icon={<ShoppingCart className="h-4 w-4" />} />
          <StatCard title="הכנסות" value={`₪${totalRevenue.toLocaleString()}`} icon={<TrendingUp className="h-4 w-4" />} />
          <StatCard title="שגיאות היום" value={errorsToday} icon={<AlertTriangle className="h-4 w-4" />} color={errorsToday > 0 ? "red" : undefined} />
        </div>

        {/* 30-day registration chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">הרשמות חדשות – 30 ימים אחרונים</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full overflow-x-auto flex justify-start gap-0.5 h-auto flex-wrap">
            <TabsTrigger value="users" className="text-xs md:text-sm">👥 משתמשים</TabsTrigger>
            <TabsTrigger value="stories" className="text-xs md:text-sm">📖 סיפורים</TabsTrigger>
            <TabsTrigger value="purchases" className="text-xs md:text-sm flex items-center gap-1">
              💳 רכישות
              {purchases.some(p => p.created_at && new Date(p.created_at) > thirtyMinAgo) && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger value="errors" className="text-xs md:text-sm flex items-center gap-1">
              ⚠️ שגיאות
              {errorsToday > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{errorsToday}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="illustrations" className="text-xs md:text-sm">🎨 איורים</TabsTrigger>
            <TabsTrigger value="covers" className="text-xs md:text-sm">🖼️ כריכות</TabsTrigger>
            <TabsTrigger value="coupons" className="text-xs md:text-sm">🎟️ קופונים</TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs md:text-sm">💬 משובים</TabsTrigger>
            <TabsTrigger value="trash" className="text-xs md:text-sm flex items-center gap-1">
              🗑️ סל מחזור
              {Object.values(trashedItems).reduce((sum, arr) => sum + arr.length, 0) > 0 && (
                <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0">
                  {Object.values(trashedItems).reduce((sum, arr) => sum + arr.length, 0)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ===== USERS TAB ===== */}
          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <div className="p-3 border-b border-border/50">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="חיפוש לפי שם או אימייל..." value={usersSearch} onChange={e => setUsersSearch(e.target.value)} className="pr-9 text-sm" />
                  </div>
                </div>
                <div className="px-3 pb-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span>📖 קרדיטי סיפורים</span>
                  <span>🎨 קרדיטי צביעה</span>
                  <span>✏️ קרדיטי עריכה</span>
                </div>
                <ReviewedBar tab="users" total={profiles.length} filtered={filteredUsers.length} cutoff={reviewedCutoffs["users"]} showReviewed={showReviewed["users"]} onToggleShow={() => setShowReviewed(p => ({ ...p, users: !p.users }))} onMark={() => setConfirmClearTab("users")} onClear={() => clearReviewed("users")} />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם</TableHead>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">תפקיד</TableHead>
                        <TableHead className="text-right">סיפורים</TableHead>
                        <TableHead className="text-right">קרדיטים</TableHead>
                        <TableHead className="text-right">רכישה אחרונה</TableHead>
                        <TableHead className="text-right">שגיאות</TableHead>
                        <TableHead className="text-right">הצטרפות</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={9} className="text-center">טוען...</TableCell></TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">לא נמצאו משתמשים</TableCell></TableRow>
                      ) : filteredUsers.map((p) => {
                        const userErrors = errorLogs.filter(e => e.user_id === p.id);
                        const storyErrors = userErrors.filter(e => e.error_type?.includes("story"));
                        const hasErrors = storyErrors.length > 0;
                        const userStories = stories.filter(s => s.user_id === p.id);
                        const userPurchases = purchases.filter(pu => pu.user_id === p.id && pu.status === "completed");
                        const lastPurchase = userPurchases.length > 0 ? userPurchases[0] : null;
                        const displayName = p.display_name || p.email?.split("@")[0] || "משתמש";
                        const compensationMsg = `שלום ${displayName},\nאנחנו מ-SolStorie's™ ושמנו לב שנתקלת בתקלה טכנית בעת יצירת סיפור 😔\nאנחנו מצטערים על אי הנוחות! כפיצוי, הוספנו לך קרדיט סיפור נוסף בחשבון 🎁\nתודה על הסבלנות ❤️\nצוות SolStorie's™`;

                        return (
                          <TableRow key={p.id} className={hasErrors ? "bg-destructive/5" : ""}>
                            <TableCell className="font-medium">{p.display_name || displayName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.email || "—"}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{p.user_role}</Badge></TableCell>
                            <TableCell>{userStories.length}</TableCell>
                            <TableCell>
                              <TooltipProvider delayDuration={200}>
                                <div className="flex gap-1 flex-wrap">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-amber-100 text-amber-800 text-[10px] cursor-help">📖 {p.story_credits ?? 0}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent dir="rtl">קרדיטי סיפורים — מספר הסיפורים שהמשתמש יכול ליצור</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-purple-100 text-purple-800 text-[10px] cursor-help">🎨 {p.coloring_credits ?? 0}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent dir="rtl">קרדיטי צביעה — מספר דפי הצביעה שהמשתמש יכול להפיק</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-blue-100 text-blue-800 text-[10px] cursor-help">✏️ {p.editing_credits ?? 0}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent dir="rtl">קרדיטי עריכה — מספר העריכות הזמינות לסיפורים קיימים</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="text-xs">
                              {lastPurchase ? (
                                <div>
                                  <div>{packageLabels[lastPurchase.package_name] || lastPurchase.package_name}</div>
                                  <div className="text-muted-foreground">{formatDate(lastPurchase.created_at)}</div>
                                </div>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              {hasErrors ? (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 ml-1" />
                                  {storyErrors.length}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">✓</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{formatDate(p.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {p.email && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" title="שלח מייל"
                                    onClick={() => {
                                      const subject = encodeURIComponent("פיצוי מ-SolStorie's™");
                                      const body = encodeURIComponent(compensationMsg);
                                      window.open(`mailto:${p.email}?subject=${subject}&body=${body}`, "_blank");
                                    }}>
                                    <Mail className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="העתק הודעת פיצוי"
                                  onClick={() => { navigator.clipboard.writeText(compensationMsg); toast({ title: "הועתק! ✓" }); }}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700" title="פתח סיפור ידנית"
                                  onClick={() => setUnlockDialogUserId(p.id)}>
                                  <Unlock className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="העבר לסל מחזור"
                                  onClick={() => trashItem("users", p.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== STORIES TAB ===== */}
          <TabsContent value="stories">
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStatCard label="נוצרו היום" value={storiesToday} color="green" />
                <MiniStatCard label="נוצרו השבוע" value={storiesThisWeek} color="green" />
                <MiniStatCard label="נכשלו" value={failedStories} color={failedStories > 0 ? "red" : undefined} />
                <MiniStatCard label="סה״כ" value={stories.length} />
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="p-3 border-b border-border/50">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="חיפוש לפי נושא, שם ילד, משתמש..." value={storiesSearch} onChange={e => setStoriesSearch(e.target.value)} className="pr-9 text-sm" />
                    </div>
                  </div>
                  <ReviewedBar tab="stories" total={stories.length} filtered={filteredStories.length} cutoff={reviewedCutoffs["stories"]} showReviewed={showReviewed["stories"]} onToggleShow={() => setShowReviewed(p => ({ ...p, stories: !p.stories }))} onMark={() => setConfirmClearTab("stories")} onClear={() => clearReviewed("stories")} />
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                         <TableHead className="text-right">משתמש</TableHead>
                          <TableHead className="text-right">שם הילד</TableHead>
                          <TableHead className="text-right">נושא</TableHead>
                          <TableHead className="text-right">תאריך</TableHead>
                          <TableHead className="text-right">סטטוס</TableHead>
                          <TableHead className="text-right w-10"></TableHead>
                          <TableHead className="text-right">סטטוס</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow><TableCell colSpan={5} className="text-center">טוען...</TableCell></TableRow>
                        ) : filteredStories.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">לא נמצאו סיפורים</TableCell></TableRow>
                        ) : filteredStories.map((s) => {
                          const profile = profiles.find(p => p.id === s.user_id);
                          const isReady = s.generation_status === "ready";
                          return (
                            <TableRow key={s.id}>
                              <TableCell className="text-xs">
                                <div>{profile?.display_name || "—"}</div>
                                <div className="text-muted-foreground">{profile?.email || "—"}</div>
                              </TableCell>
                              <TableCell>{s.child_name}</TableCell>
                              <TableCell>{s.topic}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{formatDate(s.created_at)}</TableCell>
                              <TableCell>
                                 <Badge className={`text-xs ${isReady ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                  {isReady ? "הושלם" : "נכשל"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="העבר לסל מחזור" onClick={() => trashItem("stories", s.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== PURCHASES TAB ===== */}
          <TabsContent value="purchases">
            <Card>
              <CardContent className="p-0">
                <div className="p-3 border-b border-border/50">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="חיפוש לפי שם, אימייל, חבילה..." value={purchasesSearch} onChange={e => setPurchasesSearch(e.target.value)} className="pr-9 text-sm" />
                  </div>
                </div>
                <ReviewedBar tab="purchases" total={purchases.length} filtered={filteredPurchases.length} cutoff={reviewedCutoffs["purchases"]} showReviewed={showReviewed["purchases"]} onToggleShow={() => setShowReviewed(p => ({ ...p, purchases: !p.purchases }))} onMark={() => setConfirmClearTab("purchases")} onClear={() => clearReviewed("purchases")} />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם משתמש</TableHead>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">סוג חבילה</TableHead>
                        <TableHead className="text-right">סכום (₪)</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                         <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={7} className="text-center">טוען...</TableCell></TableRow>
                      ) : filteredPurchases.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">אין רכישות</TableCell></TableRow>
                      ) : filteredPurchases.map((p) => {
                        const profile = profiles.find(pr => pr.id === p.user_id);
                        const isRecent = p.created_at && new Date(p.created_at) > thirtyMinAgo;
                        return (
                          <TableRow key={p.id} className={isRecent ? "bg-green-50 dark:bg-green-950/20 animate-pulse" : ""}>
                            <TableCell className="font-medium">{profile?.display_name || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{profile?.email || "—"}</TableCell>
                            <TableCell className="text-sm">{packageLabels[p.package_name] || p.package_name}</TableCell>
                            <TableCell className="font-bold">₪{Number(p.amount_ils).toLocaleString()}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{formatDate(p.created_at)}</TableCell>
                            <TableCell>{purchaseStatusBadge(p.status)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="העבר לסל מחזור" onClick={() => trashItem("purchases", p.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ERRORS TAB ===== */}
          <TabsContent value="errors">
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="חיפוש שגיאות..." value={errorsSearch} onChange={e => setErrorsSearch(e.target.value)} className="pr-9 text-sm" />
                  </div>
                  <Select value={errorCategoryFilter} onValueChange={setErrorCategoryFilter}>
                    <SelectTrigger className="w-[160px] text-sm">
                      <SelectValue placeholder="קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      <SelectItem value="יצירת סיפור">יצירת סיפור</SelectItem>
                      <SelectItem value="איורים">איורים</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={errorDaysFilter} onValueChange={setErrorDaysFilter}>
                    <SelectTrigger className="w-[120px] text-sm">
                      <SelectValue placeholder="תקופה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">24 שעות</SelectItem>
                      <SelectItem value="7">7 ימים</SelectItem>
                      <SelectItem value="30">30 יום</SelectItem>
                      <SelectItem value="all">הכל</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground self-center">{filteredErrors.length} שגיאות</span>
                </div>

                <ReviewedBar tab="errors" total={errorLogs.length} filtered={filterByReviewed(filteredErrors, "errors").length} cutoff={reviewedCutoffs["errors"]} showReviewed={showReviewed["errors"]} onToggleShow={() => setShowReviewed(p => ({ ...p, errors: !p.errors }))} onMark={() => setConfirmClearTab("errors")} onClear={() => clearReviewed("errors")} />

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">משתמש</TableHead>
                        <TableHead className="text-right">מה קרה</TableHead>
                        <TableHead className="text-right">שלב</TableHead>
                        <TableHead className="text-right">פרטים</TableHead>
                         <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-right w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterByReviewed(filteredErrors, "errors").filter(e => !isTrashed("errors", e.id)).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            🎉 אין שגיאות חדשות
                          </TableCell>
                        </TableRow>
                      ) : filterByReviewed(filteredErrors, "errors").filter(e => !isTrashed("errors", e.id)).map((e) => {
                        const errProfile = profiles.find(p => p.id === e.user_id);
                        const is402 = e.error_message?.includes("402");
                        return (
                          <TableRow key={e.id} className={is402 ? "bg-red-50 dark:bg-red-950/20" : ""}>
                            <TableCell className="text-xs">
                              <div>{errProfile?.display_name || "—"}</div>
                              <div className="text-muted-foreground">{errProfile?.email || "—"}</div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {getErrorExplanation(e)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {errorCategoryMap[e.error_type] || "אחר"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs max-w-[300px] truncate" title={e.error_message}>
                              {e.error_message.substring(0, 100)}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{formatDate(e.created_at)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="העבר לסל מחזור" onClick={() => trashItem("errors", e.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ILLUSTRATIONS TAB ===== */}
          <TabsContent value="illustrations">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="text-sm text-muted-foreground">{illustrationLogs.length} רשומות איורים</div>
                  <div className="flex gap-2 mr-auto">
                    {(() => {
                      const geminiWithFace = illustrationLogs.filter(l => l.model_used === "gemini_with_face").length;
                      const geminiNoFace = illustrationLogs.filter(l => l.model_used === "gemini_no_face").length;
                      const falFallback = illustrationLogs.filter(l => l.model_used === "fal_schnell_fallback").length;
                      const failed = illustrationLogs.filter(l => l.model_used === "none_failed").length;
                      return (
                        <>
                          {geminiWithFace > 0 && <Badge className="bg-green-100 text-green-800 text-xs">Gemini+Face: {geminiWithFace}</Badge>}
                          {geminiNoFace > 0 && <Badge className="bg-blue-100 text-blue-800 text-xs">Gemini: {geminiNoFace}</Badge>}
                          {falFallback > 0 && <Badge className="bg-amber-100 text-amber-800 text-xs">Fal Fallback: {falFallback}</Badge>}
                          {failed > 0 && <Badge variant="destructive" className="text-xs">Failed: {failed}</Badge>}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <ReviewedBar tab="illustrations" total={illustrationLogs.length} filtered={filterByReviewed(illustrationLogs, "illustrations").length} cutoff={reviewedCutoffs["illustrations"]} showReviewed={showReviewed["illustrations"]} onToggleShow={() => setShowReviewed(p => ({ ...p, illustrations: !p.illustrations }))} onMark={() => setConfirmClearTab("illustrations")} onClear={() => clearReviewed("illustrations")} />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">סיפור</TableHead>
                        <TableHead className="text-right">עמוד</TableHead>
                        <TableHead className="text-right">מודל</TableHead>
                        <TableHead className="text-right">Face Ref</TableHead>
                        <TableHead className="text-right">סיבת Fallback</TableHead>
                        <TableHead className="text-right">זמן (שנ׳)</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterByReviewed(illustrationLogs, "illustrations").length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">אין נתוני איורים</TableCell></TableRow>
                      ) : filterByReviewed(illustrationLogs, "illustrations").map((log) => {
                        const modelLabels: Record<string, { label: string; color: string }> = {
                          gemini_with_face: { label: "Gemini + Face", color: "bg-green-100 text-green-800" },
                          gemini_no_face: { label: "Gemini (no face)", color: "bg-blue-100 text-blue-800" },
                          fal_schnell_fallback: { label: "Fal Schnell", color: "bg-amber-100 text-amber-800" },
                          none_failed: { label: "נכשל", color: "bg-red-100 text-red-800" },
                        };
                        const modelInfo = modelLabels[log.model_used] || { label: log.model_used, color: "bg-gray-100 text-gray-800" };
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs font-mono max-w-[120px] truncate" title={log.story_id}>{log.story_id.substring(0, 8)}…</TableCell>
                            <TableCell className="text-center">{log.page_number}</TableCell>
                            <TableCell><Badge className={`text-xs whitespace-nowrap ${modelInfo.color}`}>{modelInfo.label}</Badge></TableCell>
                            <TableCell className="text-center">{log.had_face_reference ? "✅" : "—"}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate" title={log.fallback_reason || ""}>{log.fallback_reason || "—"}</TableCell>
                            <TableCell className="text-xs">{log.duration_ms ? (log.duration_ms / 1000).toFixed(1) : "—"}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== COVERS TAB ===== */}
          <TabsContent value="covers">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="text-sm text-muted-foreground">{coverLogs.length} רשומות כריכות</div>
                  <div className="flex gap-2 mr-auto">
                    {(() => {
                      const personalized = coverLogs.filter(l => l.cover_path === "personalized").length;
                      const cast = coverLogs.filter(l => l.cover_path === "cast").length;
                      return (
                        <>
                          {personalized > 0 && <Badge className="bg-green-100 text-green-800 text-xs">פרסונלי: {personalized}</Badge>}
                          {cast > 0 && <Badge className="bg-blue-100 text-blue-800 text-xs">קאסט: {cast}</Badge>}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <ReviewedBar tab="covers" total={coverLogs.length} filtered={filterByReviewed(coverLogs, "covers").length} cutoff={reviewedCutoffs["covers"]} showReviewed={showReviewed["covers"]} onToggleShow={() => setShowReviewed(p => ({ ...p, covers: !p.covers }))} onMark={() => setConfirmClearTab("covers")} onClear={() => clearReviewed("covers")} />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">סיפור</TableHead>
                        <TableHead className="text-right">נתיב</TableHead>
                        <TableHead className="text-right">Face Ref</TableHead>
                        <TableHead className="text-right">דמות קאסט</TableHead>
                        <TableHead className="text-right">Prompt</TableHead>
                        <TableHead className="text-right">Setting</TableHead>
                        <TableHead className="text-right">זמן (שנ׳)</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterByReviewed(coverLogs, "covers").length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">אין נתוני כריכות</TableCell></TableRow>
                      ) : filterByReviewed(coverLogs, "covers").map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs font-mono max-w-[120px] truncate" title={log.story_id}>{log.story_id.substring(0, 8)}…</TableCell>
                          <TableCell><Badge className={`text-xs whitespace-nowrap ${log.cover_path === "personalized" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>{log.cover_path === "personalized" ? "פרסונלי" : "קאסט"}</Badge></TableCell>
                          <TableCell className="text-center">{log.had_face_reference ? "✅" : "—"}</TableCell>
                          <TableCell className="text-xs">{log.cast_character || "—"}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={log.selected_illustration_prompt || ""}>{log.selected_illustration_prompt ? log.selected_illustration_prompt.substring(0, 80) + "…" : "—"}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate" title={log.topic_setting || ""}>{log.topic_setting ? log.topic_setting.substring(0, 60) + "…" : "—"}</TableCell>
                          <TableCell className="text-xs">{log.duration_ms ? (log.duration_ms / 1000).toFixed(1) : "—"}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== COUPONS TAB ===== */}
          <TabsContent value="coupons">
            <Card>
              <CardContent className="p-4 space-y-6">
                {(() => {
                  const uniqueCouponUsers = new Set(couponRedemptions.map(r => r.user_id));
                  const totalCouponUsers = uniqueCouponUsers.size;
                  const redemptionsByCouponId = new Map<string, number>();
                  couponRedemptions.forEach(r => { redemptionsByCouponId.set(r.coupon_id, (redemptionsByCouponId.get(r.coupon_id) || 0) + 1); });
                  let mostPopularCode = "—";
                  let maxRedemptions = 0;
                  redemptionsByCouponId.forEach((count, couponId) => {
                    if (count > maxRedemptions) { maxRedemptions = count; mostPopularCode = coupons.find(c => c.id === couponId)?.code || "—"; }
                  });
                  const thirtyDaysAgo2 = new Date(); thirtyDaysAgo2.setDate(thirtyDaysAgo2.getDate() - 30);
                  const recentStoryUsers = new Set(stories.filter(s => s.user_id && new Date(s.created_at) > thirtyDaysAgo2).map(s => s.user_id!));
                  const activeCouponUsers = [...uniqueCouponUsers].filter(uid => recentStoryUsers.has(uid)).length;
                  const activityRate = totalCouponUsers > 0 ? Math.round((activeCouponUsers / totalCouponUsers) * 100) : 0;
                  return (
                    <div className="grid grid-cols-3 gap-4">
                      <MiniStatCard label="משתמשי קופון" value={totalCouponUsers} />
                      <MiniStatCard label="קוד פופולרי" value={mostPopularCode} />
                      <MiniStatCard label="אחוז פעילות" value={`${activityRate}%`} />
                    </div>
                  );
                })()}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right w-8"></TableHead>
                        <TableHead className="text-right">קוד קופון</TableHead>
                        <TableHead className="text-right">סוג</TableHead>
                        <TableHead className="text-right">מימושים</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">תאריך יצירה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">אין קופונים</TableCell></TableRow>
                      ) : coupons.map((coupon) => {
                        const redemptionsForCoupon = couponRedemptions.filter(r => r.coupon_id === coupon.id);
                        const isExpanded = expandedCoupon === coupon.id;
                        const thirtyDaysAgo2 = new Date(); thirtyDaysAgo2.setDate(thirtyDaysAgo2.getDate() - 30);
                        return (
                          <> 
                            <TableRow key={coupon.id} className="cursor-pointer" onClick={() => setExpandedCoupon(isExpanded ? null : coupon.id)}>
                              <TableCell className="text-center">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                              <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{coupon.coupon_type === "extra_stories" ? `${coupon.free_stories} סיפורים` : `${coupon.discount_percent}% הנחה`}</Badge></TableCell>
                              <TableCell>{redemptionsForCoupon.length}{coupon.max_uses ? ` / ${coupon.max_uses}` : ""}</TableCell>
                              <TableCell><Badge variant={coupon.is_active ? "default" : "secondary"} className="text-xs">{coupon.is_active ? "פעיל" : "לא פעיל"}</Badge></TableCell>
                              <TableCell className="text-xs">{formatDate(coupon.created_at)}</TableCell>
                            </TableRow>
                            {isExpanded && redemptionsForCoupon.length > 0 && (
                              <TableRow key={`${coupon.id}-detail`}>
                                <TableCell colSpan={6} className="p-0">
                                  <div className="bg-muted/30 p-4">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="text-right">שם</TableHead>
                                          <TableHead className="text-right">אימייל</TableHead>
                                          <TableHead className="text-right">תאריך</TableHead>
                                          <TableHead className="text-right">סטטוס</TableHead>
                                          <TableHead className="text-right">סיפורים</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {redemptionsForCoupon.map((redemption) => {
                                          const profile = profiles.find(p => p.id === redemption.user_id);
                                          const userStoryCount = stories.filter(s => s.user_id === redemption.user_id).length;
                                          const hasRecentStory = stories.some(s => s.user_id === redemption.user_id && new Date(s.created_at) > thirtyDaysAgo2);
                                          return (
                                            <TableRow key={redemption.id}>
                                              <TableCell>{profile?.display_name || profile?.email || "—"}</TableCell>
                                              <TableCell className="text-xs text-muted-foreground">{profile?.email || "—"}</TableCell>
                                              <TableCell className="text-xs">{formatDate(redemption.redeemed_at)}</TableCell>
                                              <TableCell><Badge variant={hasRecentStory ? "default" : "secondary"} className="text-xs">{hasRecentStory ? "פעיל" : "לא פעיל"}</Badge></TableCell>
                                              <TableCell>{userStoryCount}</TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                            {isExpanded && redemptionsForCoupon.length === 0 && (
                              <TableRow key={`${coupon.id}-empty`}><TableCell colSpan={6} className="text-center text-muted-foreground py-4 bg-muted/30">אין מימושים לקוד זה</TableCell></TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== FEEDBACK TAB ===== */}
          <TabsContent value="feedback">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-right">שם הילד</TableHead>
                        <TableHead className="text-right">נושא</TableHead>
                        <TableHead className="text-right">דירוג</TableHead>
                        <TableHead className="text-right">הודעה</TableHead>
                        <TableHead className="text-right">מייל</TableHead>
                        <TableHead className="text-right">שם משתמש</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={7} className="text-center">טוען...</TableCell></TableRow>
                      ) : feedbacks.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">אין משובים</TableCell></TableRow>
                      ) : feedbacks.map((fb) => {
                        const storyId = fb.page_url?.match(/story\/([a-f0-9-]{36})/)?.[1];
                        const storyInfo = storyId ? feedbackStories[storyId] : null;
                        const email = fb.user_id ? feedbackEmails[fb.user_id] : null;
                        return (
                          <TableRow key={fb.id}>
                            <TableCell className="text-xs">{formatDate(fb.created_at)}</TableCell>
                            <TableCell>{storyInfo?.child_name || "—"}</TableCell>
                            <TableCell>{storyInfo?.topic || "—"}</TableCell>
                            <TableCell>{fb.rating ? "⭐".repeat(fb.rating) : "—"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{fb.message || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{email || "—"}</TableCell>
                            <TableCell>{fb.display_name || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== RECYCLE BIN TAB ===== */}
          <TabsContent value="trash">
            <Card>
              <CardContent className="p-4 space-y-6">
                {Object.values(trashedItems).reduce((sum, arr) => sum + arr.length, 0) === 0 ? (
                  <div className="text-center text-muted-foreground py-12">🗑️ סל המחזור ריק</div>
                ) : (
                  <>
                    {(trashedItems["users"] || []).length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold mb-2">👥 משתמשים ({trashedItems["users"].length})</h3>
                        <Table>
                          <TableHeader><TableRow><TableHead className="text-right">שם</TableHead><TableHead className="text-right">אימייל</TableHead><TableHead className="text-right w-32">פעולות</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {trashedItems["users"].map(id => {
                              const p = profiles.find(pr => pr.id === id);
                              return (<TableRow key={id}><TableCell>{p?.display_name || id.substring(0, 8)}</TableCell><TableCell className="text-xs text-muted-foreground">{p?.email || "—"}</TableCell><TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => restoreItem("users", id)}><RotateCcw className="h-3 w-3" />שחזור</Button><Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive" onClick={() => permanentDeleteItem("users", id)}><XCircle className="h-3 w-3" />מחיקה</Button></div></TableCell></TableRow>);
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {(trashedItems["stories"] || []).length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold mb-2">📖 סיפורים ({trashedItems["stories"].length})</h3>
                        <Table>
                          <TableHeader><TableRow><TableHead className="text-right">נושא</TableHead><TableHead className="text-right">שם ילד</TableHead><TableHead className="text-right w-32">פעולות</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {trashedItems["stories"].map(id => {
                              const s = stories.find(st => st.id === id);
                              return (<TableRow key={id}><TableCell>{s?.topic || id.substring(0, 8)}</TableCell><TableCell>{s?.child_name || "—"}</TableCell><TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => restoreItem("stories", id)}><RotateCcw className="h-3 w-3" />שחזור</Button><Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive" onClick={() => permanentDeleteItem("stories", id)}><XCircle className="h-3 w-3" />מחיקה</Button></div></TableCell></TableRow>);
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {(trashedItems["purchases"] || []).length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold mb-2">💳 רכישות ({trashedItems["purchases"].length})</h3>
                        <Table>
                          <TableHeader><TableRow><TableHead className="text-right">חבילה</TableHead><TableHead className="text-right">סכום</TableHead><TableHead className="text-right w-32">פעולות</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {trashedItems["purchases"].map(id => {
                              const pu = purchases.find(p => p.id === id);
                              return (<TableRow key={id}><TableCell>{pu?.package_name || id.substring(0, 8)}</TableCell><TableCell>₪{pu ? Number(pu.amount_ils).toLocaleString() : "—"}</TableCell><TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => restoreItem("purchases", id)}><RotateCcw className="h-3 w-3" />שחזור</Button><Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive" onClick={() => permanentDeleteItem("purchases", id)}><XCircle className="h-3 w-3" />מחיקה</Button></div></TableCell></TableRow>);
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {(trashedItems["errors"] || []).length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold mb-2">⚠️ שגיאות ({trashedItems["errors"].length})</h3>
                        <Table>
                          <TableHeader><TableRow><TableHead className="text-right">שגיאה</TableHead><TableHead className="text-right">תאריך</TableHead><TableHead className="text-right w-32">פעולות</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {trashedItems["errors"].map(id => {
                              const err = errorLogs.find(e => e.id === id);
                              return (<TableRow key={id}><TableCell className="text-xs">{err ? getErrorExplanation(err) : id.substring(0, 8)}</TableCell><TableCell className="text-xs">{err ? formatDate(err.created_at) : "—"}</TableCell><TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => restoreItem("errors", id)}><RotateCcw className="h-3 w-3" />שחזור</Button><Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive" onClick={() => permanentDeleteItem("errors", id)}><XCircle className="h-3 w-3" />מחיקה</Button></div></TableCell></TableRow>);
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Confirm mark-as-reviewed dialog */}
        <AlertDialog open={!!confirmClearTab} onOpenChange={(open) => !open && setConfirmClearTab(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>סמן הכל כנצפה?</AlertDialogTitle>
              <AlertDialogDescription>כל הפריטים הנוכחיים יוסתרו. תוכלי להציג אותם שוב בלחיצה על "הצג נצפים".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogAction onClick={() => confirmClearTab && markAsReviewed(confirmClearTab)}>סמן כנצפה</AlertDialogAction>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Manual story unlock dialog */}
      <Dialog open={!!unlockDialogUserId} onOpenChange={(o) => !o && setUnlockDialogUserId(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>פתיחה ידנית של סיפור</DialogTitle>
            <DialogDescription>
              בחר סיפור מהרשימה כדי להעניק למשתמש גישה מלאה (ללא תשלום).
            </DialogDescription>
          </DialogHeader>
          {(() => {
            if (!unlockDialogUserId) return null;
            const userStories = dialogStories;
            const profile = profiles.find(p => p.id === unlockDialogUserId);
            if (dialogStoriesLoading) {
              return <p className="text-sm text-muted-foreground text-center py-6">טוען סיפורים…</p>;
            }
            if (userStories.length === 0) {
              return <p className="text-sm text-muted-foreground text-center py-6">למשתמש זה אין סיפורים</p>;
            }
            return (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="text-xs text-muted-foreground pb-2 border-b">
                  {profile?.display_name || profile?.email || "משתמש"}
                </div>
                {userStories.map(s => {
                  const isUnlocked = storyUnlocks.some(u => u.user_id === unlockDialogUserId && u.story_id === s.id);
                  const statusLabel = s.generation_status && s.generation_status !== "ready"
                    ? s.generation_status
                    : null;
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded-md border">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate flex items-center gap-1.5">
                          <span className="truncate">{s.child_name} — {s.topic}</span>
                          {statusLabel && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {statusLabel}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDate(s.created_at)}</div>
                      </div>
                      {isUnlocked ? (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] gap-1">
                          <Unlock className="h-3 w-3" /> פתוח
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" disabled={unlockingStoryId === s.id}
                          onClick={() => handleUnlockStory(unlockDialogUserId, s.id)}>
                          <Lock className="h-3.5 w-3.5 ml-1" />
                          {unlockingStoryId === s.id ? "פותח..." : "פתח"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Stat card component */
const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color?: "green" | "red" }) => (
  <Card className={color === "red" ? "border-destructive" : color === "green" ? "border-green-300" : ""}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-xs font-medium">{title}</CardTitle>
      <span className={color === "red" ? "text-destructive" : color === "green" ? "text-green-600" : "text-muted-foreground"}>{icon}</span>
    </CardHeader>
    <CardContent>
      <div className={`text-xl font-bold ${color === "red" ? "text-destructive" : color === "green" ? "text-green-700" : ""}`}>{value}</div>
    </CardContent>
  </Card>
);

/** Mini stat card for inline stats */
const MiniStatCard = ({ label, value, color }: { label: string; value: string | number; color?: "green" | "red" }) => (
  <Card className={color === "red" ? "border-red-200 bg-red-50 dark:bg-red-950/20" : color === "green" ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
    <CardContent className="p-3 text-center">
      <div className={`text-lg font-bold ${color === "red" ? "text-red-700" : color === "green" ? "text-green-700" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);

/** Toolbar for reviewed/unreviewed filtering per tab */
const ReviewedBar = ({ tab, total, filtered, cutoff, showReviewed, onToggleShow, onMark, onClear }: {
  tab: string; total: number; filtered: number; cutoff?: string; showReviewed: boolean;
  onToggleShow: () => void; onMark: () => void; onClear: () => void;
}) => {
  const hidden = total - filtered;
  return (
    <div className="flex items-center gap-2 flex-wrap px-4 py-2 bg-muted/30 border-b border-border/50">
      <Button variant="outline" size="sm" onClick={onMark} className="gap-1.5 text-xs">
        <EyeOff className="w-3.5 h-3.5" />
        סמן הכל כנצפה
      </Button>
      {cutoff && hidden > 0 && (
        <Button variant="ghost" size="sm" onClick={onToggleShow} className="gap-1.5 text-xs">
          {showReviewed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showReviewed ? "הסתר נצפים" : `הצג נצפים (${hidden})`}
        </Button>
      )}
      {cutoff && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-xs text-muted-foreground">
          <Trash2 className="w-3.5 h-3.5" />
          אפס סינון
        </Button>
      )}
      <span className="text-xs text-muted-foreground mr-auto">{filtered} מוצגים מתוך {total}</span>
    </div>
  );
};

export default AdminDashboard;
