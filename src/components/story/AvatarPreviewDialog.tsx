import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Check, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isDevModeEnabled } from '@/hooks/use-dev-mode';

const MAX_AVATAR_REGENERATIONS = 2;

interface AvatarPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPhoto: string;
  childId: string;
  childName: string;
  onConfirm: (avatarUrl: string) => void;
  skipStorage?: boolean;
  regenerationCount?: number;
  onRegenerationCountChange?: (count: number) => void;
  existingAvatarUrl?: string | null;
}

const AvatarPreviewDialog = ({
  open,
  onOpenChange,
  originalPhoto,
  childId,
  childName,
  onConfirm,
  skipStorage = false,
  regenerationCount = 0,
  onRegenerationCountChange,
  existingAvatarUrl,
}: AvatarPreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localRegenerationCount, setLocalRegenerationCount] = useState(regenerationCount);
  const { toast } = useToast();
  
  const canRegenerate = localRegenerationCount < MAX_AVATAR_REGENERATIONS;

  // Use existing avatar if available
  useEffect(() => {
    if (existingAvatarUrl && !previewUrl) {
      setPreviewUrl(existingAvatarUrl);
    }
  }, [existingAvatarUrl, previewUrl]);

  // Sync regeneration count from props
  useEffect(() => {
    setLocalRegenerationCount(regenerationCount);
  }, [regenerationCount]);

  const generatePreview = useCallback(async () => {
    if (!originalPhoto || isGenerating) return;
    
    // Check regeneration limit
    if (localRegenerationCount >= MAX_AVATAR_REGENERATIONS) {
      toast({
        title: 'הגעת למגבלת היצירות',
        description: `ניתן ליצור דמות חדשה עד ${MAX_AVATAR_REGENERATIONS} פעמים בלבד`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    setErrorMessage(null);
    setPreviewUrl(null);
    
    try {
      console.log('Starting avatar generation (auth optional)');
      
      const { data, error } = await supabase.functions.invoke('preview-child-avatar', {
        body: { childPhoto: originalPhoto }
      });

      console.log('Avatar generation response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'שגיאה בשרת');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.previewUrl) {
        setPreviewUrl(data.previewUrl);
        const newCount = localRegenerationCount + 1;
        setLocalRegenerationCount(newCount);
        onRegenerationCountChange?.(newCount);
        console.log('Avatar generated successfully, count:', newCount);
      } else {
        throw new Error('לא התקבלה תמונה מהשרת');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      const message = error instanceof Error ? error.message : 'נסה שוב מאוחר יותר';
      setErrorMessage(message);
      toast({
        title: 'שגיאה ביצירת הדמות',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [originalPhoto, isGenerating, toast, localRegenerationCount, onRegenerationCountChange]);

  const handleConfirm = async () => {
    if (!previewUrl) return;
    
    setIsSaving(true);
    try {
      // If skipStorage, dev mode, temp child, or guest user — return base64 URL directly
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (skipStorage || childId === 'temp-child' || isDevModeEnabled() || !currentUser) {
        // For guest users, also save to localStorage for later claim
        if (!currentUser) {
          localStorage.setItem('guest_avatar_url', previewUrl);
          console.log('Saved guest avatar to localStorage');
        }
        
        toast({
          title: 'הדמות נוצרה בהצלחה! ✨',
          description: `הדמות של ${childName} מוכנה לסיפורים`,
        });
        
        onConfirm(previewUrl);
        onOpenChange(false);
        return;
      }
      
      // Enhanced auth verification before upload
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('שגיאה באימות המשתמש');
      }
      if (!user) {
        throw new Error('יש להתחבר כדי לשמור תמונות');
      }
      
      console.log('Saving avatar for user:', user.id, 'child:', childId);

      // Convert base64 to blob and upload to storage
      const base64Content = previewUrl.includes(',') 
        ? previewUrl.split(',')[1] 
        : previewUrl;
      
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Use user folder structure to comply with RLS policies
      const fileName = `${user.id}/${childId}-avatar.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('child-photos')
        .upload(fileName, blob, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Store only the file path (not public URL) for private bucket
      // Update child record with file path - signed URLs will be fetched when displaying
      console.log('Updating child avatar_url:', { childId, fileName });
      const { error: updateError } = await supabase
        .from('children')
        .update({ avatar_url: fileName })
        .eq('id', childId);
        
      if (updateError) throw updateError;
      
      toast({
        title: 'הדמות נשמרה בהצלחה! ✨',
        description: `הדמות של ${childName} תופיע בכל הסיפורים`,
      });
      
      // Return the file path - caller should fetch signed URL when needed
      onConfirm(fileName);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast({
        title: 'שגיאה בשמירת הדמות',
        description: error instanceof Error ? error.message : 'נסה שוב מאוחר יותר',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-generate preview when dialog opens (only if no existing avatar)
  useEffect(() => {
    if (open && originalPhoto && !previewUrl && !isGenerating && !errorMessage && !existingAvatarUrl) {
      generatePreview();
    }
  }, [open, originalPhoto, previewUrl, isGenerating, errorMessage, generatePreview, existingAvatarUrl]);

  // Reset state when dialog closes (but keep existing avatar)
  useEffect(() => {
    if (!open) {
      if (!existingAvatarUrl) {
        setPreviewUrl(null);
      }
      setErrorMessage(null);
    }
  }, [open, existingAvatarUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            תצוגה מקדימה של הדמות
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            כך תיראה הדמות של {childName} בסיפורים
          </p>

          {/* Image comparison */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Original Photo */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">תמונה מקורית</p>
              <div className="aspect-square w-full rounded-xl overflow-hidden border-2 border-muted">
                <img 
                  src={originalPhoto} 
                  alt="תמונה מקורית" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Generated Avatar */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">דמות בסיפור</p>
              <div className="aspect-square w-full rounded-xl overflow-hidden border-2 border-primary bg-muted flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-2 p-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground text-center">יוצר דמות מונפשת...</span>
                  </div>
                ) : errorMessage ? (
                  <div className="flex flex-col items-center gap-2 p-2">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                    <span className="text-xs text-destructive text-center">{errorMessage}</span>
                  </div>
                ) : previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="דמות בסיפור" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">מתחיל...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error retry button */}
          {errorMessage && !isGenerating && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generatePreview()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </Button>
            </div>
          )}

          {/* Info text */}
          {!errorMessage && (
            <div className="bg-primary/5 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">
                💡 הדמות הזו תופיע בכל הסיפורים של {childName} כדי לשמור על עקביות
              </p>
              {/* Show remaining regenerations */}
              <p className="text-xs text-muted-foreground mt-1">
                {canRegenerate ? (
                  <>נותרו לך <strong>{MAX_AVATAR_REGENERATIONS - localRegenerationCount}</strong> יצירות מחדש</>
                ) : (
                  <span className="text-amber-600 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    ניצלת את כל יצירות האווטאר
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse sm:flex-row-reverse">
          <Button
            onClick={handleConfirm}
            disabled={!previewUrl || isGenerating || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                אישור ושמירה
              </>
            )}
          </Button>
          
          {previewUrl && !isGenerating && canRegenerate && (
            <Button
              variant="outline"
              onClick={() => generatePreview()}
              disabled={isGenerating || !canRegenerate}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              יצירה מחדש ({MAX_AVATAR_REGENERATIONS - localRegenerationCount})
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarPreviewDialog;
