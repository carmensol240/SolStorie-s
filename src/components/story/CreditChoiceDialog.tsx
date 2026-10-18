import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CreditKind } from "@/hooks/use-credit-kinds";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  digital: number;
  full: number;
  onChoose: (kind: CreditKind) => void;
}

/** Shown only when the parent has both kinds of story credit. Full story is selected by default. */
const CreditChoiceDialog = ({ open, onOpenChange, digital, full, onChoose }: Props) => {
  const [kind, setKind] = useState<CreditKind>("full");
  useEffect(() => { if (open) setKind("full"); }, [open]);

  const option = (k: CreditKind, title: string, sub: string | null, left: number) => (
    <button
      type="button"
      role="radio"
      aria-checked={kind === k}
      onClick={() => setKind(k)}
      className={`w-full min-h-[56px] rounded-xl border-2 px-4 py-3 text-right transition-colors ${
        kind === k ? "border-primary bg-primary/10" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-bold text-foreground">{title}</div>
          {sub && <div className="text-sm text-muted-foreground">{sub}</div>}
        </div>
        <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">נשארו {left}</span>
      </div>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">באיזה קרדיט להשתמש לסיפור הזה?</DialogTitle>
        </DialogHeader>
        <div role="radiogroup" className="space-y-2">
          {option("full", "סיפור מלא", "כולל קובץ להדפסת הספר", full)}
          {option("digital", "סיפור דיגיטלי", null, digital)}
        </div>
        <Button className="w-full min-h-[48px] text-base font-bold" onClick={() => onChoose(kind)}>
          המשך
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CreditChoiceDialog;
