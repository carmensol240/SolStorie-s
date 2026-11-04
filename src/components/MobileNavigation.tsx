import React from "react";
import { Library, Home, Settings, PlusCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const MobileNavigation = React.forwardRef<HTMLElement>((_, ref) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/adventure", icon: Home, label: "בית" },
    { path: "/create", icon: PlusCircle, label: "צור סיפור" },
    { path: "/library", icon: Library, label: "הסיפורים שלי" },
    { path: "/settings", icon: Settings, label: "הגדרות" },
  ];

  const p = location.pathname;
  const activePath = p.startsWith("/story/") ? "/library" : navItems.find((i) => p === i.path || p.startsWith(i.path + "/"))?.path;

  return (
    <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-t border-purple-100/50 shadow-lg" role="navigation" aria-label="ניווט ראשי">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto px-4 pb-safe">
        {navItems.map((item) => {
          const isActive = activePath === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={`מעבר ל${item.label}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-h-[48px] min-w-[48px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-purple-800 hover:text-pink-600 hover:bg-purple-50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium leading-tight whitespace-nowrap">{item.label}</span>
              {isActive && <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

MobileNavigation.displayName = "MobileNavigation";

export default MobileNavigation;
