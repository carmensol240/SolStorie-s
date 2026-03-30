import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FeedbackNotificationRequest {
  storyName: string;
  childName: string;
  rating: number;
  message: string;
  userEmail: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyName, childName, rating, message }: FeedbackNotificationRequest = await req.json();

    const stars = "⭐".repeat(rating || 0);
    const safeStoryName = escapeHtml(storyName || "לא צוין");
    const safeChildName = escapeHtml(childName || "לא צוין");
    const safeMessage = message ? escapeHtml(message) : "";

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="background:white;border-radius:16px;padding:40px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:40px;margin-bottom:12px;">📝</div>
              <h1 style="color:#7c3aed;font-size:24px;margin:0;">פידבק חדש על סיפור</h1>
            </div>
            <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);padding:20px;border-radius:12px;margin-bottom:20px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#78350f;font-weight:bold;">שם הילד/ה:</td>
                  <td style="padding:8px 0;color:#92400e;text-align:left;">${safeChildName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#78350f;font-weight:bold;">נושא הסיפור:</td>
                  <td style="padding:8px 0;color:#92400e;text-align:left;">${safeStoryName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#78350f;font-weight:bold;">דירוג:</td>
                  <td style="padding:8px 0;color:#92400e;text-align:left;">${stars} (${rating}/5)</td>
                </tr>
              </table>
            </div>
            ${safeMessage ? `
            <div style="background:#faf5ff;border-right:4px solid #7c3aed;padding:16px;border-radius:8px;margin-bottom:20px;">
              <p style="color:#5b21b6;font-weight:bold;margin:0 0 8px;">הודעה:</p>
              <p style="color:#374151;margin:0;white-space:pre-wrap;">${safeMessage}</p>
            </div>` : ""}
            <div style="border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;">
              <p style="color:#9ca3af;font-size:13px;margin:0;">SolStorie's™ 🐘</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SolStorie's™ <noreply@soulstory.co.il>",
        to: ["souldesign06@gmail.com"],
        subject: `📝 פידבק חדש - ${stars} - ${childName || "אורח"}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error("Failed to send feedback notification email");
    }

    const emailResponse = await resendResponse.json();
    console.log("Feedback notification sent, id:", emailResponse?.id || "unknown");

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending feedback notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
