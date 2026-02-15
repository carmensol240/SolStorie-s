import { useState } from "react";
import { Download, FileText, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GoldenHeartRewardsProps {
  childName: string;
  isUnlocked: boolean;
}

// Load Heebo font as base64 for jspdf Hebrew support
let heeboFontBase64: string | null = null;
async function loadHeeboFont(): Promise<string> {
  if (heeboFontBase64) return heeboFontBase64;
  const response = await fetch(new URL("@/assets/fonts/Heebo-Regular.woff2", import.meta.url).href);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  heeboFontBase64 = btoa(binary);
  return heeboFontBase64;
}

async function generateCertificate(childName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const fontBase64 = await loadHeeboFont();
  doc.addFileToVFS("Heebo-Regular.woff2", fontBase64);
  doc.addFont("Heebo-Regular.woff2", "Heebo", "normal");
  doc.setFont("Heebo");

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Decorative border
  doc.setDrawColor(168, 85, 247); // purple
  doc.setLineWidth(2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setDrawColor(236, 72, 153); // pink
  doc.setLineWidth(1);
  doc.rect(14, 14, w - 28, h - 28);

  // Corner stars
  const corners = [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]];
  doc.setFontSize(16);
  corners.forEach(([x, y]) => doc.text("⭐", x, y, { align: "center" }));

  // Title
  doc.setFontSize(28);
  doc.setTextColor(168, 85, 247);
  doc.text("SolStorie's™", w / 2, 38, { align: "center" });

  // Subtitle
  doc.setFontSize(22);
  doc.setTextColor(60, 60, 60);
  doc.text("\u202B" + "תעודת חברות רשמית" + "\u202C", w / 2, 55, { align: "center" });

  // Heart emoji
  doc.setFontSize(40);
  doc.text("💛", w / 2, 78, { align: "center" });

  // Child name
  doc.setFontSize(30);
  doc.setTextColor(168, 85, 247);
  doc.text("\u202B" + childName + "\u202C", w / 2, 100, { align: "center" });

  // Official friend text
  doc.setFontSize(18);
  doc.setTextColor(80, 80, 80);
  doc.text("\u202B" + "החבר/ה הרשמי/ת של סול" + "\u202C", w / 2, 118, { align: "center" });

  // Date
  const dateStr = new Date().toLocaleDateString("he-IL");
  doc.setFontSize(12);
  doc.setTextColor(120, 120, 120);
  doc.text("\u202B" + `תאריך: ${dateStr}` + "\u202C", w / 2, 140, { align: "center" });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("SolStorie's™ | \u202B" + "כל הזכויות שמורות" + "\u202C", w / 2, h - 16, { align: "center" });

  doc.save(`certificate-${childName}.pdf`);
}

async function generateColoringPage(childName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const fontBase64 = await loadHeeboFont();
  doc.addFileToVFS("Heebo-Regular.woff2", fontBase64);
  doc.addFont("Heebo-Regular.woff2", "Heebo", "normal");
  doc.setFont("Heebo");

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(168, 85, 247);
  doc.text("SolStorie's™", w / 2, 18, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(80, 80, 80);
  doc.text("\u202B" + `דף צביעה מיוחד עבור ${childName}` + "\u202C", w / 2, 30, { align: "center" });

  // Draw Sol character outline (simple geometric shapes)
  const cx = w / 2;
  const cy = 110;

  // Body (dress/triangle)
  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(1.2);
  doc.triangle(cx - 30, cy + 50, cx + 30, cy + 50, cx, cy);

  // Head
  doc.circle(cx, cy - 15, 18);

  // Eyes
  doc.circle(cx - 7, cy - 18, 3);
  doc.circle(cx + 7, cy - 18, 3);

  // Smile
  doc.setDrawColor(236, 72, 153);
  doc.setLineWidth(1);
  const smilePoints: [number, number][] = [];
  for (let i = 0; i <= 20; i++) {
    const angle = (Math.PI * i) / 20;
    smilePoints.push([cx - 8 + 16 * (i / 20), cy - 8 + Math.sin(angle) * 4]);
  }
  for (let i = 1; i < smilePoints.length; i++) {
    doc.line(smilePoints[i - 1][0], smilePoints[i - 1][1], smilePoints[i][0], smilePoints[i][1]);
  }

  // Hair (arcs on top)
  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(1.2);
  doc.line(cx - 18, cy - 28, cx - 5, cy - 38);
  doc.line(cx - 5, cy - 38, cx + 5, cy - 38);
  doc.line(cx + 5, cy - 38, cx + 18, cy - 28);

  // Arms
  doc.line(cx - 30, cy + 20, cx - 45, cy + 5);
  doc.line(cx + 30, cy + 20, cx + 45, cy + 5);

  // Stars around
  doc.setFontSize(20);
  doc.setTextColor(200, 200, 200);
  const starPositions = [[30, 70], [w - 30, 70], [30, 170], [w - 30, 170], [cx, 190]];
  starPositions.forEach(([x, y]) => doc.text("☆", x, y, { align: "center" }));

  // Hearts to color
  doc.setFontSize(24);
  [[40, 220], [w - 40, 220], [cx, 230]].forEach(([x, y]) => doc.text("♡", x, y, { align: "center" }));

  // Instruction text
  doc.setFont("Heebo");
  doc.setFontSize(12);
  doc.setTextColor(150, 150, 150);
  doc.text("\u202B" + "צבעו את הדמויות והכוכבים!" + "\u202C", w / 2, 250, { align: "center" });

  // Footer
  doc.setFontSize(9);
  doc.text("SolStorie's™ | \u202B" + "כל הזכויות שמורות" + "\u202C", w / 2, h - 10, { align: "center" });

  doc.save(`coloring-page-${childName}.pdf`);
}

const GoldenHeartRewards = ({ childName, isUnlocked }: GoldenHeartRewardsProps) => {
  const [generating, setGenerating] = useState<"certificate" | "coloring" | null>(null);

  if (!isUnlocked) return null;

  const handleDownload = async (type: "certificate" | "coloring") => {
    setGenerating(type);
    try {
      if (type === "certificate") {
        await generateCertificate(childName);
      } else {
        await generateColoringPage(childName);
      }
      toast.success(type === "certificate" ? "התעודה הורדה בהצלחה! 🎉" : "דף הצביעה הורד בהצלחה! 🎨");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("שגיאה ביצירת הקובץ");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "hsl(260, 40%, 30%)" }}>
        <span className="text-lg">💛</span>
        פרסי לב הזהב
      </h2>
      <div
        className="backdrop-blur-xl rounded-[20px] p-4 space-y-3"
        style={{
          background: "rgba(255,255,255,0.35)",
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        }}
      >
        <p className="text-xs text-center font-medium" style={{ color: "hsl(260, 30%, 40%)" }}>
          🎉 מזל טוב! פתחתם את לב הזהב — הנה הפרסים שלכם:
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => handleDownload("coloring")}
            disabled={generating !== null}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-xs rounded-xl h-10"
          >
            <FileText className="w-4 h-4 ml-1" />
            {generating === "coloring" ? "יוצר..." : "דף צביעה"}
          </Button>
          <Button
            onClick={() => handleDownload("certificate")}
            disabled={generating !== null}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl h-10"
          >
            <Award className="w-4 h-4 ml-1" />
            {generating === "certificate" ? "יוצר..." : "תעודת חברות"}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GoldenHeartRewards;
