import { Accessibility, Eye, Volume2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAccessibility, type FontSize } from "@/hooks/use-accessibility";

const fontSizeOptions: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'קטן' },
  { value: 'medium', label: 'בינוני' },
  { value: 'large', label: 'גדול' },
];

const AccessibilityMenu = () => {
  const { visualAidMode, setVisualAidMode, audioSupport, setAudioSupport, fontSize, setFontSize } = useAccessibility();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="fixed bottom-20 left-4 z-50">
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

          {/* Font Size */}
          <div className="p-3 rounded-xl bg-muted/50 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Type className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-right">
                <p className="font-medium text-sm text-foreground">גודל גופן</p>
                <p className="text-xs text-muted-foreground">בחרו גודל נוח לקריאה</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              {fontSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFontSize(option.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    fontSize === option.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background hover:bg-muted border border-border'
                  }`}
                  aria-label={`גודל גופן ${option.label}`}
                  aria-pressed={fontSize === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Support */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Volume2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-right">
                <p className="font-medium text-sm text-foreground">הקראה קולית</p>
                <p className="text-xs text-muted-foreground">הפעלת כפתור הקראה בסיפורים</p>
              </div>
            </div>
            <Switch
              checked={audioSupport}
              onCheckedChange={setAudioSupport}
              aria-label="הפעל הקראה קולית"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AccessibilityMenu;
