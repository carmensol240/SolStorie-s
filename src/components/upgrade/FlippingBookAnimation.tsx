import { useEffect, useState } from "react";
import "./flipping-book.css";
import coverFears from "@/assets/cover-fears.png";
import coverFriends from "@/assets/cover-friends.png";
import coverSchool from "@/assets/cover-school.png";

const PAGES = [
  { src: coverFriends, label: "סול והחברים יוצאים להרפתקה" },
  { src: coverFears, label: "סול מתגברת על הפחד" },
  { src: coverSchool, label: "יום מיוחד בבית הספר" },
];

const FLIP_INTERVAL = 2800;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const FlippingBookAnimation = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % PAGES.length);
    }, FLIP_INTERVAL);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="fba-root" dir="rtl" aria-hidden="true">
      <div className="fba-title">
        ✨ הפכו את הסיפור ל<span>ספר אמיתי!</span>
      </div>

      <div className="fba-stage">
        <div className="fba-glow" />
        <div className="fba-book-wrap">
          <div className="fba-spine" />
          <div className="fba-book">
            {PAGES.map((p, i) => (
              <div
                key={i}
                className={`fba-page${i === active ? " fba-active" : ""}`}
              >
                <img src={p.src} alt="" loading="lazy" />
                <div className="fba-page-label">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fba-dots">
        {PAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`fba-dot${i === active ? " fba-active" : ""}`}
            onClick={() => setActive(i)}
            aria-label={`עמוד ${i + 1}`}
          />
        ))}
      </div>

      <div className="fba-bottom">
        <div className="fba-bottom-main">הספר שלכם — מודפס ומוכן</div>
        <div className="fba-bottom-sub">איורים מותאמים אישית לילד</div>
        <div className="fba-logo">SolStorie's™ · soulstory.co.il</div>
      </div>
    </div>
  );
};

export default FlippingBookAnimation;