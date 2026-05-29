import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import { translateTopic } from '@/lib/topic-translations';
import solMagicBookCover from '@/assets/sol-magic-book-cover.png';

// Helper function to escape HTML entities and prevent XSS
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

interface StoryPage {
  page_number: number;
  text: string;
  illustration_url: string | null;
}

interface Story {
  id: string;
  child_name: string;
  topic: string;
  language?: string;
  age_range?: string;
  cover_url?: string | null;
  pages: StoryPage[];
}

interface VirtualPdfPage {
  text: string;
  illustration_url: string | null;
  page_number: number;
}

// Rainbow gradient for decorative fallback
const RAINBOW_CSS = 'linear-gradient(135deg, #FFE4E1 0%, #FFDAB9 15%, #FFFACD 30%, #E0FFE0 45%, #E0F0FF 60%, #E8D8FF 75%, #FFE4F0 90%, #FFE4E1 100%)';

export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { fetchSignedUrls } = useSignedUrls();

  const loadImageAsDataUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      console.warn('Failed to convert image to data URL, using original');
      return url;
    }
  };

  // ─── Native jsPDF footer (no html2canvas) ───────────────────
  const drawFooter = (pdf: jsPDF) => {
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    // Square px units now — scale margins relative to page size
    const margin = Math.round(W * 0.025);
    const lineY = H - Math.round(W * 0.045);
    const brandY = H - Math.round(W * 0.030);
    const urlY = H - Math.round(W * 0.013);

    pdf.setDrawColor(212, 165, 116);
    pdf.setLineWidth(1);
    pdf.line(margin, lineY, W - margin, lineY);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(Math.round(W * 0.011));
    pdf.setTextColor(147, 51, 234);
    pdf.text("SolStorie's\u2122", W / 2, brandY, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(Math.round(W * 0.010));
    pdf.setTextColor(37, 99, 235);
    pdf.textWithLink('soulstory.co.il', W / 2, urlY, {
      url: 'https://soulstory.co.il',
      align: 'center',
    });
  };

  // ─── html2canvas page capture ──
  const captureHtmlToPage = async (
    content: HTMLDivElement,
    pdf: jsPDF,
    isFirstPage: boolean,
    skipFooter: boolean = false
  ) => {
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
    });
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (!isFirstPage) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    if (!skipFooter) drawFooter(pdf);
  };

  // ─── Build virtual pages (merge for toddlers 0-2) ──
  const buildVirtualPages = (story: Story): VirtualPdfPage[] => {
    const pages = story.pages;
    const isToddler = story.age_range === '0-2';

    if (isToddler) {
      const result: VirtualPdfPage[] = [];
      for (let i = 0; i < pages.length; i += 2) {
        const p1 = pages[i];
        const p2 = pages[i + 1];
        result.push({
          text: p2 ? `${p1.text}\n${p2.text}` : p1.text,
          illustration_url: p1.illustration_url,
          page_number: result.length + 1,
        });
      }
      return result;
    }

    return pages.map((p, i) => ({
      text: p.text,
      illustration_url: p.illustration_url,
      page_number: i + 1,
    }));
  };

  // ─── Cover Page: Sol with magic book as full-bleed background ──
  const renderCoverPage = async (
    childName: string,
    topic: string,
    language?: string,
    coverUrl?: string | null,
  ): Promise<HTMLDivElement> => {
    const coverDataUrl = coverUrl
      ? await loadImageAsDataUrl(coverUrl).catch(() => loadImageAsDataUrl(solMagicBookCover))
      : await loadImageAsDataUrl(solMagicBookCover);
    const hebrewTopic = translateTopic(topic, language);
    const coverPage = document.createElement('div');
    coverPage.style.cssText = `
      width: 100%; height: 100%; position: relative; overflow: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
      direction: rtl; font-family: Heebo, Assistant, sans-serif;
    `;
    coverPage.innerHTML = `
      <img src="${coverDataUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
      <div style="position:absolute;top:40px;right:40px;z-index:2;
        background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);
        border-radius:999px;padding:10px 22px;color:#ffffff;font-size:22px;font-weight:600;
        text-shadow:0 1px 4px rgba(0,0,0,0.4);">✨ SolStorie's™</div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:55%;
        background:linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 50%, transparent 100%);"></div>
      <div style="position:absolute;bottom:0;left:0;right:0;z-index:1;text-align:center;padding:0 80px 60px 80px;">
        <h1 style="color:#ffffff;font-size:88px;font-weight:900;margin:0 0 20px 0;line-height:1.1;
          text-shadow:0 2px 10px rgba(0,0,0,0.7);">${escapeHtml(hebrewTopic)}</h1>
        <p style="color:#FFD66B;font-size:42px;font-weight:700;margin:0 0 50px 0;
          text-shadow:0 2px 8px rgba(0,0,0,0.6);">💛 הסיפור של ${escapeHtml(childName)}</p>
        <p style="color:rgba(255,255,255,0.75);font-size:20px;font-weight:500;margin:0;
          letter-spacing:0.5px;">SolStorie's™ · soulstory.co.il</p>
      </div>
    `;
    return coverPage;
  };

  // ─── Dedication Page: clean white page with handwriting lines ──
  const renderDedicationPage = (_childName: string): HTMLDivElement => {
    const page = document.createElement('div');
    page.style.cssText = `
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-start; text-align: center;
      background: #ffffff; direction: rtl;
      font-family: Heebo, Assistant, sans-serif; position: relative;
      padding: 200px 140px 180px 140px; box-sizing: border-box;
    `;
    const lines = Array.from({ length: 9 })
      .map(() => `<div style="height:0;border-bottom:2px solid #d4d4d8;margin:0 0 80px 0;"></div>`) 
      .join('');
    page.innerHTML = `
      <p style="color:#1f2937;font-size:56px;font-weight:700;margin:0 0 120px 0;line-height:1.5;">
        הַסִּפּוּר הַזֶּה נִכְתַּב בִּמְיֻחָד עֲבוּר ______________
      </p>
      <div style="width:100%;text-align:right;">${lines}</div>
    `;
    return page;
  };

  // ─── Text-only white page ──
  const renderTextOnlyPage = (text: string): HTMLDivElement => {
    const pageEl = document.createElement('div');
    pageEl.style.cssText = `
      width: 100%; height: 100%; background:#ffffff; display:flex;
      align-items:center; justify-content:center; padding:180px 160px;
      box-sizing:border-box; direction:rtl;
      font-family: Heebo, Assistant, sans-serif;
    `;
    pageEl.innerHTML = `
      <p style="color:#1f2937;font-size:54px;line-height:1.9;font-weight:500;margin:0;
        text-align:center;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-line;">
        ${escapeHtml(text)}
      </p>
    `;
    return pageEl;
  };

  // ─── Illustration-only white page ──
  const renderIllustrationOnlyPage = (illustrationDataUrl: string | null): HTMLDivElement => {
    const pageEl = document.createElement('div');
    pageEl.style.cssText = `
      width: 100%; height: 100%; background:#ffffff; display:flex;
      align-items:center; justify-content:center; padding:80px;
      box-sizing:border-box;
    `;
    pageEl.innerHTML = illustrationDataUrl
      ? `<img src="${illustrationDataUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" />`
      : `<div style="width:100%;height:100%;background:${RAINBOW_CSS};border-radius:24px;"></div>`;
    return pageEl;
  };

  // ─── Back Cover Page: brand purple background ──
  const renderBackCoverPage = async (childName: string): Promise<HTMLDivElement> => {
    const qrDataUrl = await QRCode.toDataURL('https://soulstory.co.il', {
      width: 360,
      margin: 1,
      color: { dark: '#1a0a3e', light: '#ffffff' },
    });
    const today = new Date().toLocaleDateString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const page = document.createElement('div');
    page.style.cssText = `
      width: 100%; height: 100%; position: relative; overflow: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      direction: rtl; font-family: Heebo, Assistant, sans-serif;
      background: linear-gradient(160deg, #1a0a3e 0%, #2a1050 45%, #3b1466 100%);
      padding: 120px 100px; box-sizing: border-box; text-align: center;
    `;
    page.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="color:#FFD66B;font-size:96px;font-weight:900;letter-spacing:1px;
          text-shadow:0 2px 12px rgba(0,0,0,0.5);">✨ SolStorie's™</div>
        <p style="color:#ffffff;font-size:48px;font-weight:700;margin:60px 0 0 0;line-height:1.4;">
          כל ילד הוא גיבור הסיפור שלו ✨
        </p>
        <p style="color:rgba(255,255,255,0.85);font-size:32px;font-weight:500;margin:30px 0 0 0;line-height:1.5;">
          סיפורים מותאמים אישית עם הילד שלך כגיבור
        </p>
      </div>

      <div style="display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.18);border-radius:32px;padding:40px 60px;">
        <img src="${qrDataUrl}" style="width:280px;height:280px;border-radius:16px;background:#ffffff;padding:14px;" />
        <p style="color:#ffffff;font-size:28px;font-weight:600;margin:24px 0 6px 0;">
          סרקו ליצירת הסיפור הבא של הילד שלכם 📱✨
        </p>
        <p style="color:#FFD66B;font-size:22px;font-weight:500;margin:0;letter-spacing:0.5px;">
          soulstory.co.il
        </p>
      </div>

      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
        <p style="color:rgba(255,255,255,0.75);font-size:22px;font-weight:500;margin:0;">
          הסיפור של ${escapeHtml(childName)} · נוצר ב-${today}
        </p>
        <p style="color:rgba(255,255,255,0.5);font-size:18px;font-weight:400;margin:0;">
          © SolStorie's™ · כל הזכויות שמורות
        </p>
      </div>
    `;
    return page;
  };

  // ─── Square PDF builder ──
  const exportSquare = async (story: Story) => {
    const illustrationUrls = story.pages
      .map(p => p.illustration_url)
      .filter((url): url is string => !!url);
    // Include the cover image so it gets a signed URL too — otherwise the private bucket
    // returns 401 and we fall back to the generic app cover.
    const urlsToSign = [...illustrationUrls];
    if (story.cover_url) urlsToSign.push(story.cover_url);
    const signedUrlMap = await fetchSignedUrls(urlsToSign, story.id);

    const SIZE = 2480;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [SIZE, SIZE],
      hotfixes: ['px_scaling'],
    });

    // Design canvas is 1240px (scale:2 in html2canvas → 2480px output)
    const designSize = 1240;
    const container = document.createElement('div');
    container.style.cssText = `position:absolute;left:-9999px;top:0;width:${designSize}px;height:${designSize}px;font-family:Heebo,Assistant,sans-serif;direction:rtl;`;
    document.body.appendChild(container);

    // -- 1. Cover page (uses existing app cover_url) --
    container.innerHTML = '';
    const signedCoverUrl = story.cover_url
      ? (signedUrlMap[story.cover_url] || story.cover_url)
      : null;
    const coverEl = await renderCoverPage(story.child_name, story.topic, story.language, signedCoverUrl);
    container.appendChild(coverEl);
    await captureHtmlToPage(container, pdf, true, true);

    // -- 2. Dedication page --
    container.innerHTML = '';
    container.appendChild(renderDedicationPage(story.child_name));
    await captureHtmlToPage(container, pdf, false);

    // -- 3+. For each story page: text-only page, then illustration-only page --
    const vPages = buildVirtualPages(story);
    for (const vPage of vPages) {
      // Text page
      container.innerHTML = '';
      container.appendChild(renderTextOnlyPage(vPage.text));
      await captureHtmlToPage(container, pdf, false);

      // Illustration page
      let illustrationDataUrl: string | null = null;
      if (vPage.illustration_url) {
        try {
          const resolvedUrl = signedUrlMap[vPage.illustration_url] || vPage.illustration_url;
          illustrationDataUrl = await loadImageAsDataUrl(resolvedUrl);
        } catch { /* skip */ }
      }
      // Only add an illustration page when we actually have an illustration —
      // otherwise we'd render an empty rainbow placeholder page.
      if (illustrationDataUrl) {
        container.innerHTML = '';
        container.appendChild(renderIllustrationOnlyPage(illustrationDataUrl));
        await captureHtmlToPage(container, pdf, false);
      }
    }

    // -- Last. Back cover page --
    container.innerHTML = '';
    const backCoverEl = await renderBackCoverPage(story.child_name);
    container.appendChild(backCoverEl);
    await captureHtmlToPage(container, pdf, false, true);

    document.body.removeChild(container);
    return pdf;
  };

  const makePdfFileName = (story: Story) => {
    const safeName = story.child_name.replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    return `SoulStory_${safeName}_${story.id.slice(0, 8)}.pdf`;
  };

  const buildPdf = async (story: Story) => {
    return await exportSquare(story);
  };

  const exportToPdf = async (story: Story) => {
    if (isExporting) return;
    setIsExporting(true);
    toast({ title: 'מכין את קובץ ה-PDF...' });

    try {
      const pdf = await buildPdf(story);
      const fileName = makePdfFileName(story);
      const blob = pdf.output('blob');
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

      // Use native share sheet on mobile if available
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `הסיפור של ${story.child_name}`,
          });
          toast({ title: 'ה-PDF שותף בהצלחה!' });
        } catch (shareErr: any) {
          if (shareErr?.name !== 'AbortError') {
            pdf.save(fileName);
            toast({ title: 'ה-PDF הורד בהצלחה!' });
          }
        }
      } else {
        pdf.save(fileName);
        toast({ title: 'ה-PDF הורד בהצלחה!' });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ title: 'שגיאה ביצירת ה-PDF', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const generatePdfFile = async (story: Story): Promise<File> => {
    const pdf = await buildPdf(story);
    const blob = pdf.output('blob');
    const fileName = makePdfFileName(story);
    return new File([blob], fileName, { type: 'application/pdf' });
  };

  return { exportToPdf, generatePdfFile, isExporting };
};
