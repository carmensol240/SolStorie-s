import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvatarPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPhoto: string;
  childId: string;
  childName: string;
  onConfirm: (avatarUrl: string) => void;
  skipStorage?: boolean;
}

const AvatarPreviewDialog = ({
  open,
  onOpenChange,
  originalPhoto,
  childId,
  childName,
  onConfirm,
  skipStorage = false,
}: AvatarPreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const generatePreview = useCallback(async () => {
    if (!originalPhoto || isGenerating) return;
    
    setIsGenerating(true);
    setErrorMessage(null);
    setPreviewUrl(null);
    
    try {
      console.log('Starting avatar generation...');
      
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
        console.log('Avatar generated successfully');
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
  }, [originalPhoto, isGenerating, toast]);

  const handleConfirm = async () => {
    if (!previewUrl) return;
    
    setIsSaving(true);
    try {
      // If skipStorage, just return the base64 URL directly
      if (skipStorage || childId === 'temp-child') {
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
      
      const { data: urlData } = supabase.storage
        .from('child-photos')
        .getPublicUrl(fileName);
      
      // Update child record with avatar URL
      const { error: updateError } = await supabase
        .from('children')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', childId);
        
      if (updateError) throw updateError;
      
      toast({
        title: 'הדמות נשמרה בהצלחה! ✨',
        description: `הדמות של ${childName} תופיע בכל הסיפורים`,
      });
      
      onConfirm(urlData.publicUrl);
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

  // Auto-generate preview when dialog opens
  useEffect(() => {
    if (open && originalPhoto && !previewUrl && !isGenerating && !errorMessage) {
      generatePreview();
    }
  }, [open, originalPhoto, previewUrl, isGenerating, errorMessage, generatePreview]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      setErrorMessage(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
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
          <div className="grid grid-cols-2 gap-4">
            {/* Original Photo */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">תמונה מקורית</p>
              <div className="aspect-square rounded-xl overflow-hidden border-2 border-muted">
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
              <div className="aspect-square rounded-xl overflow-hidden border-2 border-primary bg-muted flex items-center justify-center">
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
                onClick={generatePreview}
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
          
          {previewUrl && !isGenerating && (
            <Button
              variant="outline"
              onClick={generatePreview}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              יצירה מחדש
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
