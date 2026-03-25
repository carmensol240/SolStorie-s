import { useState } from 'react';
import { Clock, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChildPhotoRecord, useChildPhotoHistory } from '@/hooks/use-child-photo-history';

interface PhotoHistoryGalleryProps {
  childId: string;
  childName: string;
  onRestore: () => void;
}

const PhotoHistoryGallery = ({ childId, childName, onRestore }: PhotoHistoryGalleryProps) => {
  const { photos, loading, restoreVersion } = useChildPhotoHistory(childId);
  const { toast } = useToast();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Only show if there's more than 1 version (history exists)
  const inactivePhotos = photos.filter(p => !p.is_active);
  if (loading || inactivePhotos.length === 0) return null;

  const handleRestore = async (record: ChildPhotoRecord) => {
    setRestoringId(record.id);
    try {
      await restoreVersion(record);
      toast({
        title: 'גרסה שוחזרה! ✨',
        description: `התמונה של ${childName} עודכנה בהצלחה`,
      });
      onRestore();
    } catch (err) {
      console.error('Error restoring version:', err);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לשחזר את הגרסה',
        variant: 'destructive',
      });
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground">גרסאות קודמות</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        {inactivePhotos.map((record) => (
          <div key={record.id} className="flex-shrink-0 w-24 space-y-1">
            <div className="relative group">
              {/* Show avatar if exists, otherwise original photo */}
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-muted bg-muted">
                {record.avatar_url ? (
                  <img
                    src={record.avatar_url}
                    alt="גרסה קודמת"
                    className="w-full h-full object-cover"
                  />
                ) : record.original_image_url ? (
                  <img
                    src={record.original_image_url}
                    alt="גרסה קודמת"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">
                    📷
                  </div>
                )}
              </div>
              {/* Restore button overlay */}
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-1 left-1/2 -translate-x-1/2 h-6 px-2 text-[10px] gap-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                onClick={() => handleRestore(record)}
                disabled={restoringId === record.id}
              >
                {restoringId === record.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3" />
                    שחזר
                  </>
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center truncate">
              {formatDate(record.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoHistoryGallery;
