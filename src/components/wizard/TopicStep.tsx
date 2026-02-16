import { Textarea } from "@/components/ui/textarea";
import { StoryFormData } from "@/pages/CreateStory";

interface TopicStepProps {
  formData: StoryFormData;
  updateFormData: (updates: Partial<StoryFormData>) => void;
}

const TopicStep = ({ formData, updateFormData }: TopicStepProps) => {
  const handleChange = (value: string) => {
    updateFormData({
      customTopic: value,
      topic: value.trim() ? "custom" : "",
      adventureLogic: undefined,
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent text-center">
        על מה נכתוב היום?
      </h1>

      <Textarea
        className="w-full min-h-[150px] text-sm resize-none"
        rows={6}
        placeholder="למשל: סול לא רצתה לצחצח שיניים הבוקר, או שקרה משהו מעניין בגן שתרצו לעבד בסיפור..."
        value={formData.customTopic}
        onChange={(e) => handleChange(e.target.value)}
        dir="rtl"
      />
    </div>
  );
};

export default TopicStep;
