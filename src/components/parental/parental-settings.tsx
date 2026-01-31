import { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Clock, 
  Filter, 
  Crown, 
  ChevronLeft,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/use-settings';
import { useToast } from '@/hooks/use-toast';

const AVATARS = ['🦁', '🐰', '🌟', '🦋', '🐻', '🦊', '🐼', '🦄', '🐸', '🐨'];

const AGE_RANGES = [
  { label: '0-2', min: 0, max: 2 },
  { label: '2-4', min: 2, max: 4 },
  { label: '5-7', min: 5, max: 7 },
  { label: '8+', min: 8, max: 10 },
];

interface ParentalSettingsProps {
  onBack?: () => void;
}

const ParentalSettings = ({ onBack }: ParentalSettingsProps) => {
  const { settings, updateSettings, isLoading } = useSettings();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (updates: Parameters<typeof updateSettings>[0]) => {
    updateSettings(updates);
    setHasChanges(true);
  };

  const handleSave = () => {
    toast({
      title: 'הגדרות נשמרו',
      description: 'ההגדרות עודכנו בהצלחה',
    });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">הגדרות הורים</h1>
        <div className="w-10" />
      </div>

      {/* Avatar Selection */}
      <section className="bg-card rounded-2xl p-4 comic-shadow">
        <h2 className="font-bold text-lg mb-3">בחר אווטאר</h2>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleChange({ avatar_emoji: emoji })}
              className={`text-3xl p-2 rounded-xl transition-all ${
                settings.avatar_emoji === emoji
                  ? 'bg-primary/20 scale-110 ring-2 ring-primary'
                  : 'hover:bg-muted'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>

      {/* Silent Mode */}
      <section className="bg-card rounded-2xl p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.silent_mode ? (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-5 w-5 text-primary" />
            )}
            <div>
              <Label className="font-bold">מצב שקט</Label>
              <p className="text-sm text-muted-foreground">
                השתק את כל הצלילים באפליקציה
              </p>
            </div>
          </div>
          <Switch
            checked={settings.silent_mode}
            onCheckedChange={(checked) => handleChange({ silent_mode: checked })}
          />
        </div>
      </section>

      {/* Screen Time Limit */}
      <section className="bg-card rounded-2xl p-4 comic-shadow">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <Label className="font-bold">הגבלת זמן מסך</Label>
            <p className="text-sm text-muted-foreground">
              {settings.screen_time_limit} דקות ביום
            </p>
          </div>
        </div>
        <Slider
          value={[settings.screen_time_limit]}
          onValueChange={([value]) => handleChange({ screen_time_limit: value })}
          min={15}
          max={120}
          step={15}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>15 דק׳</span>
          <span>120 דק׳</span>
        </div>
      </section>

      {/* Age Filter */}
      <section className="bg-card rounded-2xl p-4 comic-shadow">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <div>
            <Label className="font-bold">סינון לפי גיל</Label>
            <p className="text-sm text-muted-foreground">
              הצג סיפורים מתאימים לגיל
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((range) => {
            const isSelected = 
              settings.age_filter_min === range.min && 
              settings.age_filter_max === range.max;
            return (
              <Badge
                key={range.label}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2"
                onClick={() =>
                  handleChange({
                    age_filter_min: range.min,
                    age_filter_max: range.max,
                  })
                }
              >
                גיל {range.label}
              </Badge>
            );
          })}
          <Badge
            variant={
              settings.age_filter_min === 0 && settings.age_filter_max === 10
                ? 'default'
                : 'outline'
            }
            className="cursor-pointer px-4 py-2"
            onClick={() =>
              handleChange({ age_filter_min: 0, age_filter_max: 10 })
            }
          >
            הכל
          </Badge>
        </div>
      </section>

      {/* Subscription Mockup */}
      <section className="bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 rounded-2xl p-4 border-2 border-amber-300">
        <div className="flex items-center gap-3 mb-3">
          <Crown className="h-6 w-6 text-amber-500" />
          <div>
            <h2 className="font-bold text-lg">מנוי פרימיום</h2>
            <Badge variant="secondary">בקרוב</Badge>
          </div>
        </div>
        <ul className="text-sm space-y-1 text-muted-foreground mb-4">
          <li>✨ סיפורים ללא הגבלה</li>
          <li>🎨 איורים מותאמים אישית</li>
          
          <li>📚 גישה לארכיון המלא</li>
        </ul>
        <Button className="w-full" disabled>
          בקרוב...
        </Button>
      </section>

      {/* Save Button */}
      {hasChanges && (
        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="h-4 w-4" />
          שמור הגדרות
        </Button>
      )}
    </div>
  );
};

export default ParentalSettings;
