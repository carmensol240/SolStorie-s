import { Wand2, BookOpen, Camera, Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlobalFooter from "@/components/shared/GlobalFooter";
import { CATALOG, formatPrice } from "@/config/promo";
import castSolAsset from "@/assets/cast-thumbs/sol.webp.asset.json";
import castBenAsset from "@/assets/cast-thumbs/ben.webp.asset.json";
import castMiaAsset from "@/assets/cast-thumbs/mia.webp.asset.json";
import castZoeAsset from "@/assets/cast-thumbs/zoe.webp.asset.json";
import castLeoAsset from "@/assets/cast-thumbs/leo.webp.asset.json";

const CAST: { img: string; name: string; text: string }[] = [
  { img: castSolAsset.url, name: "סול", text: "גיבורת העל שמובילה את החבורה" },
  { img: castBenAsset.url, name: "בן", text: "האח הקטן של סול שכולם אוהבים" },
  { img: castMiaAsset.url, name: "מיה", text: "ילדת הפרחים" },
  { img: castZoeAsset.url, name: "זואי", text: "הספורטאית" },
  { img: castLeoAsset.url, name: "ליאו", text: "הצייר" },
];

// Content shown below the hero video on the landing page: what the service
// is, how it works, example topics, what you get, prices and a CTA.
// No testimonials here until there are real customer reviews.

const STEPS = [
  { icon: Camera, title: "מעלים תמונה" },
  { icon: BookOpen, title: "בוחרים נושא" },
  { icon: Sparkles, title: "מקבלים ספר" },
];

const TOPIC_CHIPS = [
  "פחד מחושך", "אח או אחות חדשים", "יום ראשון בגן", "הרפתקה בחלל", "היגיינה", "סיפורי תנ\"ך",
  "גמילה מטיטול", "יום הולדת", "חברות", "לבקש סליחה", "חגים", "הליכה לרופא",
];

// What each option includes (mirrors the Upgrade page products).

const HomeExplainer = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-gradient-to-b from-amber-50 to-background dark:from-background dark:to-background" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-10 space-y-8">
        {/* How it works — one compact row */}
        <section aria-labelledby="home-how" className="space-y-3">
          <h2 id="home-how" className="text-2xl font-black text-foreground text-center">איך זה עובד</h2>
          <ol className="grid grid-cols-3 gap-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col items-center gap-1.5 text-center">
                <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                </div>
                <h3 className="text-center text-base font-bold text-foreground leading-tight">{s.title}</h3>
              </li>
            ))}
          </ol>
        </section>

        {/* Meet the cast — one sideways row */}
        <section aria-labelledby="home-cast" className="space-y-3">
          <h2 id="home-cast" className="text-2xl font-black text-foreground text-center">הכירו את החבורה</h2>
          <ul className="flex gap-4 overflow-x-auto snap-x pb-2 -mx-4 px-4 sm:justify-center scrollbar-hide">
            {CAST.map((c) => (
              <li key={c.name} className="snap-start shrink-0 flex flex-col items-center w-20">
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-primary/20 mb-1">
                  <img src={c.img} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-center text-sm font-black text-foreground">{c.name}</h3>
              </li>
            ))}
          </ul>
          <div className="text-center">
            <button
              onClick={() => navigate("/coloring-gang")}
              className="inline-flex items-center justify-center min-h-11 px-5 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary/10 transition-colors"
            >
              🎨 דפי צביעה של החבורה — חינם
            </button>
          </div>
        </section>

        {/* Topics — one sideways row of chips */}
        <section aria-labelledby="home-topics" className="space-y-3">
          <h2 id="home-topics" className="text-2xl font-black text-foreground text-center">מעל 100 נושאים</h2>
          <ul className="flex gap-2 overflow-x-auto snap-x pb-2 -mx-4 px-4 scrollbar-hide">
            {TOPIC_CHIPS.map((t) => (
              <li key={t} className="snap-start shrink-0 rounded-full border-2 border-border bg-card px-4 py-2 text-base font-semibold text-foreground whitespace-nowrap">{t}</li>
            ))}
            <li className="snap-start shrink-0 rounded-full border-2 border-primary bg-primary/10 px-4 py-2 text-base font-bold text-primary whitespace-nowrap">✍️ או נושא משלכם</li>
          </ul>
        </section>

        {/* Prices — every card lists what it includes (central catalog) */}
        <section aria-labelledby="home-prices" className="space-y-4 text-center">
          <h2 id="home-prices" className="text-center text-2xl font-black text-foreground">כמה זה עולה</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["digital", "full"] as const).map((k) => {
              const p = CATALOG[k];
              return (
                <div key={k} className={`relative rounded-2xl bg-card p-5 shadow-sm text-right ${k === "full" ? "border-2 border-primary" : "border-2 border-border"}`}>
                  {k === "full" && (
                    <span className="absolute -top-3 inset-x-0 mx-auto w-fit rounded-full bg-primary px-3 py-0.5 text-sm font-bold text-primary-foreground">
                      הכי משתלם
                    </span>
                  )}
                  <h3 className="text-center text-lg font-black text-foreground">{p.title}</h3>
                  <p className="text-center text-2xl font-black text-primary mt-1">₪{formatPrice(k)}</p>
                  {k === "full" ? (
                    <p className="mt-4 flex items-center justify-center gap-2 text-base font-black text-primary">
                      <Check className="w-5 h-5 text-green-600 shrink-0" aria-hidden="true" />
                      כל מה שבדיגיטלי + ספר להדפסה
                    </p>
                  ) : (
                  <ul className="mt-4 space-y-2">
                    {p.includes.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-base text-foreground">
                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground">התשלום רק אחרי שרואים את תחילת הסיפור.</p>
        </section>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate("/create")}
            className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 w-full max-w-[320px] bg-primary text-white font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Wand2 className="w-5 h-5" aria-hidden="true" />
            יוצרים סיפור עכשיו
          </button>
        </div>
      </div>
      <div className="pb-20">
        <GlobalFooter />
      </div>
    </div>
  );
};

export default HomeExplainer;
