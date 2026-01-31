import { useState } from "react";
import { Sparkles, MessageSquare, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BetaBanner = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!feedback.trim() && rating === 0) {
      toast({
        title: "אנא מלאו משוב או דירוג",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save feedback to database
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user?.id || null,
          rating: rating > 0 ? rating : null,
          message: feedback.trim() || null,
          page_url: window.location.pathname,
          user_agent: navigator.userAgent,
        });

      if (error) throw error;
      
      toast({
        title: "תודה על המשוב! 💜",
        description: "המשוב שלכם עוזר לנו להשתפר",
      });
      
      setFeedback("");
      setRating(0);
      setShowFeedback(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "שגיאה בשליחת המשוב",
        description: "אנא נסו שוב",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-1 px-2" dir="rtl">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 flex-shrink-0" />
          <span className="text-[11px]">גרסת בטא 🚀</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFeedback(true)}
            className="h-5 px-2 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0 gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            משוב
          </Button>
        </div>
      </div>

      {/* Feedback Modal */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="w-5 h-5 text-primary" />
              נשמח לשמוע מכם!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                איך הייתה החוויה שלכם?
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`דירוג ${star} כוכבים`}
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {rating === 5 ? "מעולה! 🎉" : rating >= 4 ? "טוב מאוד! 😊" : rating >= 3 ? "בסדר 👍" : rating >= 2 ? "יש מה לשפר 🤔" : "נצטרך להשתפר 😔"}
                </p>
              )}
            </div>

            {/* Feedback Text */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                יש לכם הצעות לשיפור או באגים לדווח?
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="ספרו לנו מה אתם חושבים..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full gap-2"
            >
              {isSubmitting ? (
                "שולח..."
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  שלחו משוב
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BetaBanner;