import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PackageCardProps {
  stories: number;
  price: number;
  badge?: string;
  subtitle: string;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
}

const PackageCard = ({
  stories,
  price,
  badge,
  subtitle,
  isHighlighted = false,
  isSelected = false,
  onSelect,
}: PackageCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-200 w-full",
        isHighlighted
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border bg-card",
        isSelected && "ring-2 ring-primary ring-offset-2",
        "hover:border-primary/70 active:scale-[0.98]"
      )}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
          {badge}
        </div>
      )}

      {/* Stories count */}
      <div className="text-3xl font-black text-foreground mb-1">
        {stories}
      </div>
      <div className="text-sm text-muted-foreground mb-3">סיפורים</div>

      {/* Price */}
      <div className="text-2xl font-bold text-foreground mb-1">
        ₪{price}
      </div>
      <div className="text-xs text-muted-foreground mb-4">{subtitle}</div>

      {/* Selection indicator */}
      {isSelected ? (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-5 h-5 text-primary-foreground" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30" />
      )}
    </button>
  );
};

export default PackageCard;
