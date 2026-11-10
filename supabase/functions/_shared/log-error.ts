import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { isAiCreditError, reportAiCreditIssue } from "./ai-credit-alert.ts";

// Every story / illustration failure goes to error_logs. An "AI balance ran out"
// answer (402 / credit-limit 403) also raises the admin alert + email (max once an hour).
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
    const { error } = await supabase.from("error_logs").insert({
      error_type,
      error_message: error_message.substring(0, 2000),
      metadata,
      user_id: user_id || null,
    });
    if (error) console.error("Failed to log error to error_logs:", error.message);
  } catch (e) {
    console.error("Failed to log error to error_logs:", e);
  }
  if (isAiCreditError(metadata?.status, metadata?.body)) {
    await reportAiCreditIssue(error_type, Number(metadata.status), user_id ?? null);
  }
}
