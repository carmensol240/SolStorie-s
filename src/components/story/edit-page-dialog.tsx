import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNikud } from '@/hooks/use-nikud';
import { useStoryEdit } from '@/hooks/use-story-edit';
import { SignedImage } from '@/components/ui/signed-image';
import { Sparkles, Bold, Check, AlertCircle, Coins, Gift } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  storyId: string;
  pageNumber: number;
  totalPages: number;
  text: string;
  illustrationUrl?: string;
  onUpdate: (newText: string) => void;
}

const EditPageDialog = ({
  open,
  onOpenChange,
  pageId,
  storyId,
  pageNumber,
  totalPages,
  text,
  illustrationUrl,
  onUpdate,
}: EditPageDialogProps) => {
  const [pageText, setPageText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [fontSize, setFontSize] = useState<'regular' | 'large'>('regular');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);
  const { toast } = useToast();
  const { addNikud, isLoading: isAddingNikud } = useNikud();
  const { isFirstEdit, canEdit, performEdit, fetchEditCount, editCount } = useStoryEdit(storyId);

  const hasTextChanged = pageText !== text;

  useEffect(() => {
    setPageText(text);
  }, [text]);

  // Fetch edit count when dialog opens
  useEffect(() => {
    if (open && storyId) {
      fetchEditCount(storyId);
    }
  }, [open, storyId, fetchEditCount]);

  const handleAddNikud = async () => {
    const nikudText = await addNikud(pageText);
    if (nikudText) {
      setPageText(nikudText);
      toast({ title: 'הניקוד נוסף בהצלחה' });
    } else {
      toast({ title: 'שגיאה בהוספת ניקוד', variant: 'destructive' });
    }
  };

  const handleEnhanceText = async () => {
    if (!pageText.trim()) return;
    
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-text', {
        body: { text: pageText }
      });

      if (error) throw error;

      if (data?.enhancedText) {
        setPageText(data.enhancedText);
        toast({ title: 'הטקסט שודרג בהצלחה! ✨' });
      } else {
        throw new Error('לא התקבל טקסט משודרג');
      }
    } catch (error) {
      console.error('Error enhancing text:', error);
      toast({ 
        title: 'שגיאה בשדרוג הטקסט', 
        description: error instanceof Error ? error.message : 'נסה שוב מאוחר יותר',
        variant: 'destructive' 
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveClick = () => {
    // Show confirmation dialog before saving
    setShowEditConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowEditConfirmDialog(false);
    
    // Check if user can edit
    if (!canEdit()) {
      toast({ 
        title: 'אין מספיק קרדיטים',
        description: 'רכשו קרדיטים נוספים כדי להמשיך לערוך',
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);
    try {
      // First perform the edit (handles credit deduction if needed)
      const editSuccess = await performEdit();
      if (!editSuccess) {
        toast({ 
          title: 'שגיאה בביצוע העריכה',
          variant: 'destructive' 
        });
        setIsLoading(false);
        return;
      }

      // Then save the text change
      const { error } = await supabase
        .from('story_pages')
        .update({ text: pageText })
        .eq('id', pageId);

      if (error) throw error;

      setIsLoading(false);
      setShowConfirmation(true);
      
      // Show confirmation briefly, then close
      setTimeout(() => {
        toast({ title: 'העמוד עודכן בהצלחה! ✅' });
        onUpdate(pageText);
        setShowConfirmation(false);
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating page:', error);
      toast({ title: 'שגיאה בעדכון העמוד', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  const getTextareaClassName = () => {
    const classes = ['resize-none', 'min-h-[120px]'];
    if (isBold) classes.push('font-bold');
    if (fontSize === 'large') classes.push('text-lg');
    return classes.join(' ');
  };

  const getEditCostLabel = () => {
    if (editCount === null) return '';
    if (editCount === 0) {
      return (
        <span className="flex items-center gap-1 text-green-600">
          <Gift className="w-3 h-3" />
          עריכה ראשונה חינם!
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Coins className="w-3 h-3" />
        עלות: 1 קרדיט
      </span>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col" dir="rtl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>עריכת עמוד</span>
              <span className="text-xs font-normal">{getEditCostLabel()}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Pagination Indicator */}
          <div className="text-center text-sm text-muted-foreground py-1 border-b border-border/50 flex-shrink-0">
            עמוד {pageNumber} מתוך {totalPages}
          </div>

          <div className="space-y-3 py-3 overflow-y-auto flex-1 min-h-0">
            {/* Image Preview */}
            {illustrationUrl && (
              <div className="flex justify-center">
                <SignedImage
                  src={illustrationUrl}
                  storyId={storyId}
                  alt={`איור עמוד ${pageNumber}`}
                  className="w-24 h-16 object-cover rounded-lg border border-border shadow-sm"
                />
              </div>
            )}

            {/* Text Area */}
            <div className="space-y-2">
              <Label htmlFor="pageText">טקסט העמוד</Label>
              <Textarea
                id="pageText"
                value={pageText}
                onChange={(e) => setPageText(e.target.value)}
                placeholder="טקסט העמוד"
                rows={4}
                className={getTextareaClassName()}
              />
            </div>

            {/* Text Styling Toolbar */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isBold ? "default" : "outline"}
                size="sm"
                onClick={() => setIsBold(!isBold)}
                className="w-8 h-8 p-0"
                aria-label="הדגשה"
              >
                <Bold className="w-4 h-4" />
              </Button>
              
              <Select value={fontSize} onValueChange={(v) => setFontSize(v as 'regular' | 'large')}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">רגיל</SelectItem>
                  <SelectItem value="large">גדול</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnhanceText}
                disabled={isEnhancing || !pageText.trim()}
                className="gap-1.5 text-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isEnhancing ? 'משדרג...' : 'שדרג טקסט'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNikud}
                disabled={isAddingNikud || !pageText.trim()}
                className="gap-1.5 text-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAddingNikud ? 'מוסיף...' : 'הוסף ניקוד'}
              </Button>
            </div>

            {/* Edit credit info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {isFirstEdit ? 'העריכה הראשונה לכל סיפור - חינם!' : 'עריכות נוספות עולות 1 קרדיט'}
              </span>
            </div>
          </div>

          {/* Fixed Footer with Save Button - Always Visible */}
          <div className="flex-shrink-0 border-t border-border pt-3 flex gap-2 flex-row-reverse">
            {showConfirmation ? (
              <Button disabled className="min-w-[120px] bg-green-500 hover:bg-green-500">
                <Check className="w-4 h-4 ml-1" />
                אושר!
              </Button>
            ) : (
              <Button 
                onClick={handleSaveClick} 
                disabled={isLoading || !hasTextChanged || !canEdit()}
                className="min-w-[120px] gap-2 bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'שומר...' : (
                  <>
                    <Check className="w-4 h-4" />
                    שמור שינויים
                  </>
                )}
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              disabled={showConfirmation}
            >
              ביטול
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Dialog */}
      <AlertDialog open={showEditConfirmDialog} onOpenChange={setShowEditConfirmDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>אישור עריכה</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-relaxed">
              ה-AI שלנו לפעמים טועה, ולכן העריכה הראשונה לכל סיפור היא עלינו! 
              {!isFirstEdit && (
                <span className="block mt-2 font-medium text-foreground">
                  (החל מהעריכה השנייה לאותו סיפור, השימוש יחויב בקרדיט 1)
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              {isFirstEdit ? 'ערוך בחינם' : 'ערוך (1 קרדיט)'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditPageDialog;
