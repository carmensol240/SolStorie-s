import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNikud } from '@/hooks/use-nikud';
import { useStoryEdit } from '@/hooks/use-story-edit';
import { useEditCredits } from '@/hooks/use-edit-credits';
import { SignedImage } from '@/components/ui/signed-image';
import { Sparkles, Bold, Check, AlertCircle, Coins, Gift, ChevronRight, ChevronLeft } from 'lucide-react';

interface PageData {
  id: string;
  page_number: number;
  text: string;
  illustration_url?: string | null;
}

interface EditPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  storyId: string;
  pageNumber: number;
  totalPages: number;
  text: string;
  illustrationUrl?: string;
  onUpdate: (newText: string, pageId?: string) => void;
  allPages?: PageData[];
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
  allPages,
}: EditPageDialogProps) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [fontSize, setFontSize] = useState<'regular' | 'large'>('regular');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { addNikud, isLoading: isAddingNikud, error: nikudError } = useNikud();
  const { canEdit, performEdit, fetchEditCount, editCount } = useStoryEdit(storyId);
  const { freeEditsRemaining, refetch: refetchEditCredits } = useEditCredits();

  const pages: PageData[] = allPages && allPages.length > 0
    ? allPages
    : [{ id: pageId, page_number: pageNumber, text, illustration_url: illustrationUrl }];

  const currentPage = pages[currentPageIndex];
  const currentPageId = currentPage?.id || pageId;
  const currentOriginalText = currentPage?.text || text;
  const currentText = editedTexts[currentPageId] ?? currentOriginalText;
  const hasTextChanged = currentText !== currentOriginalText;

  useEffect(() => {
    if (open && allPages) {
      const idx = allPages.findIndex(p => p.id === pageId);
      if (idx >= 0) setCurrentPageIndex(idx);
    }
  }, [open, pageId, allPages]);

  useEffect(() => {
    if (open && currentPageId && !(currentPageId in editedTexts)) {
      setEditedTexts(prev => ({ ...prev, [currentPageId]: currentOriginalText }));
    }
  }, [open, currentPageId, currentOriginalText]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(200, el.scrollHeight) + 'px';
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [currentText, currentPageIndex, autoResize]);

  useEffect(() => {
    if (open && storyId) {
      fetchEditCount(storyId);
      // Always re-validate credits from DB to prevent back-button exploit
      refetchEditCredits();
    }
  }, [open, storyId, fetchEditCount, refetchEditCredits]);

  const setCurrentText = (val: string) => {
    setEditedTexts(prev => ({ ...prev, [currentPageId]: val }));
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentPageIndex - 1 : currentPageIndex + 1;
    if (newIndex >= 0 && newIndex < pages.length) {
      setCurrentPageIndex(newIndex);
    }
  };

  const handleAddNikud = async () => {
    try {
      const nikudText = await addNikud(currentText);
      if (nikudText) {
        setCurrentText(nikudText);
        toast({ title: 'הניקוד נוסף בהצלחה' });
      } else {
        console.error('addNikud returned null, hook error:', nikudError);
        toast({ title: 'שגיאה בהוספת ניקוד', description: 'נסו שוב מאוחר יותר', variant: 'destructive' });
      }
    } catch (err) {
      console.error('handleAddNikud error:', err);
      toast({ title: 'שגיאה בהוספת ניקוד', variant: 'destructive' });
    }
  };

  const handleEnhanceText = async () => {
    if (!currentText.trim()) return;
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-text', {
        body: { text: currentText }
      });
      if (error) throw error;
      if (data?.enhancedText) {
        setCurrentText(data.enhancedText);
        toast({ title: 'הטקסט שודרג בהצלחה! ✨' });
      } else {
        throw new Error('לא התקבל טקסט משודרג');
      }
    } catch (error) {
      console.error('Error enhancing text:', error);
      toast({ title: 'שגיאה בשדרוג הטקסט', variant: 'destructive' });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Collect all pages that have been modified across the session
  const getModifiedPages = useCallback(() => {
    return pages.filter(p => {
      const edited = editedTexts[p.id];
      return edited !== undefined && edited !== p.text;
    });
  }, [pages, editedTexts]);

  const modifiedPages = getModifiedPages();
  const hasAnyChanges = modifiedPages.length > 0;

  const handleSave = async () => {
    if (!hasAnyChanges) return;
    
    if (!canEdit()) {
      toast({ title: 'נגמרו הקרדיטים 😔', description: 'שדרגו את החבילה כדי להמשיך לערוך סיפורים', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Consume only 1 credit for the entire batch
      const editResult = await performEdit();
      if (!editResult.success) {
        toast({ title: editResult.errorMessage || 'שגיאה בביצוע העריכה', variant: 'destructive' });
        return;
      }

      // Save all modified pages in one batch
      for (const modifiedPage of modifiedPages) {
        const newText = editedTexts[modifiedPage.id]!;
        const { error } = await supabase
          .from('story_pages')
          .update({ text: newText })
          .eq('id', modifiedPage.id);

        if (error) throw error;
        onUpdate(newText, modifiedPage.id);
      }

      setShowConfirmation(true);
      
      toast({ title: `${modifiedPages.length} עמודים עודכנו בהצלחה! ✅` });
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 2000);
    } catch (error) {
      console.error('Error updating pages:', error);
      toast({ title: 'שגיאה בעדכון העמודים', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getTextareaClassName = () => {
    const classes = ['resize-none', 'overflow-hidden', 'text-right', 'leading-[1.6]'];
    if (isBold) classes.push('font-bold');
    if (fontSize === 'large') classes.push('text-lg');
    return classes.join(' ');
  };

  const canGoPrev = currentPageIndex > 0;
  const canGoNext = currentPageIndex < pages.length - 1;
  const displayPageNumber = currentPage?.page_number ?? pageNumber;
  const displayTotalPages = pages.length || totalPages;
  const currentIllustration = currentPage?.illustration_url || (currentPageIndex === 0 ? illustrationUrl : undefined);
  const hasFreeEdits = freeEditsRemaining > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col" dir="rtl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>עריכת עמוד</span>
            <span className="text-xs font-normal">
              {hasFreeEdits ? (
                <span className="flex items-center gap-1 text-green-600">
                  <span><Gift className="w-3 h-3" /></span>
                  נותרו {freeEditsRemaining} עריכות חינם
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span><Coins className="w-3 h-3" /></span>
                  עלות: 1 קרדיט
                </span>
              )}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Page Navigation */}
        <div className="flex items-center justify-center gap-3 py-1 border-b border-border/50 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigate('prev')}
            disabled={!canGoPrev}
            className="w-8 h-8 rounded-full text-primary hover:bg-primary/10 disabled:opacity-20"
            aria-label="עמוד קודם"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground font-medium">
            עמוד {displayPageNumber} מתוך {displayTotalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigate('next')}
            disabled={!canGoNext}
            className="w-8 h-8 rounded-full text-primary hover:bg-primary/10 disabled:opacity-20"
            aria-label="עמוד הבא"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-3 py-3 overflow-y-auto flex-1 min-h-0">
          {/* Image Preview */}
          {currentIllustration && (
            <div className="flex justify-center">
              <SignedImage
                src={currentIllustration}
                storyId={storyId}
                alt={`איור עמוד ${displayPageNumber}`}
                className="w-24 h-16 object-cover rounded-lg border border-border shadow-sm"
              />
            </div>
          )}

          {/* Unified Toolbar - single row above textarea */}
          <div className="flex items-center gap-2 flex-wrap">
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

            <div className="h-5 w-px bg-border mx-1" />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNikud}
              disabled={isAddingNikud || !currentText.trim()}
              className="gap-1.5 text-sm h-8"
            >
              <span><Sparkles className="w-3.5 h-3.5" /></span>
              {isAddingNikud ? 'מוסיף...' : 'ניקוד'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEnhanceText}
              disabled={isEnhancing || !currentText.trim()}
              className="gap-1.5 text-sm h-8"
            >
              <span><Sparkles className="w-3.5 h-3.5" /></span>
              {isEnhancing ? 'משדרג...' : 'שדרג'}
            </Button>
          </div>

          {/* Text Area */}
          <Textarea
            id="pageText"
            ref={textareaRef}
            value={currentText}
            onChange={(e) => {
              setCurrentText(e.target.value);
              autoResize();
            }}
            placeholder="טקסט העמוד"
            className={getTextareaClassName()}
            style={{ minHeight: '200px' }}
          />

          {/* Edit credit info / Out of credits banner */}
          {!canEdit() ? (
            <div className="flex flex-col items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-3 text-center">
              <span className="flex items-center gap-1.5 text-sm font-bold text-destructive">
                <AlertCircle className="w-4 h-4" />
                נגמרו הקרדיטים
              </span>
              <p className="text-xs text-muted-foreground">
                אין לך עריכות חינם או קרדיטים זמינים. שדרגו את החבילה כדי להמשיך.
              </p>
              <a href="/upgrade" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                <Coins className="w-3.5 h-3.5" />
                שדרגו עכשיו →
              </a>
            </div>
          ) : (
            <div className="flex items-center text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <span className="flex items-center gap-1">
                <span><AlertCircle className="w-3 h-3" /></span>
                {hasFreeEdits
                  ? `נותרו לך ${freeEditsRemaining} עריכות בחינם בחבילה`
                  : 'העריכות בחינם נוצלו. כל עריכה עולה 1 קרדיט'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border pt-3 flex gap-2 flex-row-reverse">
          {showConfirmation ? (
            <Button disabled className="min-w-[120px] bg-green-500 hover:bg-green-500">
              <Check className="w-4 h-4 ml-1" />
              אושר!
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !hasAnyChanges}
              className="min-w-[120px] gap-2 bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'שומר...' : (
                <>
                  <Check className="w-4 h-4" />
                  {modifiedPages.length > 1 ? `שמור ${modifiedPages.length} עמודים` : 'שמור שינויים'}
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
  );
};

export default EditPageDialog;
