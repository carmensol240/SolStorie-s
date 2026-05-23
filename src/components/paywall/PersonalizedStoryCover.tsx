import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";

interface PersonalizedStoryCoverProps {
  storyId: string;
}

/**
 * Personalized story cover for the paywall popup.
 * Renders the real cover_url of the current story with the child's name
 * as an overlay. ~200px tall, centered.
 */
const PersonalizedStoryCover = ({ storyId }: PersonalizedStoryCoverProps) => {
  const [cover, setCover] = useState<{ url: string | null; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCover = async () => {
      try {
        // Try direct UUID lookup first, then by slug via the public RPC.
        let url: string | null = null;
        let name = "";

        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storyId);

        if (isUuid) {
          const { data } = await supabase
            .from("stories")
            .select("cover_url, child_name")
            .eq("id", storyId)
            .maybeSingle();
          if (data) {
            url = data.cover_url ?? null;
            name = data.child_name ?? "";
          }
        } else {
          const { data } = await supabase.rpc("get_public_story", {
            p_story_id: storyId,
          });
          if (data && typeof data === "object") {
            const d = data as any;
            url = d.cover_url ?? null;
            name = d.child_name ?? "";
          }
        }

        if (!cancelled) {
          setCover({ url: getPublicIllustrationUrl(url), name });
        }
      } catch (e) {
        console.error("[PersonalizedStoryCover] fetch error:", e);
        if (!cancelled) setCover({ url: null, name: "" });
      }
    };
    fetchCover();
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  if (!cover?.url) {
    return null;
  }

  return (
    <div className="flex justify-center mb-4">
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20"
        style={{ height: "200px", aspectRatio: "3 / 4" }}
      >
        <img
          src={cover.url}
          alt={cover.name ? `הספר של ${cover.name}` : "ספר הסיפור שלך"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Bottom gradient + name */}
        {cover.name && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-2">
            <p className="text-white text-sm font-black text-center drop-shadow-lg">
              {cover.name}
            </p>
          </div>
        )}
        {/* Subtle book spine highlight */}
        <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default PersonalizedStoryCover;