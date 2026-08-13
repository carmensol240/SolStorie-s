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
    { path: "/library", icon: Library, label: "ספרייה" },
    { path: "/settings", icon: Settings, label: "הגדרות" },
  ];

  return (
    <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-t border-purple-100/50 shadow-lg" role="navigation" aria-label="ניווט ראשי">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto px-4 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={`מעבר ל${item.label}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-h-[48px] min-w-[48px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2",
                isActive 
                  ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white" 
                  : "text-purple-800 hover:text-pink-600 hover:bg-purple-50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

MobileNavigation.displayName = "MobileNavigation";

export default MobileNavigation;
