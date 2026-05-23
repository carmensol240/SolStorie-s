import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicIllustrationUrl } from "@/lib/illustration-url";
import "@/components/upgrade/flipping-book.css";

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
    <div className="flex justify-center my-1">
      <div className="fba-scene">
        <div className="fba-spine">
          <span className="fba-spine-text">
            {cover.name ? `${cover.name} · ` : ""}SolStorie&apos;s™
          </span>
        </div>
        <div className="fba-book">
          <img
            src={cover.url}
            alt={cover.name ? `הספר של ${cover.name}` : "ספר הסיפור שלך"}
            className="fba-cover-img"
            loading="eager"
          />
          <div className="fba-badge">✨ SolStorie&apos;s™</div>
          {cover.name && (
            <div className="fba-overlay">
              <div
                className="font-bold text-center"
                style={{
                  color: "#fbbf24",
                  fontSize: "1.05rem",
                  textShadow: "0 2px 6px rgba(0,0,0,0.55)",
                }}
              >
                {cover.name}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedStoryCover;