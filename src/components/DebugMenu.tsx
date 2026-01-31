import { useState } from "react";
import { Bug } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const debugRoutes = [
  { path: "/", label: "🏠 בית" },
  { path: "/auth", label: "🔐 התחברות" },
  { path: "/create", label: "✨ יצירת סיפור" },
  { path: "/library", label: "📚 הספרייה שלי" },
  { path: "/children", label: "👶 הילדים שלי" },
  { path: "/settings", label: "⚙️ הגדרות" },
  { path: "/upgrade", label: "💳 שדרוג" },
  { path: "/share", label: "🎁 שתף והרווח" },
  { path: "/terms", label: "📄 תנאי שימוש" },
  { path: "/privacy", label: "🔒 מדיניות פרטיות" },
  { path: "/consent", label: "✅ הסכמה משפטית" },
  { path: "/reset-password", label: "🔑 איפוס סיסמה" },
  { path: "/account-exit", label: "🚪 יציאה מחשבון" },
];

const DebugMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-sm border-border shadow-md"
          aria-label="תפריט Debug"
        >
          <Bug className="w-5 h-5 text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="flex items-center justify-center gap-2">
            <Bug className="w-5 h-5" />
            תפריט ניווט
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto">
          <div className="grid gap-2">
            {debugRoutes.map((route) => (
              <DrawerClose asChild key={route.path}>
                <button
                  onClick={() => handleNavigate(route.path)}
                  className="w-full text-right px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-foreground font-medium"
                >
                  {route.label}
                </button>
              </DrawerClose>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default DebugMenu;
