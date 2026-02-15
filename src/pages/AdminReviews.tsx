import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, X, Star, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number | null;
  message: string | null;
  display_name: string | null;
  created_at: string;
  is_approved: boolean | null;
  user_id: string | null;
}

const AdminReviews = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (authLoading) return;
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
      fetchReviews();
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-reviews", {
        body: { action: "list" },
      });
      if (error) throw error;
      setReviews(data?.reviews || []);
    } catch (err) {
      console.error(err);
      toast({ title: "שגיאה בטעינת המשובים", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reviewId: string, action: "approve" | "reject") => {
    setActionLoading(reviewId);
    try {
      const { error } = await supabase.functions.invoke("manage-reviews", {
        body: { action, reviewId },
      });
      if (error) throw error;
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, is_approved: action === "approve" } : r
        )
      );
      toast({ title: action === "approve" ? "✅ המלצה אושרה" : "❌ המלצה נדחתה" });
    } catch (err) {
      console.error(err);
      toast({ title: "שגיאה", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pending = reviews.filter((r) => !r.is_approved && r.is_approved !== true);
  const approved = reviews.filter((r) => r.is_approved === true);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">ניהול המלצות</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            חזרה <ArrowRight className="mr-1 h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ממתינים לאישור ({pending.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {pending.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">אין משובים ממתינים</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>שם</TableHead>
                        <TableHead>דירוג</TableHead>
                        <TableHead>תוכן</TableHead>
                        <TableHead>תאריך</TableHead>
                        <TableHead>פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.display_name || "אנונימי"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: r.rating || 0 }).map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{r.message}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("he-IL")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                disabled={actionLoading === r.id}
                                onClick={() => handleAction(r.id, "approve")}
                              >
                                {actionLoading === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                <span className="mr-1">אשר</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionLoading === r.id}
                                onClick={() => handleAction(r.id, "reject")}
                              >
                                <X className="h-3 w-3" />
                                <span className="mr-1">דחה</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  מאושרים ({approved.length})
                  <Badge variant="secondary" className="mr-2">פעיל בדף הנחיתה</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {approved.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">אין המלצות מאושרות</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>שם</TableHead>
                        <TableHead>דירוג</TableHead>
                        <TableHead>תוכן</TableHead>
                        <TableHead>פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approved.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.display_name || "אנונימי"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: r.rating || 0 }).map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{r.message}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading === r.id}
                              onClick={() => handleAction(r.id, "reject")}
                            >
                              <X className="h-3 w-3" />
                              <span className="mr-1">הסר</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
