import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import { translateTopic } from '@/lib/topic-translations';
import solMagicBookCover from '@/assets/sol-magic-book-cover.png';
import castWavingFarewell from '@/assets/cast-waving-farewell.png';

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
  pages: StoryPage[];
}

export type PdfLayout = 'portrait' | 'landscape-book';

// Rainbow gradient matching the web viewer
const RAINBOW_CSS = 'linear-gradient(135deg, #FFE4E1 0%, #FFDAB9 15%, #FFFACD 30%, #E0FFE0 45%, #E0F0FF 60%, #E8D8FF 75%, #FFE4F0 90%, #FFE4E1 100%)';

// 20mm margin in pixels at 3.78 px/mm
const MARGIN_PX = Math.round(20 * 3.78); // ~76px

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

    pdf.setDrawColor(212, 165, 116);
    pdf.setLineWidth(0.3);
    pdf.line(20, H - 18, W - 20, H - 18);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(147, 51, 234);
    pdf.text("SolStorie's\u2122", W / 2, H - 13, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(37, 99, 235);
    pdf.textWithLink('soulstory.co.il', W / 2, H - 8, {
      url: 'https://soulstory.co.il',
      align: 'center',
    });
  };

  // ─── html2canvas page capture ──
  const captureHtmlToPage = async (
    content: HTMLDivElement,
    pdf: jsPDF,
    isFirstPage: boolean
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
    drawFooter(pdf);
  };

  // ─── Cover Page: Sol with magic book as full-bleed background ──
  const renderCoverPage = async (childName: string, topic: string, language?: string): Promise<HTMLDivElement> => {
    const coverDataUrl = await loadImageAsDataUrl(solMagicBookCover);
    const hebrewTopic = translateTopic(topic, language);
    const coverPage = document.createElement('div');
    coverPage.style.cssText = `
      width: 100%; height: 100%; position: relative; overflow: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
      direction: rtl; font-family: Heebo, Assistant, sans-serif;
    `;
    coverPage.innerHTML = `
      <img src="${coverDataUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
      <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%);"></div>
      <div style="position:relative;z-index:1;text-align:center;padding:0 40px 60px 40px;">
        <h1 style="color:white;font-size:32px;font-weight:900;margin:0 0 8px 0;text-shadow:0 2px 8px rgba(0,0,0,0.5);">הַסִּפּוּר שֶׁל</h1>
        <h2 style="font-size:46px;font-weight:900;margin:0 0 16px 0;
          background:linear-gradient(to right,#c4b5fd,#f9a8d4,#fdba74);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          text-shadow:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${escapeHtml(childName)}</h2>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px;">
          <div style="width:40px;height:2px;background:linear-gradient(to right,transparent,#f9a8d4);border-radius:2px;"></div>
          <span style="font-size:18px;">✨</span>
          <div style="width:40px;height:2px;background:linear-gradient(to left,transparent,#f9a8d4);border-radius:2px;"></div>
        </div>
        <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:0;font-weight:500;text-shadow:0 1px 4px rgba(0,0,0,0.4);">${escapeHtml(hebrewTopic)}</p>
      </div>
    `;
    return coverPage;
  };

  // ─── Dedication Page: Rainbow/unicorn design ──
  const renderDedicationPage = (childName: string): HTMLDivElement => {
    const page = document.createElement('div');
    page.style.cssText = `
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center;
      background: ${RAINBOW_CSS}; direction: rtl;
      font-family: Heebo, Assistant, sans-serif; position: relative;
    `;
    page.innerHTML = `
      <div style="max-width:80%;space-y:24px;">
        <div style="font-size:64px;margin-bottom:24px;">🦄</div>
        <p style="color:#6B4423;font-size:22px;font-weight:500;margin:0 0 12px 0;">הַסִּפּוּר מוּקְדָּשׁ בְּאַהֲבָה לְ-</p>
        <p style="font-size:48px;font-weight:900;margin:0 0 16px 0;
          background:linear-gradient(to right,#9333ea,#ec4899,#f97316);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;">${escapeHtml(childName)}</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
          <div style="width:32px;height:2px;background:linear-gradient(to right,transparent,#f472b6);border-radius:2px;"></div>
          <span style="font-size:16px;">💛</span>
          <div style="width:32px;height:2px;background:linear-gradient(to left,transparent,#f472b6);border-radius:2px;"></div>
        </div>
      </div>
      <div style="position:absolute;bottom:24px;left:0;right:0;text-align:center;">
        <span style="font-size:14px;color:rgba(139,115,85,0.5);font-weight:500;">SolStorie's™</span>
      </div>
    `;
    return page;
  };

  // ─── Closing Page: Cast waving farewell ──
  const renderClosingPage = async (): Promise<HTMLDivElement> => {
    const castDataUrl = await loadImageAsDataUrl(castWavingFarewell);
    const page = document.createElement('div');
    page.style.cssText = `
      width: 100%; height: 100%; position: relative; overflow: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
      font-family: Heebo, Assistant, sans-serif; direction: rtl;
    `;
    page.innerHTML = `
      <img src="${castDataUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
      <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, transparent 60%);"></div>
      <div style="position:relative;z-index:1;text-align:center;padding-bottom:48px;">
        <p style="color:white;font-size:36px;font-weight:bold;text-shadow:0 2px 8px rgba(0,0,0,0.5);margin:0 0 8px 0;">✦ סוֹף ✦</p>
        <p style="color:rgba(255,255,255,0.9);font-size:22px;font-weight:500;text-shadow:0 1px 4px rgba(0,0,0,0.4);margin:0 0 12px 0;">נִתְרָאֶה בַּסִּפּוּר הַבָּא!</p>
        <span style="font-size:14px;color:rgba(255,255,255,0.6);font-weight:500;">SolStorie's™</span>
      </div>
    `;
    return page;
  };

  // ─── Text-only story page with rainbow background ──
  const renderTextOnlyPage = (text: string, pageNumber: number, totalPages: number): HTMLDivElement => {
    const pageEl = document.createElement('div');
    pageEl.style.cssText = `
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: ${RAINBOW_CSS}; direction: rtl;
      font-family: Heebo, Assistant, sans-serif; padding: ${MARGIN_PX}px;
      box-sizing: border-box;
    `;
    pageEl.innerHTML = `
      <div style="flex:1;display:flex;align-items:center;justify-content:center;width:100%;">
        <p style="color:#3D2914;font-size:26px;line-height:2.2;text-align:center;margin:0;
          font-family:Heebo,Assistant,sans-serif;max-width:90%;word-wrap:break-word;overflow-wrap:break-word;font-weight:500;">
          ${escapeHtml(text)}
        </p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:16px;">
        <span style="font-size:12px;color:#B8A08C;">${pageNumber} / ${totalPages}</span>
        <span style="font-size:14px;color:rgba(139,115,85,0.5);font-weight:500;">SolStorie's™</span>
      </div>
    `;
    return pageEl;
  };

  // ─── Portrait - fully html2canvas based for Hebrew support ──
  const exportPortrait = async (story: Story) => {
    const illustrationUrls = story.pages
      .map(p => p.illustration_url)
      .filter((url): url is string => !!url);
    const signedUrlMap = await fetchSignedUrls(illustrationUrls, story.id);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    const pageWidthPx = W * 3.78;
    const pageHeightPx = H * 3.78;
    const container = document.createElement('div');
    container.style.cssText = `position:absolute;left:-9999px;top:0;width:${pageWidthPx}px;height:${pageHeightPx}px;font-family:Heebo,Assistant,sans-serif;direction:rtl;`;
    document.body.appendChild(container);

    // -- Cover page (Sol with magic book) --
    container.innerHTML = '';
    const coverEl = await renderCoverPage(story.child_name, story.topic, story.language);
    container.appendChild(coverEl);
    await captureHtmlToPage(container, pdf, true);

    // -- Dedication page (rainbow/unicorn) --
    container.innerHTML = '';
    container.appendChild(renderDedicationPage(story.child_name));
    await captureHtmlToPage(container, pdf, false);

    // -- Story pages --
    for (const page of story.pages) {
      if (page.illustration_url) {
        // Page with illustration
        let illustrationDataUrl: string | null = null;
        try {
          const resolvedUrl = signedUrlMap[page.illustration_url] || page.illustration_url;
          illustrationDataUrl = await loadImageAsDataUrl(resolvedUrl);
        } catch { /* skip */ }

        const pageEl = document.createElement('div');
        pageEl.style.cssText = `
          width: 100%; height: 100%;
          background: linear-gradient(135deg, #FFFBF5 0%, #FFF8E7 100%);
          display: flex; flex-direction: column; align-items: center;
          padding: ${MARGIN_PX}px ${MARGIN_PX}px ${MARGIN_PX + 20}px ${MARGIN_PX}px; box-sizing: border-box; direction: rtl;
          font-family: Heebo, Assistant, sans-serif;
        `;

        const illustrationHtml = illustrationDataUrl
          ? `<div style="width:100%;flex-shrink:0;margin-bottom:20px;border-radius:12px;overflow:hidden;border:2px solid #D4A574;max-height:40%;background:#F5E6D3;display:flex;align-items:center;justify-content:center;">
              <img src="${illustrationDataUrl}" style="width:100%;height:100%;object-fit:contain;display:block;" />
            </div>`
          : '';

        const pageLabel = `✦ ${page.page_number} / ${story.pages.length} ✦`;

        pageEl.innerHTML = `
          ${illustrationHtml}
          <div style="color:#8B4513;font-size:16px;margin-bottom:16px;text-align:center;">${pageLabel}</div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;width:100%;overflow:visible;">
            <p style="color:#3D2914;font-size:26px;line-height:2.2;text-align:center;margin:0;
              font-family:Heebo,Assistant,sans-serif;max-width:95%;word-wrap:break-word;overflow-wrap:break-word;font-weight:500;">
              ${escapeHtml(page.text)}
            </p>
          </div>
          <div style="width:60%;height:2px;background:#D4A574;border-radius:1px;margin-top:16px;"></div>
        `;

        container.innerHTML = '';
        container.appendChild(pageEl);
        await captureHtmlToPage(container, pdf, false);
      } else {
        // Text-only page — rainbow background
        container.innerHTML = '';
        container.appendChild(renderTextOnlyPage(page.text, page.page_number, story.pages.length));
        await captureHtmlToPage(container, pdf, false);
      }
    }

    // -- Closing page (cast waving farewell) --
    container.innerHTML = '';
    const closingEl = await renderClosingPage();
    container.appendChild(closingEl);
    await captureHtmlToPage(container, pdf, false);

    document.body.removeChild(container);
    return pdf;
  };

  // ─── Landscape Book - 1:1 page-to-spread ───────────────────
  const exportLandscapeBook = async (story: Story) => {
    const illustrationUrls = story.pages
      .map(p => p.illustration_url)
      .filter((url): url is string => !!url);
    const signedUrlMap = await fetchSignedUrls(illustrationUrls, story.id);

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const container = document.createElement('div');
    container.style.cssText = `position:absolute;left:-9999px;top:0;width:${pageWidth * 3.78}px;height:${pageHeight * 3.78}px;font-family:Heebo,Assistant,sans-serif;direction:rtl;`;
    document.body.appendChild(container);

    // Cover - Sol with magic book
    container.innerHTML = '';
    const coverEl = await renderCoverPage(story.child_name, story.topic, story.language);
    container.appendChild(coverEl);
    await captureHtmlToPage(container, pdf, true);

    // Dedication
    container.innerHTML = '';
    container.appendChild(renderDedicationPage(story.child_name));
    await captureHtmlToPage(container, pdf, false);

    // Each story page = one spread (illustration left, text right)
    const totalPages = story.pages.length;

    for (const page of story.pages) {
      const pageLabel = `${page.page_number} / ${totalPages}`;

      if (!page.illustration_url) {
        // Text-only page — rainbow background spread
        container.innerHTML = '';
        container.appendChild(renderTextOnlyPage(page.text, page.page_number, totalPages));
        await captureHtmlToPage(container, pdf, false);
        continue;
      }

      let illustrationHtml = '';
      try {
        const resolvedUrl = signedUrlMap[page.illustration_url] || page.illustration_url;
        const dataUrl = await loadImageAsDataUrl(resolvedUrl);
        illustrationHtml = `<img src="${dataUrl}" style="max-width:90%;max-height:90%;border-radius:16px;
          box-shadow:0 8px 32px rgba(139,69,19,0.25);object-fit:contain;" />`;
      } catch { /* skip */ }

      const spreadPage = document.createElement('div');
      spreadPage.style.cssText = `width:100%;height:100%;display:flex;direction:rtl;
        background:linear-gradient(to right,#FFF8E7 0%,#FFF8E7 49.5%,#D4A574 49.5%,#8B4513 50%,#D4A574 50.5%,#FFF8E7 50.5%,#FFF8E7 100%);`;

      spreadPage.innerHTML = `
        <div style="flex:1;display:flex;align-items:center;justify-content:center;
          background:linear-gradient(135deg,#FFF8E7 0%,#F5E6D3 100%);padding:${MARGIN_PX}px;box-sizing:border-box;">
          ${illustrationHtml || `
            <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;
              background:${RAINBOW_CSS};
              border-radius:16px;position:relative;">
              <div style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);
                font-size:14px;color:#8B7355;font-family:Heebo,Assistant,sans-serif;direction:ltr;">
                SolStorie's™
              </div>
            </div>
          `}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
          background:#FFF8E7;padding:${MARGIN_PX}px;box-sizing:border-box;position:relative;">
          <div style="position:absolute;top:${MARGIN_PX}px;right:${MARGIN_PX}px;color:#D4A574;font-size:24px;">❧</div>
          <p style="color:#3D2914;font-size:30px;line-height:2;text-align:center;margin:0;
            font-family:Heebo,Assistant,sans-serif;max-width:85%;word-wrap:break-word;overflow-wrap:break-word;font-weight:500;">${escapeHtml(page.text)}</p>
          <div style="position:absolute;bottom:${MARGIN_PX + 20}px;left:50%;transform:translateX(-50%);color:#8B4513;font-size:18px;">
            ✦ ${pageLabel} ✦
          </div>
          <div style="position:absolute;bottom:${MARGIN_PX}px;left:${MARGIN_PX}px;color:#D4A574;font-size:24px;transform:rotate(180deg);">❧</div>
        </div>`;

      container.innerHTML = '';
      container.appendChild(spreadPage);
      await captureHtmlToPage(container, pdf, false);
    }

    // Closing page
    container.innerHTML = '';
    const closingEl = await renderClosingPage();
    container.appendChild(closingEl);
    await captureHtmlToPage(container, pdf, false);

    document.body.removeChild(container);
    return pdf;
  };

  const makePdfFileName = (story: Story, layout: PdfLayout) => {
    const safeName = story.child_name.replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const prefix = layout === 'landscape-book' ? 'SoulStory_Book' : 'SoulStory';
    return `${prefix}_${safeName}_${story.id.slice(0, 8)}.pdf`;
  };

  const buildPdf = async (story: Story, layout: PdfLayout = 'portrait') => {
    if (layout === 'landscape-book') {
      return await exportLandscapeBook(story);
    }
    return await exportPortrait(story);
  };

  const exportToPdf = async (story: Story, layout: PdfLayout = 'portrait') => {
    if (isExporting) return;
    setIsExporting(true);
    toast({ title: 'מכין את קובץ ה-PDF...' });

    try {
      const pdf = await buildPdf(story, layout);
      const fileName = makePdfFileName(story, layout);
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
          // User cancelled share — fall back to download
          if (shareErr?.name !== 'AbortError') {
            pdf.save(fileName);
            toast({ title: 'ה-PDF הורד בהצלחה!' });
          }
        }
      } else {
        // Desktop fallback — direct download
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

  const generatePdfFile = async (story: Story, layout: PdfLayout = 'portrait'): Promise<File> => {
    const pdf = await buildPdf(story, layout);
    const blob = pdf.output('blob');
    const fileName = makePdfFileName(story, layout);
    return new File([blob], fileName, { type: 'application/pdf' });
  };

  return { exportToPdf, generatePdfFile, isExporting };
};
