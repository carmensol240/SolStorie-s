import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, ShoppingCart, BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
  story_credits: number | null;
  is_subscriber: boolean;
  user_role: string;
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  // Wait for auth to be ready before checking
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthReady(true);
    });
    // Also check immediately
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

  // IDs of admin/test accounts to exclude from stats
  const EXCLUDED_IDS = [
    "c9dcaa57-43de-471e-8b09-a195074d1855", // carmit1901
    "49cd7676-ab96-496b-9287-61a9d67d3e68", // carmit1901+test
  ];

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      setLoading(true);
      const [profilesRes, purchasesRes, storiesRes] = await Promise.all([
        supabase.from("profiles").select("id, display_name, created_at, story_credits, is_subscriber, user_role").not("id", "in", `(${EXCLUDED_IDS.join(",")})`).order("created_at", { ascending: false }).limit(200),
        supabase.from("purchases").select("*").eq("status", "completed").not("user_id", "in", `(${EXCLUDED_IDS.join(",")})`).order("created_at", { ascending: false }).limit(200),
        supabase.from("stories").select("id, child_name, topic, created_at, user_id").not("user_id", "in", `(${EXCLUDED_IDS.join(",")})`).order("created_at", { ascending: false }).limit(200),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (purchasesRes.data) setPurchases(purchasesRes.data);
      if (storiesRes.data) setStories(storiesRes.data);
      setLoading(false);
    };

    fetchData();
  }, [isAdmin]);

  if (isAdmin === null) {
    return <div className="flex items-center justify-center min-h-screen">טוען...</div>;
  }

  const totalRevenue = purchases
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount_ils), 0);

  const formatDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yyyy HH:mm") : "—";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/settings")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">לוח בקרה למנהל</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">משתמשים</TabsTrigger>
            <TabsTrigger value="purchases">רכישות</TabsTrigger>
            <TabsTrigger value="stories">סיפורים</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם</TableHead>
                        <TableHead className="text-right">תפקיד</TableHead>
                        <TableHead className="text-right">קרדיטים</TableHead>
                        <TableHead className="text-right">מנוי</TableHead>
                        <TableHead className="text-right">הצטרפות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={5} className="text-center">טוען...</TableCell></TableRow>
                      ) : profiles.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.display_name || "—"}</TableCell>
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
                      ) : purchases.map((p) => (
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
                      ) : stories.map((s) => (
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
