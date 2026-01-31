import { Check, Lock } from "lucide-react";

const TrustBadges = () => {
  const badges = [
    { text: "תשלום חד-פעמי בלבד", icon: Check },
    { text: "ללא מנוי וללא התחייבות", icon: Check },
    { text: "הסיפורים נשמרים תמיד", icon: Check },
  ];

  return (
    <div className="space-y-3">
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-2 text-muted-foreground">
          <badge.icon className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-sm">{badge.text}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 text-muted-foreground mt-4 pt-3 border-t border-border">
        <Lock className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs">מאובטח ובטוח לתשלום</span>
      </div>
    </div>
  );
};

export default TrustBadges;
