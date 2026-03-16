import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, ShoppingCart, BookOpen, TrendingUp, ArrowRight, AlertTriangle, EyeOff, Eye, Trash2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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

interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
  story_credits: number | null;
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLogRow[]>([]);
  const [illustrationLogs, setIllustrationLogs] = useState<IllustrationLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const { toast } = useToast();
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>("all");
  const [errorDaysFilter, setErrorDaysFilter] = useState<string>("7");

  // "Mark as reviewed" — store cutoff timestamps per tab in localStorage
  const REVIEWED_KEY = "admin_reviewed_";
  const [reviewedCutoffs, setReviewedCutoffs] = useState<Record<string, string>>(() => {
    const saved: Record<string, string> = {};
    ["users", "purchases", "stories", "errors", "illustrations"].forEach(tab => {
      const val = localStorage.getItem(REVIEWED_KEY + tab);
      if (val) saved[tab] = val;
    });
    return saved;
  });
  const [showReviewed, setShowReviewed] = useState<Record<string, boolean>>({ users: false, purchases: false, stories: false, errors: false, illustrations: false });
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

  const filterByReviewed = <T extends { created_at: string | null }>(items: T[], tab: string): T[] => {
    const cutoff = reviewedCutoffs[tab];
    if (!cutoff || showReviewed[tab]) return items;
    return items.filter(item => item.created_at && new Date(item.created_at) > new Date(cutoff));
  };

  const getNewCount = <T extends { created_at: string | null }>(items: T[], tab: string): number => {
    const cutoff = reviewedCutoffs[tab];
    if (!cutoff) return 0;
    return items.filter(item => item.created_at && new Date(item.created_at) > new Date(cutoff)).length;
  };

  // Wait for auth to be ready before checking
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthReady(true);
    });
    supabase.auth.getSession().then(() => setAuthReady(true));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        navigate("/");
        return;
      }
      setIsAdmin(true);
    };

    checkAdmin();
  }, [user, navigate, authReady]);

  const EXCLUDED_IDS = [
    "c9dcaa57-43de-471e-8b09-a195074d1855",
    "49cd7676-ab96-496b-9287-61a9d67d3e68",
  ];

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      setLoading(true);
      const [profilesRes, purchasesRes, storiesRes, emailsRes] = await Promise.all([
        supabase.from("profiles").select("id, display_name, created_at, story_credits, is_subscriber, user_role").not("id", "in", `(${EXCLUDED_IDS.join(",")})`).order("created_at", { ascending: false }).limit(200),
        supabase.from("purchases").select("*").eq("status", "completed").not("user_id", "in", `(${EXCLUDED_IDS.join(",")})`).order("created_at", { ascending: false }).limit(200),
        supabase.from("stories").select("id, child_name, topic, created_at, user_id").not("user_id", "in", `(${EXCLUDED_IDS.join(",")})`).order("created_at", { ascending: false }).limit(200),
        supabase.rpc("get_admin_user_emails"),
      ]);

      if (profilesRes.data) {
        const emailMap = new Map<string, string>();
        if (emailsRes.data) {
          (emailsRes.data as { user_id: string; email: string }[]).forEach(e => emailMap.set(e.user_id, e.email));
        }
        setProfiles(profilesRes.data.map(p => ({ ...p, email: emailMap.get(p.id) || undefined })));
      }
      if (purchasesRes.data) setPurchases(purchasesRes.data);
      if (storiesRes.data) setStories(storiesRes.data);
      setLoading(false);
    };

    fetchData();
  }, [isAdmin]);

  // Fetch error logs separately with filters
  useEffect(() => {
    if (!isAdmin) return;

    const fetchErrors = async () => {
      let query = supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (errorTypeFilter !== "all") {
        query = query.eq("error_type", errorTypeFilter);
      }

      if (errorDaysFilter !== "all") {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(errorDaysFilter));
        query = query.gte("created_at", daysAgo.toISOString());
      }

      const { data } = await query;
      if (data) setErrorLogs(data as ErrorLogRow[]);
    };

    fetchErrors();
  }, [isAdmin, errorTypeFilter, errorDaysFilter]);

  // Fetch illustration logs
  useEffect(() => {
    if (!isAdmin) return;

    const fetchIllustrationLogs = async () => {
      const { data } = await supabase
        .from("illustration_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (data) setIllustrationLogs(data as IllustrationLogRow[]);
    };

    fetchIllustrationLogs();
  }, [isAdmin]);

  if (isAdmin === null) {
    return <div className="flex items-center justify-center min-h-screen">טוען...</div>;
  }

  const totalRevenue = purchases
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount_ils), 0);

  const errors24h = errorLogs.filter(e => {
    const d = new Date(e.created_at);
    return d > new Date(Date.now() - 24 * 60 * 60 * 1000);
  }).length;

  const formatDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yyyy HH:mm") : "—";

  const errorTypes = [...new Set(errorLogs.map(e => e.error_type))];

  const errorTypeLabels: Record<string, string> = {
    illustration_timeout: "Timeout איורים",
    illustration_fal_error: "כשל Fal.ai",
    illustration_general_error: "שגיאת איורים כללית",
    story_generation_error: "כשל יצירת סיפור",
    story_parse_error: "שגיאת פענוח AI",
    story_insert_error: "שגיאת שמירת סיפור",
    story_general_error: "שגיאה כללית בסיפור",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">לוח בקרה למנהל</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">משתמשים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">רכישות</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchases.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">סיפורים</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stories.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">הכנסות</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₪{totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className={errors24h > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">שגיאות 24ש</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${errors24h > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${errors24h > 0 ? "text-destructive" : ""}`}>{errors24h}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">משתמשים</TabsTrigger>
            <TabsTrigger value="purchases">רכישות</TabsTrigger>
            <TabsTrigger value="stories">סיפורים</TabsTrigger>
            <TabsTrigger value="illustrations" className="flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" />
              איורים
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-1">
              שגיאות
              {errors24h > 0 && <Badge variant="destructive" className="text-xs px-1.5 py-0">{errors24h}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <ReviewedBar tab="users" total={profiles.length} filtered={filterByReviewed(profiles, "users").length} cutoff={reviewedCutoffs["users"]} showReviewed={showReviewed["users"]} onToggleShow={() => setShowReviewed(p => ({ ...p, users: !p.users }))} onMark={() => setConfirmClearTab("users")} onClear={() => clearReviewed("users")} />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם</TableHead>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">תפקיד</TableHead>
                        <TableHead className="text-right">קרדיטים</TableHead>
                        <TableHead className="text-right">מנוי</TableHead>
                        <TableHead className="text-right">הצטרפות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={6} className="text-center">טוען...</TableCell></TableRow>
                      ) : filterByReviewed(profiles, "users").map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.display_name || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{p.user_role}</Badge>
                          </TableCell>
                          <TableCell>{p.story_credits ?? 0}</TableCell>
                          <TableCell>{p.is_subscriber ? "✅" : "—"}</TableCell>
                          <TableCell className="text-xs">{formatDate(p.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardContent className="p-0">
                <ReviewedBar tab="purchases" total={purchases.length} filtered={filterByReviewed(purchases, "purchases").length} cutoff={reviewedCutoffs["purchases"]} showReviewed={showReviewed["purchases"]} onToggleShow={() => setShowReviewed(p => ({ ...p, purchases: !p.purchases }))} onMark={() => setConfirmClearTab("purchases")} onClear={() => clearReviewed("purchases")} />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">חבילה</TableHead>
                        <TableHead className="text-right">קרדיטים</TableHead>
                        <TableHead className="text-right">סכום</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={5} className="text-center">טוען...</TableCell></TableRow>
                      ) : filterByReviewed(purchases, "purchases").map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.package_name}</TableCell>
                          <TableCell>{p.credits_purchased}</TableCell>
                          <TableCell>₪{p.amount_ils}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === "completed" ? "default" : "secondary"}>
                              {p.status === "completed" ? "הושלם" : p.status || "ממתין"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(p.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories">
            <Card>
              <CardContent className="p-0">
                <ReviewedBar tab="stories" total={stories.length} filtered={filterByReviewed(stories, "stories").length} cutoff={reviewedCutoffs["stories"]} showReviewed={showReviewed["stories"]} onToggleShow={() => setShowReviewed(p => ({ ...p, stories: !p.stories }))} onMark={() => setConfirmClearTab("stories")} onClear={() => clearReviewed("stories")} />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">נושא</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={2} className="text-center">טוען...</TableCell></TableRow>
                      ) : filterByReviewed(stories, "stories").map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.topic}</TableCell>
                          <TableCell className="text-xs">{formatDate(s.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <Select value={errorTypeFilter} onValueChange={setErrorTypeFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="סוג שגיאה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הסוגים</SelectItem>
                      <SelectItem value="illustration_timeout">Timeout איורים</SelectItem>
                      <SelectItem value="illustration_fal_error">כשל Fal.ai</SelectItem>
                      <SelectItem value="illustration_general_error">שגיאת איורים כללית</SelectItem>
                      <SelectItem value="story_generation_error">כשל יצירת סיפור</SelectItem>
                      <SelectItem value="story_parse_error">שגיאת פענוח AI</SelectItem>
                      <SelectItem value="story_insert_error">שגיאת שמירת סיפור</SelectItem>
                      <SelectItem value="story_general_error">שגיאה כללית</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={errorDaysFilter} onValueChange={setErrorDaysFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="תקופה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">24 שעות</SelectItem>
                      <SelectItem value="7">7 ימים</SelectItem>
                      <SelectItem value="30">30 יום</SelectItem>
                      <SelectItem value="all">הכל</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground self-center">
                    {filterByReviewed(errorLogs, "errors").length} שגיאות
                  </div>
                </div>

                <ReviewedBar tab="errors" total={errorLogs.length} filtered={filterByReviewed(errorLogs, "errors").length} cutoff={reviewedCutoffs["errors"]} showReviewed={showReviewed["errors"]} onToggleShow={() => setShowReviewed(p => ({ ...p, errors: !p.errors }))} onMark={() => setConfirmClearTab("errors")} onClear={() => clearReviewed("errors")} />

                {/* Error table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">סוג</TableHead>
                        <TableHead className="text-right">הודעה</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterByReviewed(errorLogs, "errors").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            🎉 אין שגיאות חדשות
                          </TableCell>
                        </TableRow>
                      ) : filterByReviewed(errorLogs, "errors").map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {errorTypeLabels[e.error_type] || e.error_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-[400px] truncate" title={e.error_message}>
                            {e.error_message}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(e.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="illustrations">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="text-sm text-muted-foreground">
                    {illustrationLogs.length} רשומות איורים
                  </div>
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
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            אין נתוני איורים עדיין — יופיעו מהסיפור הבא שייווצר
                          </TableCell>
                        </TableRow>
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
                            <TableCell className="text-xs font-mono max-w-[120px] truncate" title={log.story_id}>
                              {log.story_id.substring(0, 8)}…
                            </TableCell>
                            <TableCell className="text-center">{log.page_number}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs whitespace-nowrap ${modelInfo.color}`}>
                                {modelInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">{log.had_face_reference ? "✅" : "—"}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate" title={log.fallback_reason || ""}>
                              {log.fallback_reason || "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {log.duration_ms ? (log.duration_ms / 1000).toFixed(1) : "—"}
                            </TableCell>
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
        </Tabs>

        {/* Confirm mark-as-reviewed dialog */}
        <AlertDialog open={!!confirmClearTab} onOpenChange={(open) => !open && setConfirmClearTab(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>סמן הכל כנצפה?</AlertDialogTitle>
              <AlertDialogDescription>
                כל הפריטים הנוכחיים יוסתרו. תוכלי להציג אותם שוב בלחיצה על "הצג נצפים".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogAction onClick={() => confirmClearTab && markAsReviewed(confirmClearTab)}>
                סמן כנצפה
              </AlertDialogAction>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

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
