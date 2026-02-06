import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Maximum metadata size in bytes (10KB)
const MAX_METADATA_SIZE = 10 * 1024;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { device_id, event_type, story_id, page_number, time_spent_seconds, metadata } = await req.json()

    if (!device_id || !event_type) {
      throw new Error('device_id and event_type are required')
    }

    // Rate limit by device_id (100 requests per minute)
    const rateLimit = checkRateLimit(device_id, "track-event", RATE_LIMITS.trackEvent);
    if (!rateLimit.allowed) {
      console.log(`Track event rate limit exceeded for device: ${device_id.substring(0, 8)}...`);
      return rateLimitResponse(rateLimit, corsHeaders, "Too many requests");
    }

    // Validate event type
    const validEventTypes = ['story_started', 'story_completed', 'page_viewed', 'feature_used', 'drawing_used']
    if (!validEventTypes.includes(event_type)) {
      throw new Error('Invalid event_type')
    }

    // Validate metadata size and structure
    let validatedMetadata = null;
    if (metadata !== undefined && metadata !== null) {
      const metadataStr = JSON.stringify(metadata);
      if (metadataStr.length > MAX_METADATA_SIZE) {
        throw new Error(`Metadata too large (max ${MAX_METADATA_SIZE / 1024}KB)`);
      }
      
      // Only allow object type metadata
      if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        throw new Error('Metadata must be an object');
      }
      
      // Sanitize string values to prevent XSS
      validatedMetadata = sanitizeMetadata(metadata);
    }

    console.log(`Tracking event: ${event_type} for device: ${device_id.substring(0, 8)}...`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabase.from('analytics_events').insert({
      device_id,
      event_type,
      story_id: story_id || null,
      page_number: page_number ?? null,
      time_spent_seconds: time_spent_seconds ?? null,
      metadata: metadata || null,
    })

    if (error) {
      console.error('Failed to insert analytics event:', error)
      throw error
    }

    console.log(`Successfully tracked ${event_type} event`)

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Analytics tracking error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})