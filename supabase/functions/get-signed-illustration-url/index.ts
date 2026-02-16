import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { paths, storyId, shareToken, publicView } = body;

    // Validate input
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return new Response(
        JSON.stringify({ error: "paths array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size to prevent abuse
    if (paths.length > 20) {
      return new Response(
        JSON.stringify({ error: "Maximum 20 paths per request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Use service role for generating signed URLs
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check authorization
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let isAuthorized = false;

    // Case 1: Authenticated user
    if (authHeader?.startsWith("Bearer ")) {
      // Extract token and validate directly using service role client
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
        
        // Check if user owns the story
        if (storyId) {
          const { data: story } = await supabaseAdmin
            .from("stories")
            .select("user_id")
            .eq("id", storyId)
            .maybeSingle();
          
          if (story?.user_id === userId) {
            isAuthorized = true;
          }
        } else if (paths.length > 0) {
          // If no storyId provided, extract from first path and check ownership
          // Path format: uuid/filename.png
          const firstPathParts = paths[0].split("/");
          if (firstPathParts.length >= 2) {
            const extractedStoryId = firstPathParts[0];
            
            // Validate UUID format
            if (extractedStoryId.match(/^[a-f0-9-]{36}$/i)) {
              const { data: story } = await supabaseAdmin
                .from("stories")
                .select("user_id")
                .eq("id", extractedStoryId)
                .maybeSingle();
              
              if (story?.user_id === userId) {
                isAuthorized = true;
                console.log(`Authorized user ${userId} for story ${extractedStoryId} via path extraction`);
              }
            }
          }
        }
      }
    }

    // Case 2: Public shared book access via shareToken
    if (!isAuthorized && shareToken && storyId) {
      const { data: publicBook } = await supabaseAdmin
        .rpc("get_public_book", { p_share_token: shareToken });
      
      if (publicBook && publicBook.length > 0) {
        const book = publicBook[0];
        if (book.story_id === storyId && book.is_public) {
          isAuthorized = true;
        }
      }
    }

    // Case 3: Check if story has a public digital book (for shared viewing)
    if (!isAuthorized && storyId) {
      const { data: publicDigitalBook } = await supabaseAdmin
        .from("digital_books")
        .select("id")
        .eq("story_id", storyId)
        .eq("is_public", true)
        .maybeSingle();
      
      if (publicDigitalBook) {
        isAuthorized = true;
      }
    }

    // Case 4: Public story view (for /s/:storyId route sharing)
    if (!isAuthorized && storyId && publicView === true) {
      // Verify story exists via the public RPC function
      const { data: publicStory } = await supabaseAdmin
        .rpc("get_public_story", { p_story_id: storyId });
      
      if (publicStory) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access to illustrations" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URLs for all paths
    const signedUrls: Record<string, string> = {};
    
    for (const path of paths) {
      // Validate path format to prevent directory traversal
      // More flexible regex: accepts UUIDs with various filename patterns (page-X.png, cover.png, etc.)
      if (typeof path !== "string" || path.includes("..")) {
        console.log(`Invalid path (contains ..): ${path}`);
        continue;
      }
      
      // Accept paths like: uuid/page-1.png, uuid/cover.png, uuid/filename.png
      if (!path.match(/^[a-f0-9-]+\/[^\/]+\.(png|jpg|jpeg|webp)$/i)) {
        console.log(`Invalid path format: ${path}`);
        continue;
      }

      // If we have a storyId, validate that the path belongs to that story
      if (storyId) {
        const pathStoryId = path.split("/")[0];
        if (pathStoryId !== storyId) {
          console.log(`Path story ID mismatch: ${pathStoryId} vs ${storyId}`);
          continue;
        }
      }

      const { data, error } = await supabaseAdmin.storage
        .from("story-illustrations")
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        console.error(`Error creating signed URL for ${path}:`, error);
        continue;
      }

      if (data?.signedUrl) {
        signedUrls[path] = data.signedUrl;
        console.log(`Generated signed URL for: ${path}`);
      }
    }

    return new Response(
      JSON.stringify({ signedUrls }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in get-signed-illustration-url:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בטעינת התמונות" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
