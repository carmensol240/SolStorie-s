import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export async function logError(
  error_type: string,
  error_message: string,
  metadata: Record<string, unknown> = {},
  user_id?: string
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return;

    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from("error_logs").insert({
      error_type,
      error_message: error_message.substring(0, 2000),
      metadata,
      user_id: user_id || null,
    });
  } catch (e) {
    console.error("Failed to log error to error_logs:", e);
  }
}
