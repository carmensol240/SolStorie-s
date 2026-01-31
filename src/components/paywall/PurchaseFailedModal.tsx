import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface PurchaseFailedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
}

const PurchaseFailedModal = ({
  open,
  onOpenChange,
  onRetry,
}: PurchaseFailedModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center max-w-sm">
        <DialogHeader>
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <DialogTitle className="text-2xl font-black text-foreground">
            משהו השתבש...
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground mb-6">
          התשלום לא הושלם. אנא נסו שוב או בחרו אמצעי תשלום אחר.
        </p>

        <Button
          onClick={onRetry}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
        >
          <RefreshCw className="w-5 h-5 ml-2" />
          נסו שוב
        </Button>

        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="w-full text-muted-foreground mt-2"
        >
          ביטול
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseFailedModal;
