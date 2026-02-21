import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useSignedUrls } from '@/hooks/use-signed-urls';

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
  pages: StoryPage[];
}

interface Spread {
  illustration_url: string | null;
  texts: string[];
  pageNumbers: number[];
}

export type PdfLayout = 'portrait' | 'landscape-book';

/** Build spreads: pair pages so one illustration covers two text blocks */
const buildSpreads = (pages: StoryPage[]): Spread[] => {
  const spreads: Spread[] = [];
  for (let i = 0; i < pages.length; i += 2) {
    const first = pages[i];
    const second = pages[i + 1];
    spreads.push({
      illustration_url: first.illustration_url,
      texts: second ? [first.text, second.text] : [first.text],
      pageNumbers: second ? [first.page_number, second.page_number] : [first.page_number],
    });
  }
  return spreads;
};

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

    // Separator line
    pdf.setDrawColor(212, 165, 116);
    pdf.setLineWidth(0.3);
    pdf.line(20, H - 18, W - 20, H - 18);

    // Brand name (purple, bold)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(147, 51, 234);
    pdf.text("SolStorie's\u2122", W / 2, H - 13, { align: 'center' });

    // Clickable URL (blue)
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

  const renderCoverPage = (childName: string, topic: string): HTMLDivElement => {
    const coverPage = document.createElement('div');
    coverPage.style.cssText = `
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #F5E6D3 0%, #FFF8E7 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 40px; box-sizing: border-box; direction: rtl;
    `;
    coverPage.innerHTML = `
      <div style="border: 4px double #8B4513; border-radius: 16px; padding: 48px;
        background: rgba(255,248,231,0.9); text-align: center; max-width: 80%;">
        <div style="color: #8B4513; font-size: 14px; margin-bottom: 24px;">✦ סיפור מיוחד ✦</div>
        <h1 style="color: #8B4513; font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.4;">הסיפור של</h1>
        <h2 style="color: #9333ea; font-size: 42px; font-weight: bold; margin: 0 0 24px 0;">${escapeHtml(childName)}</h2>
        <p style="color: #6B4423; font-size: 18px; margin: 0; line-height: 1.6;">${escapeHtml(topic)}</p>
      </div>
    `;
    return coverPage;
  };

  // ─── Portrait - fully html2canvas based for Hebrew support ──
  const exportPortrait = async (story: Story) => {
    const illustrationUrls = story.pages
      .map(p => p.illustration_url)
      .filter((url): url is string => !!url);
    const signedUrlMap = await fetchSignedUrls(illustrationUrls, story.id);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();   // 210mm
    const H = pdf.internal.pageSize.getHeight();  // 297mm

    const pageWidthPx = W * 3.78;
    const pageHeightPx = H * 3.78;
    const container = document.createElement('div');
    container.style.cssText = `position:absolute;left:-9999px;top:0;width:${pageWidthPx}px;height:${pageHeightPx}px;font-family:Heebo,Assistant,sans-serif;direction:rtl;`;
    document.body.appendChild(container);

    // -- Cover page --
    container.innerHTML = '';
    container.appendChild(renderCoverPage(story.child_name, story.topic));
    await captureHtmlToPage(container, pdf, true);

    // -- Story pages: render each as HTML via html2canvas --
    for (const page of story.pages) {
      let illustrationDataUrl: string | null = null;
      if (page.illustration_url) {
        try {
          const resolvedUrl = signedUrlMap[page.illustration_url] || page.illustration_url;
          illustrationDataUrl = await loadImageAsDataUrl(resolvedUrl);
        } catch {
          // skip illustration
        }
      }

      const pageEl = document.createElement('div');
      pageEl.style.cssText = `
        width: 100%; height: 100%;
        background: linear-gradient(135deg, #FFFBF5 0%, #FFF8E7 100%);
        display: flex; flex-direction: column; align-items: center;
        padding: 60px 70px 80px 70px; box-sizing: border-box; direction: rtl;
        font-family: Heebo, Assistant, sans-serif;
      `;

      const illustrationHtml = illustrationDataUrl
        ? `<div style="width:100%;flex-shrink:0;margin-bottom:20px;border-radius:12px;overflow:hidden;border:2px solid #D4A574;max-height:40%;">
            <img src="${illustrationDataUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />
          </div>`
        : '';

      const pageLabel = `✦ ${page.page_number} / ${story.pages.length} ✦`;

      pageEl.innerHTML = `
        ${illustrationHtml}
        <div style="color:#8B4513;font-size:16px;margin-bottom:16px;text-align:center;">${pageLabel}</div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;width:100%;overflow:hidden;">
          <p style="color:#4A3728;font-size:26px;line-height:2.2;text-align:center;margin:0;
            font-family:Heebo,Assistant,sans-serif;max-width:95%;word-wrap:break-word;overflow-wrap:break-word;">
            ${escapeHtml(page.text)}
          </p>
        </div>
        <div style="width:60%;height:2px;background:#D4A574;border-radius:1px;margin-top:16px;"></div>
      `;

      container.innerHTML = '';
      container.appendChild(pageEl);
      await captureHtmlToPage(container, pdf, false);
    }

    document.body.removeChild(container);
    pdf.save(`סיפור-${story.child_name.replace(/\s+/g, '-')}.pdf`);
  };

  // ─── Landscape Book ─────────────────────────────────────────
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
    const coverPage = document.createElement('div');
    coverPage.style.cssText = `width:100%;height:100%;background:linear-gradient(135deg,#F5E6D3 0%,#FFF8E7 50%,#F5E6D3 100%);
      display:flex;align-items:center;justify-content:center;direction:rtl;`;
    coverPage.innerHTML = `
      <div style="border:4px double #8B4513;border-radius:20px;padding:48px 80px;
        background:rgba(255,248,231,0.95);text-align:center;box-shadow:0 12px 40px rgba(139,69,19,0.25);">
        <div style="color:#8B4513;font-size:16px;margin-bottom:28px;letter-spacing:4px;">✦ סיפור מיוחד ✦</div>
        <h1 style="color:#8B4513;font-size:40px;font-weight:bold;margin:0 0 16px 0;line-height:1.4;">הסיפור של</h1>
        <h2 style="color:#9333ea;font-size:56px;font-weight:bold;margin:0 0 28px 0;">${escapeHtml(story.child_name)}</h2>
        <p style="color:#6B4423;font-size:24px;margin:0;line-height:1.6;">${escapeHtml(story.topic)}</p>
      </div>`;
    container.innerHTML = '';
    container.appendChild(coverPage);
    await captureHtmlToPage(container, pdf, true);

    // Spreads
    const spreads = buildSpreads(story.pages);
    const totalPages = story.pages.length;

    for (let si = 0; si < spreads.length; si++) {
      const spread = spreads[si];
      const pageLabel = spread.pageNumbers.length > 1
        ? `${spread.pageNumbers[0]}-${spread.pageNumbers[1]} / ${totalPages}`
        : `${spread.pageNumbers[0]} / ${totalPages}`;

      const hasIllustration = !!spread.illustration_url;
      let illustrationHtml = '';

      if (hasIllustration) {
        try {
          const resolvedUrl = signedUrlMap[spread.illustration_url!] || spread.illustration_url!;
          const dataUrl = await loadImageAsDataUrl(resolvedUrl);
          illustrationHtml = `
            <img src="${dataUrl}" style="max-width:90%;max-height:90%;border-radius:16px;
              box-shadow:0 8px 32px rgba(139,69,19,0.25);object-fit:contain;" />`;
        } catch { /* skip */ }
      }

      const textBlocks = spread.texts.map((t, idx) => `
        ${idx > 0 ? '<div style="width:50%;height:2px;background:#D4A574;margin:16px auto;border-radius:1px;"></div>' : ''}
        <p style="color:#4A3728;font-size:30px;line-height:2;text-align:center;margin:0;
          font-family:Heebo,Assistant,sans-serif;max-width:85%;">${escapeHtml(t)}</p>
      `).join('');

      const spreadPage = document.createElement('div');

      if (hasIllustration && illustrationHtml) {
        spreadPage.style.cssText = `width:100%;height:100%;display:flex;direction:rtl;
          background:linear-gradient(to right,#FFF8E7 0%,#FFF8E7 49.5%,#D4A574 49.5%,#8B4513 50%,#D4A574 50.5%,#FFF8E7 50.5%,#FFF8E7 100%);`;
        spreadPage.innerHTML = `
          <div style="flex:1;display:flex;align-items:center;justify-content:center;
            background:linear-gradient(135deg,#FFF8E7 0%,#F5E6D3 100%);padding:24px;">
            ${illustrationHtml}
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
            background:#FFF8E7;padding:40px;position:relative;">
            <div style="position:absolute;top:20px;right:20px;color:#D4A574;font-size:24px;">❧</div>
            ${textBlocks}
            <div style="position:absolute;bottom:60px;left:50%;transform:translateX(-50%);color:#8B4513;font-size:18px;">
              ✦ ${pageLabel} ✦
            </div>
            <div style="position:absolute;bottom:20px;left:20px;color:#D4A574;font-size:24px;transform:rotate(180deg);">❧</div>
          </div>`;
      } else {
        spreadPage.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;
          background:linear-gradient(135deg,#FFF8E7 0%,#F5E6D3 100%);direction:rtl;`;
        spreadPage.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
            padding:40px;max-width:80%;position:relative;">
            <div style="position:absolute;top:-20px;right:0;color:#D4A574;font-size:24px;">❧</div>
            ${textBlocks}
            <div style="position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);color:#8B4513;font-size:18px;">
              ✦ ${pageLabel} ✦
            </div>
          </div>`;
      }

      container.innerHTML = '';
      container.appendChild(spreadPage);
      await captureHtmlToPage(container, pdf, false);
    }

    document.body.removeChild(container);
    pdf.save(`ספר-${story.child_name.replace(/\s+/g, '-')}.pdf`);
  };

  const exportToPdf = async (story: Story, layout: PdfLayout = 'portrait') => {
    if (isExporting) return;
    setIsExporting(true);
    toast({ title: 'מכין את קובץ ה-PDF...' });

    try {
      if (layout === 'landscape-book') {
        await exportLandscapeBook(story);
      } else {
        await exportPortrait(story);
      }
      toast({ title: 'ה-PDF הורד בהצלחה!' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ title: 'שגיאה ביצירת ה-PDF', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPdf, isExporting };
};
