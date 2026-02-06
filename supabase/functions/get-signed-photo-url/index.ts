import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge function to generate signed URLs for child photos.
 * This ensures photos are only accessible to authenticated users with proper authorization.
 * 
 * Request body:
 * - filePath: The path to the file in the child-photos bucket
 * - expiresIn: Optional expiration time in seconds (default: 3600 = 1 hour)
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization header exists
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { filePath, expiresIn = 3600 } = await req.json();

    if (!filePath || typeof filePath !== 'string') {
      return new Response(
        JSON.stringify({ error: 'filePath is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate expiresIn (max 7 days = 604800 seconds)
    const validExpiresIn = Math.min(Math.max(60, expiresIn), 604800);

    // Validate filePath format to prevent path traversal
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid file path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's token to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the file path belongs to this user (format: {user_id}/filename or {user_id}/{child_id}/filename)
    const pathParts = filePath.split('/');
    const fileOwnerId = pathParts[0];
    
    if (fileOwnerId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this file' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to generate signed URL
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await serviceClient.storage
      .from('child-photos')
      .createSignedUrl(filePath, validExpiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: data.signedUrl, expiresIn: validExpiresIn }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
