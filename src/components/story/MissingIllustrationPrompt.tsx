import { useState } from "react";
import { ImageOff, Loader2, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MissingIllustrationPromptProps {
  pageId: string;
  isRetrying: boolean;
  isGenerating: boolean; // still in generation phase
  showPromptInput: boolean;
  customPromptText: string;
  onTogglePrompt: () => void;
  onPromptChange: (text: string) => void;
  onSubmit: (pageId: string, customPrompt?: string) => void;
  aspectClass?: string;
}

export const MissingIllustrationPrompt = ({
  pageId,
  isRetrying,
  isGenerating,
  showPromptInput,
  customPromptText,
  onTogglePrompt,
  onPromptChange,
  onSubmit,
  aspectClass = "aspect-[4/5]",
}: MissingIllustrationPromptProps) => {
  if (isGenerating) {
    return (
      <div className={cn(
        "rounded-2xl border-4 border-dashed border-[#D4A574]/50 flex flex-col items-center justify-center bg-[#F5E6D3]/50 gap-3",
        aspectClass
      )}>
        <div className="text-center text-[#A08060]">
          <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin opacity-60" />
          <p className="text-sm">טוען איור...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl border-4 border-dashed border-[#D4A574]/50 flex flex-col items-center justify-center bg-[#F5E6D3]/50 gap-3 p-4",
      aspectClass
    )}>
      {isRetrying ? (
        <div className="text-center text-[#A08060]">
          <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin text-purple-500" />
          <p className="text-sm font-medium text-purple-600">מייצר את האיור...</p>
          <p className="text-xs text-purple-400 mt-1">זה יכול לקחת כמה שניות</p>
        </div>
      ) : showPromptInput ? (
        <div className="w-full max-w-xs space-y-3 text-center" dir="rtl">
          <p className="text-sm font-medium text-[#8B7355]">
            <Sparkles className="w-4 h-4 inline ml-1 text-purple-500" />
            תארו מה תרצו לראות:
          </p>
          <Textarea
            value={customPromptText}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="למשל: סול מחבקת דובי גדול בחדרה..."
            className="text-sm min-h-[60px] max-h-[80px] resize-none text-right border-[#D4A574] focus:border-purple-400 bg-white/80"
            dir="rtl"
          />
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={() => onSubmit(pageId, customPromptText || undefined)}
              disabled={!customPromptText.trim()}
              className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white text-xs gap-1"
            >
              <Send className="w-3 h-3" />
              צרו איור
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onTogglePrompt}
              className="text-xs text-[#8B7355]"
            >
              ביטול
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center text-[#A08060]">
            <ImageOff className="w-10 h-10 mx-auto mb-1 opacity-40" />
            <p className="text-sm font-medium">ה-AI זקוק לעזרה 🎨</p>
            <p className="text-xs opacity-70 mt-0.5">תארו לו מה לצייר</p>
          </div>
          <Button
            size="sm"
            onClick={onTogglePrompt}
            className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            ייצרו תמונה עבורי
          </Button>
        </>
      )}
    </div>
  );
};
