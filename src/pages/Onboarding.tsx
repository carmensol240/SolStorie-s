import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CreditCard, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AboutStoryTimeContent } from "@/components/shared/AboutStoryTimeContent";

const TERMS_VERSION = "1.0";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingTerms, setCheckingTerms] = useState(true);

  // Guard: Check if user already accepted terms
  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (loading) return;
      
      // Not logged in - redirect to auth
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setCheckingTerms(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("terms_accepted_at")
          .eq("id", user.id)
          .maybeSingle();

        if (data?.terms_accepted_at) {
          // Already accepted - redirect to library
          navigate("/library");
          return;
        }
      } catch (error) {
        console.error("Error checking terms:", error);
      } finally {
        setCheckingTerms(false);
      }
    };

    checkTermsAcceptance();
  }, [user, loading, navigate]);

  const handleContinue = async () => {
    if (!user || !hasAgreed) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          terms_accepted_at: new Date().toISOString(),
          terms_version: TERMS_VERSION,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "ברוכים הבאים! 🎉",
        description: "אפשר להתחיל ליצור סיפורים!",
      });
      
      navigate("/library");
    } catch (error) {
      console.error("Error saving consent:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שמירת ההסכמה. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking
  if (loading || checkingTerms) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50" dir="rtl">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-6 pb-4 text-center">
        <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          📖 ברוכים הבאים ל-StoryTime! ✨
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          לפני שמתחילים, קראו על האפליקציה
        </p>
      </div>

      {/* Scrollable About Content */}
      <div className="flex-1 px-4 overflow-hidden">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-lg h-full max-h-[50vh]">
          <ScrollArea className="h-full p-4">
            <AboutStoryTimeContent />
          </ScrollArea>
        </div>
      </div>

      {/* Bottom Section - Fixed */}
      <div className="flex-shrink-0 px-4 py-4 space-y-4">
        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
          <Checkbox
            id="terms-agreement"
            checked={hasAgreed}
            onCheckedChange={(checked) => setHasAgreed(checked === true)}
            className="h-5 w-5 mt-0.5 border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
          />
          <Label 
            htmlFor="terms-agreement" 
            className="text-sm leading-relaxed cursor-pointer"
          >
            אני מסכים/ה ל
            <Link to="/terms" className="text-purple-600 hover:underline font-medium mx-1">
              תנאי השימוש
            </Link>
            ול
            <Link to="/privacy" className="text-purple-600 hover:underline font-medium mx-1">
              מדיניות הפרטיות
            </Link>
          </Label>
        </div>

        {/* PayPal Notice */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm text-foreground font-medium">
            💳 ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל
          </p>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!hasAgreed || isSubmitting}
          className={`w-full h-14 rounded-xl text-lg font-bold shadow-lg transition-all duration-300 ${
            hasAgreed 
              ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              המשך
              <ArrowLeft className="h-5 w-5 mr-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
