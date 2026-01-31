import { useState } from 'react';
import { Filter, Sparkles, Moon, GraduationCap, Heart, TreePine, Book, Headphones, X } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface StoryFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  className?: string;
}

export interface FilterState {
  ageRange: string | null;
  theme: string | null;
  storyType: string | null;
}

const AGE_RANGES = [
  { value: '0-2', label: '0-2' },
  { value: '2-4', label: '2-4' },
  { value: '5-7', label: '5-7' },
  { value: '8-10', label: '8+' },
];

const THEMES = [
  { value: 'adventure', label: 'הרפתקה', icon: <Sparkles className="h-3 w-3" /> },
  { value: 'bedtime', label: 'לפני השינה', icon: <Moon className="h-3 w-3" /> },
  { value: 'educational', label: 'לימודי', icon: <GraduationCap className="h-3 w-3" /> },
  { value: 'friendship', label: 'חברות', icon: <Heart className="h-3 w-3" /> },
  { value: 'nature', label: 'טבע', icon: <TreePine className="h-3 w-3" /> },
];

const STORY_TYPES = [
  { value: 'text', label: 'טקסט', icon: <Book className="h-3 w-3" /> },
  { value: 'audio', label: 'אודיו', icon: <Headphones className="h-3 w-3" /> },
];

const StoryFilters = ({ onFilterChange, className }: StoryFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ageRange: null,
    theme: null,
    storyType: null,
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const updateFilter = (key: keyof FilterState, value: string | null) => {
    const newFilters = {
      ...filters,
      [key]: filters[key] === value ? null : value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = { ageRange: null, theme: null, storyType: null };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Button
          variant={isOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          סינון
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="mr-1 h-5 w-5 p-0 justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-3 w-3" />
            נקה
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="bg-card rounded-xl p-4 comic-shadow space-y-4 animate-in slide-in-from-top-2">
          {/* Age Range */}
          <div>
            <p className="text-sm font-medium mb-2">גיל</p>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map((age) => (
                <Badge
                  key={age.value}
                  variant={filters.ageRange === age.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => updateFilter('ageRange', age.value)}
                >
                  {age.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <p className="text-sm font-medium mb-2">נושא</p>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((theme) => (
                <Badge
                  key={theme.value}
                  variant={filters.theme === theme.value ? 'default' : 'outline'}
                  className="cursor-pointer gap-1"
                  onClick={() => updateFilter('theme', theme.value)}
                >
                  {theme.icon}
                  {theme.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Story Type */}
          <div>
            <p className="text-sm font-medium mb-2">סוג</p>
            <div className="flex flex-wrap gap-2">
              {STORY_TYPES.map((type) => (
                <Badge
                  key={type.value}
                  variant={filters.storyType === type.value ? 'default' : 'outline'}
                  className="cursor-pointer gap-1"
                  onClick={() => updateFilter('storyType', type.value)}
                >
                  {type.icon}
                  {type.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryFilters;
