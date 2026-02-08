import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GenderSwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  currentGender: "male" | "female";
  onSuccess: () => void;
}

export function GenderSwapDialog({
  open,
  onOpenChange,
  storyId,
  currentGender,
  onSuccess,
}: GenderSwapDialogProps) {
  const [selectedGender, setSelectedGender] = useState<"male" | "female">(
    currentGender === "male" ? "female" : "male"
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSwap = async () => {
    if (selectedGender === currentGender) {
      toast({
        title: "המגדר כבר מוגדר נכון",
        description: "בחרו מגדר שונה מהנוכחי",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("swap-gender", {
        body: { storyId, targetGender: selectedGender },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "הצלחה! ✨",
        description: data.message || "הטקסט הותאם בהצלחה",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Gender swap error:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message || "לא הצלחנו להחליף את המגדר",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <RefreshCw className="w-5 h-5 text-purple-500" />
            תיקון מגדר מהיר
          </DialogTitle>
          <DialogDescription className="text-right text-base">
            בחרו את המגדר הנכון והטקסט יותאם אוטומטית
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Gender Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedGender("male")}
              disabled={isLoading}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedGender === "male"
                  ? "border-purple-500 bg-purple-50 shadow-md"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="text-3xl mb-2">👦</div>
              <div className="font-bold text-purple-900">גיבור</div>
              <div className="text-sm text-purple-600">בן</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGender("female")}
              disabled={isLoading}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedGender === "female"
                  ? "border-pink-500 bg-pink-50 shadow-md"
                  : "border-gray-200 hover:border-pink-300"
              }`}
            >
              <div className="text-3xl mb-2">👧</div>
              <div className="font-bold text-pink-900">גיבורה</div>
              <div className="text-sm text-pink-600">בת</div>
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
            <p className="text-sm text-purple-700">
              ✨ <strong>ללא עלות נוספת!</strong>
              <br />
              הטקסט יותאם אוטומטית - כל הפעלים והכינויים יוחלפו למגדר שבחרתם.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            ביטול
          </Button>
          <Button
            onClick={handleSwap}
            disabled={isLoading || selectedGender === currentGender}
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                {selectedGender === "female" 
                  ? "הקסם מתאים את הסיפור לגיבורה..." 
                  : "הקסם מתאים את הסיפור לגיבור..."}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 ml-2" />
                תקנו עכשיו
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
