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
  age_range?: string;
  pages: StoryPage[];
}

interface VirtualPdfPage {
  text: string;
  illustration_url: string | null;
  page_number: number;
}

export type PdfLayout = 'portrait' | 'landscape-book';

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

  // ─── Fullscreen story page: illustration background + gradient overlay + white text ──
  const renderFullscreenStoryPage = (
    text: string,
    illustrationDataUrl: string | null,
    pageNumber: number,
    totalPages: number
  ): HTMLDivElement => {
    const pageEl = document.createElement('div');
    pageEl.style.cssText = `
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: Heebo, Assistant, sans-serif; direction: rtl;
    `;

    const bgHtml = illustrationDataUrl
      ? `<img src="${illustrationDataUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />`
      : `<div style="position:absolute;inset:0;background:${RAINBOW_CSS};display:flex;align-items:center;justify-content:center;">
           <span style="font-size:80px;opacity:0.2;">✨</span>
         </div>`;

    pageEl.innerHTML = `
      ${bgHtml}
      <div style="position:absolute;bottom:0;left:0;right:0;height:45%;
        background:linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 60%, transparent 100%);"></div>
      <div style="position:absolute;bottom:0;left:0;right:0;z-index:1;padding:24px 32px 36px 32px;text-align:center;">
        <p style="color:white;font-size:24px;line-height:2;font-weight:600;margin:0;
          text-shadow:0 1px 3px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4);
          background:rgba(0,0,0,0.35);padding:12px 16px;border-radius:12px;backdrop-filter:blur(4px);
          word-wrap:break-word;overflow-wrap:break-word;white-space:pre-line;">
          ${escapeHtml(text)}
        </p>
        <div style="margin-top:12px;">
          <span style="font-size:12px;color:rgba(255,255,255,0.4);">${pageNumber} / ${totalPages}</span>
        </div>
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

    // -- Cover page --
    container.innerHTML = '';
    const coverEl = await renderCoverPage(story.child_name, story.topic, story.language);
    container.appendChild(coverEl);
    await captureHtmlToPage(container, pdf, true);

    // -- Dedication page --
    container.innerHTML = '';
    container.appendChild(renderDedicationPage(story.child_name));
    await captureHtmlToPage(container, pdf, false);

    // -- Story pages (fullscreen) --
    const vPages = buildVirtualPages(story);
    for (const vPage of vPages) {
      let illustrationDataUrl: string | null = null;
      if (vPage.illustration_url) {
        try {
          const resolvedUrl = signedUrlMap[vPage.illustration_url] || vPage.illustration_url;
          illustrationDataUrl = await loadImageAsDataUrl(resolvedUrl);
        } catch { /* skip */ }
      }

      container.innerHTML = '';
      container.appendChild(renderFullscreenStoryPage(vPage.text, illustrationDataUrl, vPage.page_number, vPages.length));
      await captureHtmlToPage(container, pdf, false);
    }

    // -- Closing page --
    container.innerHTML = '';
    const closingEl = await renderClosingPage();
    container.appendChild(closingEl);
    await captureHtmlToPage(container, pdf, false);

    document.body.removeChild(container);
    return pdf;
  };

  // ─── Landscape Book - fullscreen illustration per page ───────────────────
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

    // Cover
    container.innerHTML = '';
    const coverEl = await renderCoverPage(story.child_name, story.topic, story.language);
    container.appendChild(coverEl);
    await captureHtmlToPage(container, pdf, true);

    // Dedication
    container.innerHTML = '';
    container.appendChild(renderDedicationPage(story.child_name));
    await captureHtmlToPage(container, pdf, false);

    // Story pages (fullscreen)
    const vPages = buildVirtualPages(story);
    for (const vPage of vPages) {
      let illustrationDataUrl: string | null = null;
      if (vPage.illustration_url) {
        try {
          const resolvedUrl = signedUrlMap[vPage.illustration_url] || vPage.illustration_url;
          illustrationDataUrl = await loadImageAsDataUrl(resolvedUrl);
        } catch { /* skip */ }
      }

      container.innerHTML = '';
      container.appendChild(renderFullscreenStoryPage(vPage.text, illustrationDataUrl, vPage.page_number, vPages.length));
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

  const generatePdfFile = async (story: Story, layout: PdfLayout = 'portrait'): Promise<File> => {
    const pdf = await buildPdf(story, layout);
    const blob = pdf.output('blob');
    const fileName = makePdfFileName(story, layout);
    return new File([blob], fileName, { type: 'application/pdf' });
  };

  return { exportToPdf, generatePdfFile, isExporting };
};
