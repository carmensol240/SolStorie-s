import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const subjectLabels: Record<string, string> = {
  general: "שאלה כללית",
  technical: "בעיה טכנית",
  suggestion: "הצעה לשיפור",
  delete_account: "בקשה למחיקת חשבון",
  other: "אחר",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "כל השדות הם חובה" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "כתובת אימייל לא תקינה" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate field lengths
    if (name.length > 100 || email.length > 255 || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "אחד השדות ארוך מדי" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subjectLabel = subjectLabels[subject] || subject;

    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
          📬 פנייה חדשה מטופס צור קשר
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; background: #f8f9fa; font-weight: bold; width: 120px;">שם השולח:</td>
            <td style="padding: 10px; background: #f8f9fa;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">אימייל:</td>
            <td style="padding: 10px;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">נושא:</td>
            <td style="padding: 10px; background: #f8f9fa;">${subjectLabel}</td>
          </tr>
        </table>
        
        <div style="background: #faf5ff; border-right: 4px solid #7c3aed; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #5b21b6;">תוכן ההודעה:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          הודעה זו נשלחה מטופס צור קשר באפליקציית סטורי טיים.
          <br>
          להשיב לפנייה, לחץ על "השב" והמייל יישלח ישירות לשולח.
        </p>
      </div>
    `;

    // Send email using Resend API directly
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "סטורי טיים <noreply@storytime.org.il>",
        to: ["souldesign06@gmail.com"],
        reply_to: email,
        subject: `פנייה חדשה - ${subjectLabel}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error("Failed to send email");
    }

    const emailResponse = await resendResponse.json();
    console.log("Contact form email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "ההודעה נשלחה בהצלחה" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-form function:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בשליחת ההודעה. נסה שוב מאוחר יותר." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
