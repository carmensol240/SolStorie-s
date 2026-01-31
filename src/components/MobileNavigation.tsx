import { Library, Home, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // סדר מימין לשמאל (RTL): בית → הספרים שלי → פרופיל
  const navItems = [
    { path: "/", icon: Home, label: "בית", primary: false },
    { path: "/library", icon: Library, label: "הסיפורים שלי", primary: false },
    { path: "/settings", icon: User, label: "פרופיל", primary: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border" role="navigation" aria-label="ניווט ראשי">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
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
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-h-[44px] min-w-[40px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                item.primary && !isActive && "bg-primary/10 text-primary",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : !item.primary && "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
