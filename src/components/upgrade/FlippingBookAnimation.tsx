import "./flipping-book.css";
import { useEffect, useState } from "react";
import cover from "@/assets/sol-vet-cover.jpg";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const FlippingBookAnimation = () => {
  const { user } = useAuth();
  const [childName, setChildName] = useState<string>("הסיפור שלך");

  useEffect(() => {
    if (!user?.id) {
      setChildName("הסיפור שלך");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("children")
        .select("name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data?.name) setChildName(data.name);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <div className="fba-root" dir="rtl" aria-hidden="true">
      <div className="fba-heading">✨ הפוך את הסיפור לספר מודפס אמיתי!</div>
      <div className="fba-scene">
        <div className="fba-spine">
          <span className="fba-spine-text">{childName} · SolStorie&apos;s™</span>
        </div>
        <div className="fba-book">
          <img className="fba-cover-img" src={cover} alt="" loading="lazy" />
          <div className="fba-badge">✨ SolStorie&apos;s™</div>
          <div className="fba-overlay">
            <div className="fba-title">{childName}</div>
            <div className="fba-subtitle">💛 הסיפור של {childName}</div>
            <div className="fba-logo-text">SolStorie&apos;s™ · soulstory.co.il</div>
          </div>
        </div>
      </div>
      <div className="fba-caption">הורידו PDF ✓ שלחו לבית דפוס ✓ או הדפיסו בבית</div>
    </div>
  );
};

export default FlippingBookAnimation;
