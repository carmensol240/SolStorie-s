import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface DemoLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

const DemoLockModal = ({ open, onOpenChange, title, description }: DemoLockModalProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-foreground">
            {title ?? "✨ אהבתם?"}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            {description ?? "כדי לשמור ולשתף את הסיפור רכשו חבילת סיפורים"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-col-reverse gap-2 mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            לא עכשיו
          </Button>
          <Button
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold"
            onClick={() => {
              onOpenChange(false);
              // Remember where to return after purchase
              try {
                const page = sessionStorage.getItem(`storyReturnPage:${location.pathname}`);
                sessionStorage.setItem(
                  "pendingStoryReturn",
                  JSON.stringify({ path: location.pathname, page: page ? Number(page) : 0 })
                );
              } catch {}
              navigate("/upgrade");
            }}
          >
            לרכישת חבילה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DemoLockModal;