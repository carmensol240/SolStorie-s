import { useNavigate } from "react-router-dom";
import { Book, Crown, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SubscriberUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubscriberUpsellModal = ({ open, onOpenChange }: SubscriberUpsellModalProps) => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Book,
      title: "ספרון דיגיטלי מעוצב",
      description: "הפכו את הסיפור לספרון יפהפה לשיתוף",
    },
    {
      icon: Share2,
      title: "קישור לשיתוף",
      description: "שתפו עם סבא וסבתא בקלות",
    },
    {
      icon: Sparkles,
      title: "עמוד הקדשה אישי",
      description: "הוסיפו הקדשה מרגשת לספר",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-black">
            פיצ'ר למנויים בלבד
          </DialogTitle>
          <DialogDescription className="text-base">
            הספרון הדיגיטלי זמין למנויים - הפכו כל סיפור לספר מקצועי לשיתוף!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-muted/50 rounded-xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-foreground text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            onClick={() => {
              onOpenChange(false);
              navigate("/toolkit");
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-6 rounded-xl"
          >
            <Crown className="w-5 h-5 ml-2" />
            שדרגו עכשיו
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            אולי אחר כך
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriberUpsellModal;
