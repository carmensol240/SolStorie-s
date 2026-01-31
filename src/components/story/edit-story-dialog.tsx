import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  childName: string;
  topic: string;
  onUpdate: () => void;
}

const EditStoryDialog = ({
  open,
  onOpenChange,
  storyId,
  childName,
  topic,
  onUpdate,
}: EditStoryDialogProps) => {
  const [name, setName] = useState(childName);
  const [storyTopic, setStoryTopic] = useState(topic);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('stories')
        .update({ child_name: name, topic: storyTopic })
        .eq('id', storyId);

      if (error) throw error;

      toast({ title: 'הסיפור עודכן בהצלחה' });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'שגיאה בעדכון הסיפור', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת סיפור</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="childName">שם הילד/ה</Label>
            <Input
              id="childName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם הילד/ה"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">נושא הסיפור</Label>
            <Textarea
              id="topic"
              value={storyTopic}
              onChange={(e) => setStoryTopic(e.target.value)}
              placeholder="נושא הסיפור"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'שומר...' : 'שמור'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditStoryDialog;
