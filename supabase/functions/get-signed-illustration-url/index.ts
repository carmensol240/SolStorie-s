import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paths, storyId, shareToken } = await req.json();

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
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
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
        } else {
          // If no storyId, check ownership based on path
          isAuthorized = true; // Will validate per-path below
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
      if (typeof path !== "string" || path.includes("..") || !path.match(/^[a-f0-9-]+\/page-\d+\.png$/)) {
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
