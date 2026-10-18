import { openCookieSettings } from "@/lib/consent";
import { Link } from "react-router-dom";

const FOOTER_LINKS = [
  { to: "/terms", label: "תנאי שימוש" },
  { to: "/privacy", label: "מדיניות פרטיות" },
  { to: "/accessibility", label: "הצהרת נגישות" },
  { to: "/contact", label: "צור קשר" },
];

const GlobalFooter = () => {
  return (
    <footer className="w-full py-3 flex flex-col items-center gap-1 border-t border-purple-100/30" dir="rtl">
      <span className="text-sm font-black logo-3d-bubble opacity-50"><span className="logo-rainbow">SolStorie's™</span></span>
      <nav aria-label="קישורים משפטיים" className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-4">
        {FOOTER_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {l.label}
          </Link>
        ))}
        <button type="button" onClick={openCookieSettings} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
          הגדרות עוגיות
        </button>
      </nav>
      <p className="text-xs text-muted-foreground font-medium">
        <span dir="ltr" className="inline-block">SolStorie's™</span> | כל הזכויות שמורות
      </p>
    </footer>
  );
};

export default GlobalFooter;
