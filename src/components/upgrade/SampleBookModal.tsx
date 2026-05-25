import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_STORY } from "@/data/demo-story";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";

interface SampleBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BookContent {
  title: string;
  text: string;
  illustrationUrl: string | null;
  isUserStory: boolean;
}

const FALLBACK: BookContent = {
  title: DEMO_STORY.title,
  text: DEMO_STORY.pages[0].text,
  illustrationUrl: DEMO_STORY.pages[0].illustrationUrl,
  isUserStory: false,
};

const SampleBookModal = ({ open, onOpenChange }: SampleBookModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState<BookContent>(FALLBACK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!user?.id) {
      setContent(FALLBACK);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: story } = await supabase
          .from("stories")
          .select("id, topic, child_name, cover_url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!story) {
          if (!cancelled) setContent(FALLBACK);
          return;
        }

        const { data: pages } = await supabase
          .from("story_pages")
          .select("text, illustration_url, page_number")
          .eq("story_id", story.id)
          .order("page_number", { ascending: true })
          .limit(1);

        const firstPage = pages?.[0];
        const illustration =
          getPublicIllustrationUrl(firstPage?.illustration_url ?? null) ||
          story.cover_url ||
          FALLBACK.illustrationUrl;

        if (!cancelled) {
          setContent({
            title: story.topic || story.child_name || FALLBACK.title,
            text: firstPage?.text || FALLBACK.text,
            illustrationUrl: illustration,
            isUserStory: true,
          });
        }
      } catch {
        if (!cancelled) setContent(FALLBACK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 max-w-sm overflow-hidden bg-transparent shadow-none"
        dir="rtl"
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(to bottom, #1a0f3a, #2d1a6e)",
            boxShadow:
              "0 20px 60px rgba(45,26,110,0.5), 0 0 0 4px hsl(270 60% 40%), 0 0 0 8px rgba(108,92,231,0.4)",
          }}
        >
          <div className="px-5 pt-5 pb-2 text-center">
            <p className="text-xs text-purple-200/70 font-semibold mb-1">
              {content.isUserStory ? "הסיפור שלך 💛" : "סיפור לדוגמא 📖"}
            </p>
            <h3 className="text-white font-black text-base leading-tight line-clamp-1">
              {content.title}
            </h3>
          </div>

          {/* Book mockup */}
          <div className="px-4 pb-4">
            <div
              className="relative rounded-xl overflow-hidden border border-purple-400/30"
              style={{ aspectRatio: "3/4" }}
            >
              {/* Illustration half */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-br from-[#FFFBF5] via-[#F5E6D3] to-[#FAF3E8]">
                {content.illustrationUrl && !loading && (
                  <img
                    src={content.illustrationUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              {/* Text half */}
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 p-4 flex items-center"
                style={{ background: "linear-gradient(135deg, #2d1a6e, #1a0f3a)" }}
              >
                <p
                  className="text-purple-100 text-right text-sm leading-relaxed font-medium line-clamp-6"
                  dir="rtl"
                >
                  {content.text}
                </p>
              </div>
              {/* Spine shadow */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="px-5 pb-5 text-center">
            <p className="text-purple-200/60 text-xs">
              {content.isUserStory
                ? "כך ייראה הסיפור שלך כספר מודפס ✨"
                : "צרו את הסיפור הראשון שלכם וקבלו ספר אישי ✨"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SampleBookModal;