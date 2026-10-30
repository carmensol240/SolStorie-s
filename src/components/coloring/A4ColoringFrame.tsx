import { useState } from "react";
import { Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { A4_PRINT_HINT, downloadColoringPdfA4 } from "@/lib/coloring-a4";
import { useColoringFooter } from "@/hooks/use-coloring-footer";
import { printColoringPage, withColoringFooter } from "@/lib/coloring-footer";

interface Props {
  imageUrl: string;
  name?: string | null;
  alt?: string;
  className?: string;
  showActions?: boolean;
}

/** White A4 portrait frame (210/297) — image is never cropped. */
export const A4Frame = ({ imageUrl, name, alt, className }: { imageUrl: string; name?: string | null; alt?: string; className?: string }) => {
  const page = useColoringFooter(imageUrl, name);
  return (
  <div
    className={cn("w-full bg-white flex items-center justify-center p-[4%] border border-border/40", className)}
    style={{ aspectRatio: "210 / 297", backgroundColor: "#ffffff" }}
  >
    {page && <img src={page} alt={alt || "דף צביעה"} className="max-w-full max-h-full w-full h-full object-contain" loading="lazy" />}
  </div>
  );
};

export const A4ColoringActions = ({ imageUrl, name, className }: { imageUrl: string; name?: string | null; className?: string }) => {
  const [busy, setBusy] = useState(false);
  return (
    <div className={cn("space-y-1", className)}>
    <div className="flex flex-col sm:flex-row gap-1.5">
      <Button size="sm" variant="outline" className="flex-1 text-sm min-h-[44px] gap-1" disabled={busy || !imageUrl} onClick={async () => {
        setBusy(true);
        try { await printColoringPage(imageUrl, name); }
        catch (e) { console.error(e); toast.error("שגיאה בהכנת הדפסה"); }
        finally { setBusy(false); }
      }}>
        <Printer className="w-4 h-4" aria-hidden="true" /> הדפסה
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="flex-1 text-sm min-h-[44px] gap-1"
        disabled={busy || !imageUrl}
        onClick={async () => {
          setBusy(true);
          let page: string | undefined;
          try {
            page = await withColoringFooter(imageUrl, name);
            await downloadColoringPdfA4(page, name, { preserveColors: true });
          } catch (e) {
            console.error("A4 PDF error", e);
            toast.error("שגיאה ביצירת PDF");
          } finally {
            if (page) URL.revokeObjectURL(page);
            setBusy(false);
          }
        }}
      >
        <FileDown className="w-4 h-4" aria-hidden="true" /> {busy ? "מכינים…" : "הורדת PDF"}
      </Button>
    </div>
    <p className="text-sm text-muted-foreground text-center">{A4_PRINT_HINT}</p>
    </div>
  );
};

const A4ColoringFrame = ({ imageUrl, name, alt, className, showActions = true }: Props) => (
  <div className={cn("space-y-2", className)}>
    <A4Frame imageUrl={imageUrl} name={name} alt={alt} />
    {showActions && <A4ColoringActions imageUrl={imageUrl} name={name} />}
  </div>
);

export default A4ColoringFrame;
