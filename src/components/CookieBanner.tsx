import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CONSENT_KEY, CONSENT_TEXT, getConsent, setConsent, type ConsentChoice } from "@/lib/consent";
import { loadTrackersIfAllowed, stopTrackers } from "@/lib/trackers";

const CookieBanner = () => {
  const [open, setOpen] = useState(() => !getConsent());
  const current = getConsent()?.choice;

  useEffect(() => {
    loadTrackersIfAllowed();
    const reopen = () => setOpen(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CONSENT_KEY) return;
      if (getConsent()?.choice === "all") loadTrackersIfAllowed(); else stopTrackers();
    };
    window.addEventListener("open-cookie-settings", reopen);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("open-cookie-settings", reopen);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const choose = (c: ConsentChoice) => {
    setConsent(c);
    if (c === "all") loadTrackersIfAllowed(); else stopTrackers();
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div
      role="region"
      aria-label="הודעת עוגיות"
      dir="rtl"
      className="fixed inset-x-2 bottom-20 z-[70] mx-auto max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-lg p-3"
    >
      <p className="text-sm leading-snug">{CONSENT_TEXT}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="outline" className="min-h-12 text-sm font-semibold" aria-pressed={current === "all"} onClick={() => choose("all")}>
          מאשר/ת הכל
        </Button>
        <Button variant="outline" className="min-h-12 text-sm font-semibold" aria-pressed={current === "necessary"} onClick={() => choose("necessary")}>
          רק הכרחיות
        </Button>
      </div>
      <Link to="/privacy" className="mt-2 inline-block text-sm text-primary underline underline-offset-2">
        למדיניות הפרטיות
      </Link>
    </div>
  );
};

export default CookieBanner;
