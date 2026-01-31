import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { device_id, action, settings } = await req.json();

    if (!device_id || typeof device_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'device_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate device_id format (should be device_ + UUID)
    if (!device_id.startsWith('device_') || device_id.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid device_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // GET - Fetch settings for this device
    if (!action || action === 'get') {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('device_id', device_id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CREATE - Create new settings for a device
    if (action === 'create') {
      // Check if settings already exist
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('device_id', device_id)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Settings already exist for this device' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          device_id,
          avatar_emoji: settings?.avatar_emoji || '🦁',
          nickname: settings?.nickname || 'חבר קטן',
          silent_mode: settings?.silent_mode ?? false,
          sound_effects_enabled: settings?.sound_effects_enabled ?? true,
          screen_time_limit: settings?.screen_time_limit ?? 60,
          age_filter_min: settings?.age_filter_min ?? 0,
          age_filter_max: settings?.age_filter_max ?? 10,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating settings:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // UPDATE - Update existing settings
    if (action === 'update') {
      if (!settings || typeof settings !== 'object') {
        return new Response(
          JSON.stringify({ error: 'settings object is required for update' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...settings,
          last_active: new Date().toISOString(),
        })
        .eq('device_id', device_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating settings:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
