import { useState } from "react";
import { Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { downloadColoringPdfA4, printColoringA4 } from "@/lib/coloring-a4";

interface Props {
  imageUrl: string;
  name?: string | null;
  alt?: string;
  className?: string;
  showActions?: boolean;
}

/** White A4 portrait frame (210/297) — image is never cropped. */
export const A4Frame = ({ imageUrl, alt, className }: { imageUrl: string; alt?: string; className?: string }) => (
  <div
    className={cn("w-full bg-white flex items-center justify-center p-[4%] border border-border/40", className)}
    style={{ aspectRatio: "210 / 297", backgroundColor: "#ffffff" }}
  >
    <img src={imageUrl} alt={alt || "דף צביעה"} className="max-w-full max-h-full w-full h-full object-contain" loading="lazy" />
  </div>
);

export const A4ColoringActions = ({ imageUrl, name, className }: { imageUrl: string; name?: string | null; className?: string }) => {
  const [busy, setBusy] = useState(false);
  return (
    <div className={cn("flex gap-1.5", className)}>
      <Button size="sm" variant="outline" className="flex-1 text-sm h-7 gap-1" onClick={() => printColoringA4(imageUrl)}>
        <Printer className="w-3 h-3" /> Print A4
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="flex-1 text-sm h-7 gap-1"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await downloadColoringPdfA4(imageUrl, name);
          } catch (e) {
            console.error("A4 PDF error", e);
            toast.error("שגיאה ביצירת PDF");
          } finally {
            setBusy(false);
          }
        }}
      >
        <FileDown className="w-3 h-3" /> {busy ? "..." : "Download PDF (A4)"}
      </Button>
    </div>
  );
};

const A4ColoringFrame = ({ imageUrl, name, alt, className, showActions = true }: Props) => (
  <div className={cn("space-y-2", className)}>
    <A4Frame imageUrl={imageUrl} alt={alt} />
    {showActions && <A4ColoringActions imageUrl={imageUrl} name={name} />}
  </div>
);

export default A4ColoringFrame;
