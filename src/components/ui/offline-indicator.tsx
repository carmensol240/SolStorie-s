import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  isOnline: boolean;
  className?: string;
}

const OfflineIndicator = ({ isOnline, className }: OfflineIndicatorProps) => {
  if (isOnline) return null;

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50',
        'bg-amber-500 text-white px-4 py-2 rounded-full',
        'flex items-center gap-2 text-sm font-medium',
        'shadow-lg animate-bounce-gentle',
        className
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>אופליין - קורא מהזיכרון</span>
    </div>
  );
};

export default OfflineIndicator;
