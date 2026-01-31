import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface PurchaseSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditsAdded: number;
}

const PurchaseSuccessModal = ({
  open,
  onOpenChange,
  creditsAdded,
}: PurchaseSuccessModalProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        navigate("/library");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, navigate]);

  const handleGoToLibrary = () => {
    onOpenChange(false);
    navigate("/library");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center max-w-sm">
        <DialogHeader>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <DialogTitle className="text-2xl font-black text-foreground">
            נוספו לך {creditsAdded} סיפורים!
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground mb-6">
          עכשיו אפשר ליצור סיפורים חדשים ומיוחדים
        </p>

        <Button
          onClick={handleGoToLibrary}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
        >
          <BookOpen className="w-5 h-5 ml-2" />
          עברו לספרייה
        </Button>

        <p className="text-xs text-muted-foreground mt-3">
          מעבר אוטומטי בעוד 3 שניות...
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseSuccessModal;
