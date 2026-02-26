import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const { email, displayName } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userName = displayName || email.split("@")[0];
    const appUrl = "https://wwwstorytime.lovable.app";

    const htmlBody = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: 'Heebo', 'Segoe UI', Arial, sans-serif;
      direction: rtl;
      text-align: right;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: linear-gradient(135deg, #FAF3E8 0%, #FFF5EE 50%, #F0E6FF 100%);
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #7C3AED, #EC4899, #F97316);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 900;
      margin: 0 0 4px 0;
      letter-spacing: 1px;
    }
    .header p {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
      margin: 0;
    }
    .body-content {
      padding: 32px 28px;
      color: #3D2E1F;
      font-size: 15px;
      line-height: 1.8;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #5B3E96;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 17px;
      font-weight: 700;
      color: #7C3AED;
      margin: 24px 0 12px 0;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .feature-list li {
      padding: 10px 0;
      border-bottom: 1px solid rgba(124, 58, 237, 0.1);
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .feature-list li:last-child {
      border-bottom: none;
    }
    .feature-icon {
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .feature-text strong {
      color: #5B3E96;
    }
    .tip-box {
      background: rgba(124, 58, 237, 0.08);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 24px 0;
      border-right: 4px solid #7C3AED;
    }
    .tip-box strong {
      color: #7C3AED;
    }
    .cta-wrapper {
      text-align: center;
      padding: 28px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #F59E0B, #F97316, #EC4899);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 18px;
      font-weight: 900;
      padding: 16px 48px;
      border-radius: 50px;
      box-shadow: 0 8px 25px rgba(236, 72, 153, 0.35);
    }
    .signature {
      text-align: center;
      padding: 8px 0 4px 0;
      color: #7C3AED;
      font-weight: 700;
      font-size: 15px;
    }
    .ps-note {
      background: rgba(251, 191, 36, 0.1);
      border-radius: 10px;
      padding: 12px 16px;
      margin-top: 20px;
      font-size: 13px;
      color: #92400E;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 11px;
      color: #9CA3AF;
    }
  </style>
</head>
<body>
  <div style="padding: 20px; background-color: #ffffff;">
    <div class="container">
      <div class="header">
        <h1>SolStorie's™</h1>
        <p>✨ הקסם מתחיל עכשיו ✨</p>
      </div>

      <div class="body-content">
        <div class="greeting">היי ${userName},</div>
        <p>איזה כיף שהצטרפת אלינו! 🎉</p>
        <p>
          אנחנו ב-SolStories מאמינים שלכל ילד וילדה מגיע להיות הגיבורים של הסיפור שלהם.
          האפליקציה נולדה מתוך רצון ליצור רגעים של קסם, חיבור והשראה בין הורים לילדים,
          בעזרת טכנולוגיה חכמה שמותאמת אישית לכל אחד.
        </p>

        <div class="section-title">🌟 מה מחכה לכם באפליקציה?</div>
        <ul class="feature-list">
          <li>
            <span class="feature-icon">🪄</span>
            <span class="feature-text"><strong>יצירת סיפורים אישיים:</strong> תוכלו להפוך את הילדים שלכם לגיבורי על, נסיכות או מגלי ארצות בלחיצת כפתור.</span>
          </li>
          <li>
            <span class="feature-icon">📚</span>
            <span class="feature-text"><strong>התאמה לגיל:</strong> הסיפורים שלנו נכתבים בדיוק לפי שכבת הגיל של הילד/ה (מסיפורים קצרים לקטנטנים ועד לעלילות מורכבות יותר ללומדי קריאה).</span>
          </li>
          <li>
            <span class="feature-icon">💜</span>
            <span class="feature-text"><strong>ספריית זיכרונות:</strong> כל סיפור שתיצרו יישמר עבורכם בספרייה האישית.</span>
          </li>
        </ul>

        <div class="tip-box">
          <strong>💡 טיפ קטן להתחלה:</strong><br/>
          כדי שהסיפור הראשון יהיה מושלם, כדאי להוסיף כמה שיותר פרטים מעניינים בתיבת הטקסט החופשי – זה מה שהופך את הסיפור לבלתי נשכח!
        </div>

        <p>אנחנו כאן לכל שאלה, רעיון או שיתוף בחוויה שלכם.</p>

        <div class="cta-wrapper">
          <a href="${appUrl}" class="cta-button">יוצאים להרפתקה? ✨</a>
        </div>

        <div class="signature">
          באהבה,<br/>
          צוות SolStories 💜
        </div>

        <div class="ps-note">
          💳 נ.ב. ניתן לשלם על חבילות סיפורים נוספות גם בכרטיס אשראי, ללא צורך בחשבון פייפאל.
        </div>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} SolStorie's™ · כל הזכויות שמורות
      </div>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SolStories <noreply@soulstory.co.il>",
        to: [email],
        subject: "ברוכים הבאים למשפחת SolStories! ✨ הקסם מתחיל עכשיו",
        html: htmlBody,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send welcome email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Welcome email error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
