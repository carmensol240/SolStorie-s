import { useEffect, useRef, useState } from "react";
import { Loader2, Palette, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { printColoringA4, coloringCorsUrl } from "@/lib/coloring-a4";
import { OnlineColoringCanvas } from "@/components/story/OnlineColoringCanvas";
import { COLORING_FAILED_TEXT } from "./portrait-coloring-text";
import { normalizeGender } from "../../../supabase/functions/_shared/gender";

interface Props {
  childId: string;
  childName: string;
  gender?: string | null;
  isAdmin: boolean;
}

/** "כגיבורה" for a girl, "כגיבור" for a boy, "כגיבור/ה" when gender is unknown. */
const heroWord = (gender?: string | null) => {
  const g = normalizeGender(gender);
  if (g === "female") return "כגיבורה";
  if (g === "male") return "כגיבור";
  return "כגיבור/ה";
};

const publicUrl = (path: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/story-illustrations/${path}`;

/** Adds the child's name and the brand line under the clean line art (browser only). */
async function withCaption(url: string, name: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = coloringCorsUrl(url);
  await img.decode();
  const footer = Math.round(img.naturalHeight * 0.11);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight + footer;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0);
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.font = `bold ${Math.round(footer * 0.42)}px Rubik, Arial, sans-serif`;
  ctx.fillText(name, c.width / 2, img.naturalHeight + footer * 0.48);
  ctx.font = `${Math.round(footer * 0.2)}px Rubik, Arial, sans-serif`;
  ctx.fillText("SolStorie's™ · עולמה הקסום של סול", c.width / 2, img.naturalHeight + footer * 0.82);
  return c.toDataURL("image/png");
}

export function ChildPortraitColoringCard({ childId, childName, gender, isAdmin }: Props) {
  const hero = heroWord(gender);
  const [path, setPath] = useState<string | null>(null);
  const [page, setPage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [coloring, setColoring] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    let alive = true;
    supabase.from("child_portrait_coloring").select("status, coloring_image_path").eq("child_id", childId).maybeSingle()
      .then(({ data }) => { if (alive && data?.status === "ready" && data.coloring_image_path) setPath(data.coloring_image_path); });
    return () => { alive = false; };
  }, [childId]);

  useEffect(() => {
    if (!path) { setPage(null); return; }
    let alive = true;
    withCaption(publicUrl(path), childName).then((u) => alive && setPage(u)).catch(() => alive && setPage(publicUrl(path)));
    return () => { alive = false; };
  }, [path, childName]);

  const create = async (regenerate = false) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setFailed(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-child-portrait-coloring", {
        body: { child_id: childId, regenerate },
      });
      if (error || !data?.path) setFailed(true);
      else setPath(data.path);
    } catch {
      setFailed(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 mb-4 flex items-center gap-4" aria-label={`דף צביעה של ${childName} ${hero}`}>
      {page && (
        <img src={page} alt={`דף צביעה של ${childName} ${hero}`} className="w-20 h-28 object-contain rounded-md border border-border bg-background" />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground">🎨 {childName} {hero} — דף צביעה</h3>
        {failed && <p className="text-sm text-destructive mt-1" role="alert">{COLORING_FAILED_TEXT}</p>}
        <div className="flex flex-wrap gap-2 mt-3">
          {!path ? (
            <Button className="min-h-11" disabled={busy} onClick={() => create(false)}>
              {busy ? <Loader2 className="w-4 h-4 ms-1 animate-spin" aria-hidden /> : <Palette className="w-4 h-4 ms-1" aria-hidden />}
              {busy ? "יוצרים את הדף…" : failed ? "נסו שוב" : "צרו את הדף"}
            </Button>
          ) : (
            <>
              <Button variant="outline" className="min-h-11" disabled={!page} onClick={() => page && printColoringA4(page)}>
                <Printer className="w-4 h-4 ms-1" aria-hidden /> הדפסה
              </Button>
              <Button className="min-h-11" disabled={!page} onClick={() => setColoring(true)}>
                <Palette className="w-4 h-4 ms-1" aria-hidden /> צביעה אונליין
              </Button>
              {isAdmin && (
                <Button variant="ghost" className="min-h-11" disabled={busy} onClick={() => create(true)}>
                  {busy ? <Loader2 className="w-4 h-4 ms-1 animate-spin" aria-hidden /> : <RefreshCw className="w-4 h-4 ms-1" aria-hidden />} יצירה מחדש
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {coloring && page && (
        <OnlineColoringCanvas isOpen onClose={() => setColoring(false)} backgroundImage={page} childName={childName} storyTitle={`${childName} ${hero}`} />
      )}
    </section>
  );
}
