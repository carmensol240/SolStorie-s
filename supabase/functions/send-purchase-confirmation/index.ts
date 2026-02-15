import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PurchaseConfirmationRequest {
  email: string;
  packageName: string;
  credits: number;
  amount: number;
  transactionDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, packageName, credits, amount, transactionDate }: PurchaseConfirmationRequest = await req.json();

    // Validate required fields
    if (!email || !packageName || !credits || !amount) {
      throw new Error("Missing required fields");
    }

    // Mask email in logs to protect PII
    const maskEmail = (e: string) => e.substring(0, 3) + '***@' + e.split('@')[1];
    console.log(`Sending purchase confirmation to ${maskEmail(email)} for ${credits} credits`);

    const emailResponse = await resend.emails.send({
      from: "SolStorie's™ <hello@storytime.org.il>",
      to: [email],
      subject: `✅ אישור רכישה - ${credits} קרדיטים`,
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
                <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">תודה על הרכישה!</h1>
              </div>
              
              <!-- Greeting -->
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                שלום,<br/>
                הרכישה שלך בוצעה בהצלחה! הנה פרטי העסקה:
              </p>
              
              <!-- Transaction Details -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #78350f; font-weight: bold;">חבילה:</td>
                    <td style="padding: 8px 0; color: #92400e; text-align: left;">${packageName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #78350f; font-weight: bold;">קרדיטים:</td>
                    <td style="padding: 8px 0; color: #92400e; text-align: left;">${credits} סיפורים</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #78350f; font-weight: bold;">סכום:</td>
                    <td style="padding: 8px 0; color: #92400e; text-align: left;">₪${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #78350f; font-weight: bold;">תאריך:</td>
                    <td style="padding: 8px 0; color: #92400e; text-align: left;">${transactionDate}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Success Message -->
              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="color: #065f46; font-size: 16px; margin: 0;">
                  ✨ הקרדיטים כבר נוספו לחשבון שלך!<br/>
                  אפשר להתחיל ליצור סיפורים חדשים 📚
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://www.storytime.org.il/create" 
                   style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                  צרו סיפור חדש עכשיו →
                </a>
              </div>
              
              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                  בברכה,<br/>
                  צוות SolStorie's™ 🐘
                </p>
              </div>
              
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Only log success status, not full response which may contain email
    console.log("Purchase confirmation email sent successfully, id:", emailResponse?.id || "unknown");

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending purchase confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
