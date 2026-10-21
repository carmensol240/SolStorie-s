import { useState } from "react";
import { Wand2, BookOpen, Volume2, Printer, Palette, ShieldCheck, UserRound, Sparkles, Check, Minus, Languages } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlobalFooter from "@/components/shared/GlobalFooter";
import { CATALOG, formatPrice } from "@/config/promo";
import topicFearOfDark from "@/assets/topic-fear-of-dark.jpg";
import topicNewSibling from "@/assets/topic-new-sibling.jpeg";
import topicKindergarten from "@/assets/topic-first-day-kindergarten.jpg";
import topicSpace from "@/assets/topic-space-hero.jpg";
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
  {
    icon: UserRound,
    title: "מספרים לנו על הילד",
    text: "שם, גיל ומראה. אפשר להוסיף תמונה כדי שהדמות תהיה דומה לו.",
  },
  {
    icon: BookOpen,
    title: "בוחרים נושא",
    text: "הרפתקה, חגיגה, או משהו שהילד מתמודד איתו עכשיו.",
  },
  {
    icon: Sparkles,
    title: "מקבלים ספר מאויר",
    text: "סיפור אישי עם איורים, שהילד שלכם הוא הגיבור שלו.",
  },
];

const TOPICS = [
  { img: topicFearOfDark, label: "פחד מחושך" },
  { img: topicNewSibling, label: "אח או אחות חדשים" },
  { img: topicKindergarten, label: "יום ראשון בגן" },
  { img: topicSpace, label: "הרפתקה בחלל" },
];

const INCLUDED = [
  { icon: BookOpen, text: "ספר מאויר לקריאה בטלפון ובמחשב" },
  { icon: Volume2, text: "הקראה בקול, ואפשרות להקליט את הקול שלכם" },
  { icon: Printer, text: "ספר אמיתי ביד: קובץ להדפסה (בסיפור המלא)" },
  { icon: Palette, text: "דפי צביעה מאיורי הסיפור" },
  { icon: Languages, text: "סיפור בעברית או באנגלית, מעולה למשפחות דו-לשוניות ולסבים וסבתות בחו״ל" },
];

// What each option includes (mirrors the Upgrade page products).

const HomeExplainer = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-gradient-to-b from-amber-50 to-background dark:from-background dark:to-background" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-28 space-y-14">
        {/* What it is */}
        <section className="text-center space-y-3" aria-labelledby="home-what">
          <h2 id="home-what" className="text-center text-3xl sm:text-4xl font-black text-foreground leading-tight">
            כל ילד ראוי לסיפור משלו
          </h2>
          <p className="text-center text-lg text-muted-foreground leading-relaxed">
            סיפור אישי בעברית או באנגלית, עם השם, המראה והעולם של הילד, על הנושא שהכי חשוב לכם עכשיו.
          </p>
        </section>

        {/* How it works */}
        <section aria-labelledby="home-how" className="space-y-5">
          <h2 id="home-how" className="text-2xl font-black text-foreground text-center">
            איך זה עובד
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="bg-card rounded-2xl border p-5 text-center shadow-sm">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <p className="text-center text-sm font-bold text-primary mb-1">שלב {i + 1}</p>
                <h3 className="text-center text-lg font-black text-foreground mb-1">{s.title}</h3>
                <p className="text-center text-base text-muted-foreground leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Meet the cast */}
        <section aria-labelledby="home-cast" className="space-y-5">
          <h2 id="home-cast" className="text-2xl font-black text-foreground text-center">
            הכירו את סול והחבורה
          </h2>
          <ul className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {CAST.map((c) => (
              <li key={c.name} className="bg-card rounded-2xl border p-3 text-center shadow-sm flex flex-col items-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/20 mb-2">
                  <img
                    src={c.img}
                    alt={c.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-center text-base font-black text-foreground">{c.name}</h3>
                <p className="text-center text-sm text-muted-foreground leading-snug">{c.text}</p>
              </li>
            ))}
          </ul>
          <p className="text-center text-lg font-bold text-foreground">
            הצטרפו גם אתם להרפתקאות של סול וחברים. הילד שלכם הוא הגיבור הבא ✨
          </p>
          <div className="text-center">
            <button
              onClick={() => navigate("/coloring-gang")}
              className="inline-flex items-center justify-center min-h-11 px-5 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary/10 transition-colors"
            >
              🎨 דפי צביעה של החבורה — חינם
            </button>
          </div>
        </section>

        {/* Example topics */}
        <section aria-labelledby="home-topics" className="space-y-5">
          <h2 id="home-topics" className="text-2xl font-black text-foreground text-center">
            נושאים שהורים בוחרים
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {TOPICS.map((t) => (
              <li key={t.label} className="relative rounded-2xl overflow-hidden shadow-md aspect-square">
                <img
                  src={t.img}
                  alt={`איור מתוך סיפור בנושא ${t.label}`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent pt-8 pb-2 px-3 text-white font-bold text-base">
                  {t.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-center text-base text-muted-foreground">ועוד עשרות נושאים לכל גיל ולכל מצב.</p>
        </section>

        {/* What you get */}
        <section aria-labelledby="home-included" className="bg-card rounded-2xl border p-6 shadow-sm space-y-4">
          <h2 id="home-included" className="text-2xl font-black text-foreground text-center">
            מה מקבלים
          </h2>
          <ul className="space-y-3">
            {INCLUDED.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-base text-foreground">
                <f.icon className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                {f.text}
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              בלי פרסומות. התמונה של הילד משמשת רק ליצירת הדמות, ונמחקת כשמוחקים את פרופיל הילד.
            </p>
          </div>
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
                  <ul className="mt-4 space-y-2">
                    {p.includes.map((t, i) => (
                      <li key={t} className="flex items-start gap-2 text-base text-foreground">
                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className={k === "full" && i === p.includes.length - 1 ? "text-primary font-black" : undefined}>{t}</span>
                      </li>
                    ))}
                  </ul>
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
