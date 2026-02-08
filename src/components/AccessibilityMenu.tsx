import { useState } from "react";
import { Accessibility, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/hooks/use-accessibility";

const AccessibilityMenu = () => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('accessibility_dismissed') === 'true';
  });
  
  const { visualAidMode, setVisualAidMode } = useAccessibility();

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDismissed(true);
    localStorage.setItem('accessibility_dismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="fixed bottom-20 left-4 z-50">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center hover:bg-gray-700 z-10 shadow-md"
            aria-label="הסתר כפתור נגישות"
          >
            <X className="w-3 h-3" />
          </button>
          {/* Main button */}
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg border-0"
            aria-label="הגדרות נגישות"
          >
            <Accessibility className="h-6 w-6 text-white" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-4" 
        align="start"
        side="top"
      >
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-blue-500" />
            נגישות
          </h3>

          {/* Visual Aid Mode */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-right">
                <p className="font-medium text-sm text-foreground">מצב ניגודיות גבוהה</p>
                <p className="text-xs text-muted-foreground">גופן גדול וצבעים ברורים</p>
              </div>
            </div>
            <Switch
              checked={visualAidMode}
              onCheckedChange={setVisualAidMode}
              aria-label="הפעל מצב ניגודיות גבוהה"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AccessibilityMenu;
