import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE = "SolStorie's™ – עולמה הקסום של סול";

const ROUTE_TITLES: { match: RegExp; title: string }[] = [
  { match: /^\/$/, title: "דף הבית" },
  { match: /^\/adventure/, title: "הרפתקה" },
  { match: /^\/about/, title: "אודות" },
  { match: /^\/auth/, title: "התחברות" },
  { match: /^\/verify-email/, title: "אימות אימייל" },
  { match: /^\/reset-password/, title: "איפוס סיסמה" },
  { match: /^\/terms/, title: "תנאי שימוש" },
  { match: /^\/privacy/, title: "מדיניות פרטיות" },
  { match: /^\/consent/, title: "אישור הסכמה" },
  { match: /^\/onboarding/, title: "הכרות" },
  { match: /^\/children/, title: "פרופילי ילדים" },
  { match: /^\/create/, title: "יצירת סיפור" },
  { match: /^\/demo-story/, title: "סיפור לדוגמא" },
  { match: /^\/story\//, title: "צפייה בסיפור" },
  { match: /^\/library/, title: "הספרייה שלי" },
  { match: /^\/flipbook/, title: "ספרון דיגיטלי" },
  { match: /^\/s\//, title: "סיפור משותף" },
  { match: /^\/view\//, title: "סיפור משותף" },
  { match: /^\/profile/, title: "הפרופיל שלי" },
  { match: /^\/settings/, title: "הגדרות" },
  { match: /^\/account-exit/, title: "סגירת חשבון" },
  { match: /^\/upgrade/, title: "שדרוג חבילה" },
  { match: /^\/gift/, title: "כרטיס מתנה" },
  { match: /^\/toolkit/, title: "ארגז כלים להורים" },
  { match: /^\/admin\/dashboard/, title: "לוח ניהול" },
  { match: /^\/admin\/reviews/, title: "ניהול ביקורות" },
  { match: /^\/share/, title: "שיתוף וקבלת מטבעות" },
  { match: /^\/contact/, title: "צרו קשר" },
];

const PageTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const route = ROUTE_TITLES.find((r) => r.match.test(pathname));
    document.title = route ? `${route.title} | ${BASE}` : BASE;
  }, [pathname]);

  return null;
};

export default PageTitle;