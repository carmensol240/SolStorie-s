import { Library, Home, User, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/adventure", icon: Home, label: "בית" },
    { path: "/library", icon: Library, label: "ספרייה" },
    { path: "/profile", icon: User, label: "פרופיל" },
    { path: "/settings", icon: Settings, label: "הגדרות" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-md border-t border-purple-100/50 shadow-lg" role="navigation" aria-label="ניווט ראשי">
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
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-h-[44px] min-w-[40px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2",
                isActive 
                  ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white" 
                  : "text-purple-600 hover:text-pink-500 hover:bg-purple-50"
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
};

export default MobileNavigation;
