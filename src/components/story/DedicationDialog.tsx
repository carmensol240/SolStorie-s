import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dedication: string) => void;
  childName: string;
  isLoading?: boolean;
}

const DedicationDialog = ({ 
  open, 
  onOpenChange, 
  onSave, 
  childName,
  isLoading 
}: DedicationDialogProps) => {
  const [dedication, setDedication] = useState("");

  const handleSave = () => {
    onSave(dedication);
  };

  const handleSkip = () => {
    onSave("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="text-center">
          <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="w-7 h-7 text-pink-500" />
          </div>
          <DialogTitle className="text-xl font-black">
            הוסיפו הקדשה לספר
          </DialogTitle>
          <DialogDescription>
            כתבו הקדשה אישית שתופיע בתחילת הספרון של {childName}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <Textarea
            value={dedication}
            onChange={(e) => setDedication(e.target.value)}
            placeholder="לסבא וסבתא היקרים, באהבה גדולה..."
            className="min-h-[120px] text-right resize-none"
            dir="rtl"
          />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            ההקדשה תופיע בעמוד הראשון של הספרון
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "יוצר ספרון..." : "צור ספרון דיגיטלי"}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full text-muted-foreground"
          >
            המשך ללא הקדשה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DedicationDialog;
