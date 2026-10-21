import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, Palette, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { printColoringA4 } from "@/lib/coloring-a4";
import OnlineColoringCanvas from "@/components/story/OnlineColoringCanvas";
import GlobalFooter from "@/components/shared/GlobalFooter";
import solPage from "@/assets/coloring-gang/sol.png.asset.json";
import benPage from "@/assets/coloring-gang/ben.png.asset.json";
import miaPage from "@/assets/coloring-gang/mia.png.asset.json";
import zoePage from "@/assets/coloring-gang/zoe.png.asset.json";
import leoPage from "@/assets/coloring-gang/leo.png.asset.json";

const PAGES = [
  { name: "סול", url: solPage.url },
  { name: "בן", url: benPage.url },
  { name: "מיה", url: miaPage.url },
  { name: "זואי", url: zoePage.url },
  { name: "ליאו", url: leoPage.url },
];

const RETURN_TO = "/coloring-gang";

export default function ColoringGang() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [coloring, setColoring] = useState<number | null>(null);
  const locked = !loading && !user;

  const signUp = () => {
    localStorage.setItem("returnTo", RETURN_TO);
    navigate(`/auth?returnTo=${encodeURIComponent(RETURN_TO)}`);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="w-4 h-4" aria-hidden /> לדף הבית
        </button>
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-black text-foreground">דפי צביעה של החבורה</h1>
          <p className="text-muted-foreground">סול, בן, מיה, זואי וליאו מחכים לצבעים שלכם. חינם להדפסה ולצביעה אונליין.</p>
        </header>

        {locked && (
          <div className="text-center">
            <Button size="lg" onClick={signUp} className="min-h-11">הירשמו בחינם ותקבלו את כל דפי הצביעה</Button>
          </div>
        )}

        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PAGES.map((p, i) => (
            <li key={p.name} className="bg-card border rounded-2xl p-3 shadow-sm flex flex-col gap-3">
              <div className="aspect-[210/297] overflow-hidden rounded-lg border bg-white">
                <img
                  src={p.url}
                  alt={`דף צביעה של ${p.name}`}
                  loading="lazy"
                  className={`w-full h-full object-contain ${locked ? "blur-[3px] select-none pointer-events-none" : ""}`}
                />
              </div>
              {locked ? (
                <Button variant="outline" onClick={signUp} className="min-h-11">הירשמו כדי לקבל</Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="min-h-11" disabled={loading} onClick={() => printColoringA4(p.url)}>
                    <Printer className="w-4 h-4 ms-1" aria-hidden /> הדפסה
                  </Button>
                  <Button className="min-h-11" disabled={loading} onClick={() => setColoring(i)}>
                    <Palette className="w-4 h-4 ms-1" aria-hidden /> צביעה אונליין
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
      <GlobalFooter />

      {coloring !== null && user && (
        <OnlineColoringCanvas
          isOpen
          onClose={() => setColoring(null)}
          backgroundImage={PAGES[coloring].url}
          storyTitle={`דף צביעה של ${PAGES[coloring].name}`}
          canGoPrev={coloring > 0}
          canGoNext={coloring < PAGES.length - 1}
          onNavigatePrev={() => setColoring((c) => (c! > 0 ? c! - 1 : c))}
          onNavigateNext={() => setColoring((c) => (c! < PAGES.length - 1 ? c! + 1 : c))}
        />
      )}
    </div>
  );
}
