import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  NEGATIVE_PROMPT_FULL,
  TOPIC_IMAGE_STYLE_SUFFIX,
  CAST_DESCRIPTIONS,
} from "../_shared/style-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOL_DESC = CAST_DESCRIPTIONS.sol;
const BEN_DESC = CAST_DESCRIPTIONS.ben;
const MIA_DESC = CAST_DESCRIPTIONS.mia;
const LEO_DESC = CAST_DESCRIPTIONS.leo;
const ZOE_DESC = CAST_DESCRIPTIONS.zoe;

const NEGATIVE = NEGATIVE_PROMPT_FULL;
const STYLE_SUFFIX = TOPIC_IMAGE_STYLE_SUFFIX;

const TOPIC_PROMPTS: Record<string, { filename: string; prompt: string }> = {
  "blood-test": {
    filename: "topic-blood-test.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is sitting on a doctor's office chair, smiling proudly and showing a shiny golden star sticker on the back of her hand after a blood test. The background is a cheerful, bright pediatric clinic with friendly medical posters and magical sparkles. Full body shot from waist up, character centered.`,
  },
  "helping-at-home": {
    filename: "topic-helping-at-home.png",
    prompt: `${STYLE_SUFFIX}. ${BEN_DESC} He is happily tidying up colorful toys into a toy box in a bright, cheerful children's room. He holds a stuffed teddy bear in one hand and is placing a toy car into the box with the other. The room has warm magical golden lighting, a cozy rug, and shelves with books. Full body shot, character centered.`,
  },
  "home-of-love": {
    filename: "topic-home-of-love.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is hugging her mother warmly. The mother has similar features with long dark wavy hair and a loving smile, wearing a blue top. Both have soft rounded cute faces. They are in a cozy, warm living room with soft magical golden light streaming through a window. Shot from waist up, characters centered.`,
  },
  "eating-with-cutlery": {
    filename: "topic-eating-with-cutlery.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She sits at a small colorful table, proudly and correctly holding a small shiny fork in one hand and a small spoon in the other over a stylized plate of colorful mini pasta pieces. She looks directly at the camera with a confident, proud, happy expression. Colorful detailed background with warm kitchen elements and magical sparkles. Full upper body from waist up, character centered. 1:1 square aspect ratio.`,
  },
  "playing-together": {
    filename: "topic-playing-together.png",
    prompt: `${STYLE_SUFFIX}. ${MIA_DESC} and ${LEO_DESC} They are sharing a colorful ball between them in a sunny magical garden, both smiling and laughing. The garden has green grass, glowing flowers, butterflies, and a bright blue sky with magical sparkles. Full body shot, both characters centered.`,
  },
  "find-a-friend": {
    filename: "topic-find-a-friend.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is standing in a bright kindergarten playground, extending her hand with a warm smile toward another child (${BEN_DESC}) who is sitting alone on a colorful bench looking shy. The playground has colorful slides, swings, and green grass. Magical sparkles around their connecting hands symbolizing new friendship. Full body shot, both characters visible.`,
  },
  "screen-time": {
    filename: "topic-screen-time.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is happily putting down a small tablet on a table and running outside toward a sunny garden where ${ZOE_DESC} and ${BEN_DESC} are waiting with a colorful ball. The garden has butterflies, flowers and warm sunshine. Sol looks excited and free. Full body shot, all characters visible.`,
  },
  "divorce": {
    filename: "topic-divorce.png",
    prompt: `${STYLE_SUFFIX}. FULL BODY HEAD TO TOE portrait of ${SOL_DESC} She is standing between two cozy colorful houses, holding a small red heart in both hands close to her chest, smiling gently. Each house has a warm glowing window. Above her head, a rainbow connects the two houses. The scene is warm and hopeful, not sad. Magical golden sparkles around. IMPORTANT: Show the ENTIRE character from head to feet, feet visible and grounded on the surface. Frame with generous margins from all edges — do NOT crop any body parts.`,
  },
  "sick-grandparent": {
    filename: "topic-sick-grandparent.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is sitting next to a kind elderly grandmother character (cartoon doll style with white hair, glasses, warm smile) on a cozy armchair, handing her a colorful hand-drawn picture with a big heart on it. The room is warm with soft golden light, a blanket, and flowers on the table. Both characters smiling warmly. Shot from waist up.`,
  },
  "making-mistakes": {
    filename: "topic-making-mistakes.png",
    prompt: `${STYLE_SUFFIX}. ${BEN_DESC} He is looking at a broken colorful vase on the floor with pieces scattered around, looking concerned but brave. ${SOL_DESC} She stands next to him with a reassuring hand on his shoulder, smiling encouragingly. A magical sparkle shows a small green sprout growing from one of the broken pieces, symbolizing growth from mistakes. Warm golden light, full body shot.`,
  },
  "crying-is-ok": {
    filename: "topic-crying-is-ok.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She has tears in her big sparkling eyes but is smiling through them. She is being hugged warmly by ${MIA_DESC}. Behind them, a beautiful rainbow appears through gentle rain. The scene shows that crying is okay and brings strength. Warm magical golden lighting, soft rain drops catching light. Shot from waist up, characters centered.`,
  },
  "cloud-kingdom": {
    filename: "topic-cloud-kingdom.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is standing on a magnificent fluffy white cloud shaped like a castle with cloud towers and cloud bridges. Small friendly cloud creatures with big cute eyes float around her. The sky is painted in sunset colors of pink, orange and purple. Sol's red cape is flowing in the wind. She looks amazed and adventurous. Full body shot, character centered.`,
  },
  "dragon-party": {
    filename: "topic-dragon-party.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} and ${LEO_DESC} They are at a magical party in a forest clearing with three small friendly baby dragons — one green, one purple, one orange — who are breathing rainbow-colored sparkly fire into the sky like fireworks. Colorful party decorations hang from the trees. All characters are laughing and dancing. Full body shot.`,
  },
  "strange-inventions": {
    filename: "topic-strange-inventions.png",
    prompt: `${STYLE_SUFFIX}. ${LEO_DESC} He is in a colorful inventor's workshop surrounded by wacky inventions: a flying shoe, a hat with spinning propellers, a robot dog. He is proudly holding up a glowing gadget he just built, with gears and sparkles flying around. The workshop is full of bright colors, tools, and magical light. Full body shot, character centered.`,
  },
  "space-journey": {
    filename: "topic-space-journey.png",
    prompt: `${STYLE_SUFFIX}. ${ZOE_DESC} She is floating in a colorful cartoon outer space wearing a cute round space helmet, surrounded by vibrant planets of different colors and sizes, shooting stars, and friendly smiling star characters. A cute small rocket ship is behind her. The space background is deep blue and purple with magical sparkles. Full body shot, character centered.`,
  },
  "friendship-courage": {
    filename: "topic-friendship-courage.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is in a kindergarten classroom, kneeling down next to a new child (${MIA_DESC}) who looks shy, offering her a colorful toy block with a warm smile. Other children play in the background. The classroom is bright and cheerful with drawings on the walls. Warm golden light streams through windows. Shot from waist up, both characters centered.`,
  },
  "accepting-differences": {
    filename: "topic-accepting-differences.png",
    prompt: `${STYLE_SUFFIX}. A group scene showing ${SOL_DESC}, ${BEN_DESC}, ${LEO_DESC}, and ${ZOE_DESC} all standing together in a circle holding hands in a bright sunny garden. Each character looks unique and different but they are all smiling at each other with joy. A magical golden glow surrounds the circle. Butterflies and flowers of many colors fill the background. Full body shot, all characters visible.`,
  },
  "how-body-works": {
    filename: "topic-how-body-works.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is standing in front of a large magical glowing diagram of a human body showing a sparkling heart, glowing lungs, and a colorful brain — all in cute cartoon style. She points at the heart with wonder and excitement. The background is a bright science room with colorful posters. Magical sparkles emanate from the diagram. Full body shot, character centered.`,
  },
  "waiting-in-line": {
    filename: "topic-waiting-in-line.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC}, ${BEN_DESC}, ${MIA_DESC}, and ${LEO_DESC} standing patiently in a line at a colorful ice cream stand in a sunny park. Sol is first in line, smiling patiently. Each character shows a different expression of patient waiting. The ice cream stand is bright and colorful with many flavors visible. Warm golden sunlight. Full body shot, all characters visible.`,
  },
  "politeness": {
    filename: "topic-politeness.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is politely saying "thank you" with a gentle bow to an elderly shopkeeper character (cartoon doll style) who is handing her a colorful lollipop. The shop is a warm colorful candy store with jars of sweets. Magical golden sparkles appear around the word shapes floating in the air. Sol's expression is respectful and happy. Shot from waist up, characters centered.`,
  },
  "emotion-regulation": {
    filename: "topic-emotion-regulation.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is sitting cross-legged on a soft cushion in a calm magical room, eyes closed, taking a deep breath. Around her, a stormy gray cloud is transforming into a beautiful rainbow as she breathes calmly. Soft golden particles float around her. The background transitions from gray to warm golden. The scene conveys peace and inner strength. Full body shot, character centered.`,
  },
  "patience": {
    filename: "topic-patience.png",
    prompt: `${STYLE_SUFFIX}. ${BEN_DESC} He is sitting in a cozy garden watching a tiny green sprout in a small pot, waiting patiently for it to grow. He has a gentle, patient smile. Around him, magical time particles show the plant slowly growing a little leaf. The garden has warm sunlight, flowers, and butterflies. The scene conveys peaceful patience. Full body shot, character centered.`,
  },
  "play-rules": {
    filename: "topic-play-rules.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC}, ${ZOE_DESC}, and ${LEO_DESC} are playing a colorful board game on the floor of a bright playroom. Sol is waiting for her turn patiently with a happy expression while Leo rolls a big colorful dice. Zoe claps cheerfully. The scene shows fair play and fun. Board game pieces, cards and magical sparkles on the floor. Full body shot, all characters visible.`,
  },
  "self-confidence": {
    filename: "topic-self-confidence.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} She is standing on a small magical stage with a spotlight, wearing her red cape flowing heroically. She holds a golden microphone and is singing or speaking confidently with a proud big smile. Small stars and sparkles surround her. The audience (${BEN_DESC}, ${MIA_DESC}, ${LEO_DESC}) cheer with big smiles below. The scene conveys confidence and self-belief. Full body shot.`,
  },
  "nature-secrets": {
    filename: "topic-nature-secrets.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} and ${MIA_DESC} are kneeling in a magical forest, looking at a tiny glowing mushroom and a cute ladybug with wonder. The forest is lush and green with sunbeams filtering through the trees. Tiny magical particles float in the air. A friendly squirrel watches from a branch above. The scene conveys curiosity and discovery. Both characters visible, shot from waist up.`,
  },
  "holidays-seasons": {
    filename: "topic-holidays-seasons.png",
    prompt: `${STYLE_SUFFIX}. ${SOL_DESC} and ${BEN_DESC} They stand in a magical circle where four seasons meet: one quarter has autumn leaves falling (orange and red), one has snow and a snowman, one has spring flowers blooming, and one has bright summer sunshine with a beach ball. Sol holds a colorful calendar. Both characters look amazed. Holiday decorations (candles, stars, flowers) float around them. Full body shot, both characters centered.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { topicIds } = await req.json() as { topicIds?: string[] };
    const idsToGenerate = topicIds || Object.keys(TOPIC_PROMPTS);

    const results: Record<string, { url: string; status: string }> = {};

    for (const topicId of idsToGenerate) {
      const config = TOPIC_PROMPTS[topicId];
      if (!config) {
        results[topicId] = { url: "", status: "unknown topic" };
        continue;
      }

      console.log(`Generating image for topic: ${topicId}`);

      try {
        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
              messages: [
                { role: "user", content: config.prompt },
              ],
              modalities: ["image", "text"],
            }),
          }
        );

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${topicId}:`, aiResponse.status, errText);
          results[topicId] = { url: "", status: `ai_error_${aiResponse.status}` };
          continue;
        }

        const aiData = await aiResponse.json();
        const imageData =
          aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData || !imageData.startsWith("data:image")) {
          console.error(`No image returned for ${topicId}`);
          results[topicId] = { url: "", status: "no_image_returned" };
          continue;
        }

        // Extract base64
        const base64 = imageData.split(",")[1];
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("topic-images")
          .upload(config.filename, bytes, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${topicId}:`, uploadError);
          results[topicId] = { url: "", status: "upload_error" };
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from("topic-images")
          .getPublicUrl(config.filename);

        results[topicId] = { url: publicUrl.publicUrl, status: "success" };
        console.log(`✅ ${topicId}: ${publicUrl.publicUrl}`);
      } catch (err) {
        console.error(`Error for ${topicId}:`, err);
        results[topicId] = { url: "", status: "error" };
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-topic-images error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
