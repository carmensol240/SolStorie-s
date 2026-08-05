import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    const validEventTypes = [
      // legacy / reading events
      'story_started', 'story_completed', 'page_viewed', 'feature_used', 'drawing_used',
      'coloring_page_generated', 'share_screen_view', 'share_clicked',
      // funnel events
      'signup_completed',
      'create_story_opened',
      'child_info_completed',
      'photo_uploaded',
      'topic_selected',
      'generation_started',
      'generation_failed',
      'story_created',
      'paywall_view',
      'checkout_started',
      'purchase_completed',
      'purchase_failed',
    ]
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

    // Resolve the acting user from the Authorization header (never trust the body)
    let resolvedUserId: string | null = null;
    try {
      const authHeader = req.headers.get('Authorization') ?? '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
      if (token && token !== anonKey) {
        const { data: userData } = await supabase.auth.getUser(token);
        resolvedUserId = userData?.user?.id ?? null;
      }
    } catch (_e) {
      resolvedUserId = null;
    }

    const { error } = await supabase.from('analytics_events').insert({
      device_id,
      event_type,
      user_id: resolvedUserId,
      story_id: story_id || null,
      page_number: page_number ?? null,
      time_spent_seconds: time_spent_seconds ?? null,
      metadata: validatedMetadata,
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

// Helper function to sanitize metadata values
function sanitizeMetadata(obj: Record<string, unknown>, depth = 0): Record<string, unknown> {
  // Prevent deep nesting attacks
  if (depth > 3) {
    return {};
  }
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Only allow alphanumeric keys with underscores
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      continue;
    }
    
    // Limit key length
    if (key.length > 50) {
      continue;
    }
    
    if (typeof value === 'string') {
      // Limit string length and sanitize
      sanitized[key] = value.slice(0, 500).replace(/[<>]/g, '');
    } else if (typeof value === 'number' && isFinite(value)) {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null) {
      sanitized[key] = null;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>, depth + 1);
    }
    // Arrays and other types are ignored for security
  }
  
  return sanitized;
}