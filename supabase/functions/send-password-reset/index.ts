import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    // Rate limit by email address (3 requests per hour per email)
    const emailRateLimit = checkRateLimit(email.toLowerCase(), "password-reset-email", RATE_LIMITS.passwordReset);
    if (!emailRateLimit.allowed) {
      console.log(`Rate limit exceeded for email: ${email.substring(0, 3)}***`);
      return rateLimitResponse(emailRateLimit, corsHeaders, "יותר מדי בקשות לאיפוס סיסמה. נסה שוב מאוחר יותר.");
    }

    // Also rate limit by IP (3 requests per hour per IP)
    const clientIP = getClientIP(req);
    const ipRateLimit = checkRateLimit(clientIP, "password-reset-ip", RATE_LIMITS.passwordReset);
    if (!ipRateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return rateLimitResponse(ipRateLimit, corsHeaders, "יותר מדי בקשות לאיפוס סיסמה. נסה שוב מאוחר יותר.");
    }

    // Validate required fields
    if (!email || !redirectUrl) {
      throw new Error("Missing required fields: email and redirectUrl");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Mask email in logs to protect PII
    const maskEmail = (e: string) => e.substring(0, 3) + '***@' + e.split('@')[1];
    console.log(`Processing password reset for: ${maskEmail(email)}`);

    // Create Supabase admin client to generate password reset link
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate password reset link using Supabase Admin API
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      // Don't reveal if user exists or not for security
      // Still return success to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email will be sent" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resetLink = data?.properties?.action_link;

    if (!resetLink) {
      throw new Error("Failed to generate reset link");
    }

    console.log(`Sending password reset email to: ${maskEmail(email)}`);

    // Send branded password reset email via Resend
    const emailResponse = await resend.emails.send({
      from: "Story Time <onboarding@resend.dev>",
      to: [email],
      subject: "🔐 איפוס סיסמה - סטורי טיים",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
                <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">איפוס סיסמה</h1>
              </div>
              
              <!-- Message -->
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                קיבלנו בקשה לאיפוס הסיסמה שלך.<br/>
                לחצו על הכפתור למטה כדי לבחור סיסמה חדשה:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 18px;">
                  אפס סיסמה
                </a>
              </div>
              
              <!-- Security Note -->
              <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
                  ⏰ הקישור תקף לשעה אחת בלבד
                </p>
              </div>
              
              <!-- Alternative Link -->
              <p style="color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center; margin-top: 20px;">
                אם הכפתור לא עובד, העתיקו את הקישור הזה לדפדפן:
                <br/>
                <a href="${resetLink}" style="color: #7c3aed; word-break: break-all;">${resetLink}</a>
              </p>
              
              <!-- Ignore Note -->
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                אם לא ביקשתם לאפס את הסיסמה, התעלמו מהמייל הזה.
              </p>
              
              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
                <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                  בברכה,<br/>
                  צוות סטורי טיים 🐘
                </p>
              </div>
              
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully");
    // Only log success status, not full response which may contain email
    console.log("Resend API response status:", emailResponse?.id ? "success" : "unknown");

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    
    // Always return success to prevent email enumeration attacks
    return new Response(
      JSON.stringify({ success: true, message: "If an account exists, a reset email will be sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
