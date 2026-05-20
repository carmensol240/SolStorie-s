import "./flipping-book.css";
import cover from "@/assets/sol-vet-cover.jpg";

export const FlippingBookAnimation = () => {
  return (
    <div className="fba-root" dir="rtl" aria-hidden="true">
      <div className="fba-heading">✨ הפוך את הסיפור לספר מודפס אמיתי!</div>
      <div className="fba-scene">
        <div className="fba-spine">
          <span className="fba-spine-text">סול רופאת החיות · SolStorie&apos;s™</span>
        </div>
        <div className="fba-book">
          <img className="fba-cover-img" src={cover} alt="" loading="lazy" />
          <div className="fba-badge">✨ SolStorie&apos;s™</div>
          <div className="fba-overlay">
            <div className="fba-title">סול רופאת החיות</div>
            <div className="fba-subtitle">💛 הסיפור של סול</div>
            <div className="fba-logo-text">SolStorie&apos;s™ · soulstory.co.il</div>
          </div>
        </div>
      </div>
      <div className="fba-caption">הורידי PDF ✓ שלחי לבית דפוס ✓ או הדפיסי בבית</div>
    </div>
  );
};

export default FlippingBookAnimation;
